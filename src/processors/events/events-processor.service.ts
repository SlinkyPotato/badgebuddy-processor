import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Model } from 'mongoose';
import {
  CommunityEvent,
  DiscordParticipant,
} from '@solidchain/badge-buddy-common';
import { Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client, VoiceChannel } from 'discord.js';

@Processor('events')
export class EventsProcessor {
  constructor(
    private readonly logger: Logger,
    @InjectModel(CommunityEvent.name)
    private communityEventModel: Model<CommunityEvent>,
    private discordParticipantModel: Model<DiscordParticipant>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDiscordClient() private readonly discordClient: Client,
  ) {}

  @Process('start')
  async start(job: Job<{ eventId: string }>) {
    const eventId = job.data.eventId;
    this.logger.log(`Processing start event ${eventId}...`);
    const communityEvent = await this.communityEventModel.findOne({
      _id: eventId,
    });
    if (!communityEvent) {
      this.logger.error(`Event ${eventId} not found`);
      return;
    }
    this.logger.log(`Event ${eventId} found`);

    this.logger.log(`Fetching voice channel ${communityEvent.voiceChannelId}`);
    const voiceChannel = (await this.discordClient.channels.fetch(
      communityEvent.voiceChannelId,
    )) as VoiceChannel | null;

    if (!voiceChannel) {
      this.logger.error(
        `voiceChannelId: ${communityEvent.voiceChannelId} not found`,
      );
      return;
    }
    this.logger.log(`Fetched voice channel ${communityEvent.voiceChannelId}`);

    this.logger.log(`Processing members in voice channel ${voiceChannel.name}`);

    const discordParticipants: DiscordParticipant[] = [];
    for (const member of voiceChannel.members.values()) {
      if (member.voice.deaf) {
        this.logger.warn(
          `Skipping deaf member tag: ${member.user.tag}, userId: ${member.id}`,
        );
        continue;
      }

      const discordParticipant = new DiscordParticipant();
      discordParticipant.guildId = communityEvent.guildId;
      discordParticipant.userId = member.id;
      discordParticipant.userTag = member.user.tag;
      discordParticipant.voiceChannelId = communityEvent.voiceChannelId;
      discordParticipant.startDate = new Date();
      discordParticipant.durationInMinutes = 0;

      await this.cacheManager.set(
        `tracking:events:${eventId}:participants:${member.id}`,
        discordParticipant,
      );

      discordParticipants.push(discordParticipant);
    }

    const result = await this.discordParticipantModel.collection.insertMany(
      discordParticipants,
      { bypassDocumentValidation: true, ordered: false },
    );

    if (result.insertedCount !== discordParticipants.length) {
      this.logger.error(
        `Failed to insert all discordParticipants for eventId: ${eventId}`,
      );
    }

    this.logger.log(
      `Processed members for voiceChannelId: ${communityEvent.voiceChannelId}`,
    );
    return {};
  }

  @Process('end')
  async end(job: Job<{ eventId: string }>) {
    this.logger.log('Processing end event...');
    return {};
  }
}
