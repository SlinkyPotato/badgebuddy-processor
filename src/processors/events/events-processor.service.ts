import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Model } from 'mongoose';
import {
  CommunityEvent,
  CommunityEventDocument,
  DiscordParticipant,
} from '@solidchain/badge-buddy-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client, VoiceChannel } from 'discord.js';
import { ProcessorException } from '../exceptions/processor.exception';

@Injectable()
@Processor('events')
export class EventsProcessor {
  private static CACHE_TTL = 1000 * 60 * 60 * 24 * 2;

  constructor(
    private readonly logger: Logger,
    @InjectModel(CommunityEvent.name)
    private communityEventModel: Model<CommunityEvent>,
    @InjectModel(DiscordParticipant.name)
    private discordParticipantModel: Model<DiscordParticipant>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDiscordClient() private readonly discordClient: Client,
  ) {}

  @Process('start')
  async start(job: Job<{ eventId: string }>) {
    try {
      const eventId = job.data.eventId;
      this.logger.log(
        `Processing start eventId: ${eventId}`,
        'EventsProcessor.start',
      );

      const communityEvent = await this.getCommunityEvent(eventId);

      this.logger.log(
        `Fetching voice channel ${communityEvent.voiceChannelId}`,
        'EventsProcessor.start',
      );
      const voiceChannel = (await this.discordClient.channels
        .fetch(communityEvent.voiceChannelId)
        .catch((err) => {
          this.logger.error(err);
          throw new ProcessorException(
            `Failed to fetch voiceChannelId: ${communityEvent.voiceChannelId}`,
            'EventsProcessor.start',
          );
        })) as VoiceChannel | null;

      if (!voiceChannel) {
        throw new ProcessorException(
          `voiceChannelId: ${communityEvent.voiceChannelId} not found`,
          'EventsProcessor.start',
        );
      }

      this.logger.log(
        `Processing members in voice channel ${voiceChannel.name}`,
        'EventsProcessor.start',
      );

      const discordParticipants: DiscordParticipant[] = [];
      const participants = new Set<string>();
      for (const member of voiceChannel.members.values()) {
        if (member.voice.deaf) {
          this.logger.warn(
            `Skipping deaf member tag: ${member.user.tag}, userId: ${member.id}, eventId: ${eventId}, guildId: ${communityEvent.guildId}`,
            'EventsProcessor.start',
          );
          continue;
        }

        const discordParticipant = new DiscordParticipant();
        discordParticipant.communityEvent = communityEvent;
        discordParticipant.userId = member.id;
        discordParticipant.userTag = member.user.tag;
        discordParticipant.startDate = new Date();
        discordParticipant.durationInMinutes = 0;

        participants.add(member.id.toString());

        await this.cacheManager
          .set(
            `tracking:events:${eventId}:participants:${member.id}`,
            discordParticipant,
            EventsProcessor.CACHE_TTL,
          )
          .catch((err) => {
            this.logger.error(err);
            throw new ProcessorException(
              'Failed to cache discordParticipant',
              'EventsProcessor.start',
            );
          });

        discordParticipants.push(discordParticipant);
      }

      await this.cacheManager
        .set(
          `tracking:events:${eventId}:participants:keys`,
          Array.from(participants),
          EventsProcessor.CACHE_TTL,
        )
        .catch((err) => {
          this.logger.error(err);
          throw new ProcessorException(
            'Failed to cache participants keys',
            'EventsProcessor.start',
          );
        });

      await this.discordParticipantModel
        .insertMany(discordParticipants, { ordered: false })
        .catch((err) => {
          this.logger.error(err);
          throw new ProcessorException(
            `Failed to insert discordParticipants for eventId: ${eventId}`,
            'EventsProcessor.start',
          );
        });

      this.logger.log(
        `Processed members for voiceChannelId: ${communityEvent.voiceChannelId}`,
        'EventsProcessor.start',
      );
      return {};
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  @Process('end')
  async end(job: Job<{ eventId: string }>) {
    const eventId = job.data.eventId;
    this.logger.log(
      `Processing end eventId: ${eventId}`,
      'EventsProcessor.end',
    );

    const communityEvent = await this.getCommunityEvent(eventId);

    // TODO: convert to Iterable
    // pull data from cache into iterable
    const participants: DiscordParticipant[] | undefined =
      await this.cacheManager.get<DiscordParticipant[]>(
        `tracking:events:${eventId}:participants`,
      );

    if (!participants) {
      throw new ProcessorException(
        `Participants not found for eventId: ${eventId}, guildId: ${communityEvent.guildId}, organizerId: ${communityEvent.organizerId}`,
        'EventsProcessor.end',
      );
    }

    this.logger.log(
      `Participants found for eventId: ${eventId}`,
      'EventsProcessor.end',
    );
    const bulkWriteOps = [];

    for (const participant of participants) {
      const endDate = new Date();
      participant.endDate = endDate;
      participant.durationInMinutes =
        Math.floor(endDate.getTime() - participant.startDate.getTime()) /
        1000 /
        60;

      bulkWriteOps.push({
        replaceOne: {
          filter: {
            userId: participant.userId,
          },
          replacement: participant,
        },
      });
    }
    const result = await this.discordParticipantModel.collection.bulkWrite(
      bulkWriteOps,
      { ordered: false },
    );
    if (result.modifiedCount !== participants.length) {
      throw new ProcessorException(
        `Failed to update all discordParticipants for eventId: ${eventId}, guildId: ${communityEvent.guildId}, organizerId: ${communityEvent.organizerId}`,
        'EventsProcessor.end',
      );
    }
    await this.cacheManager.del(`tracking:events:${eventId}:participants`);
    return {};
  }

  getCommunityEvent = async (
    eventId: string,
  ): Promise<CommunityEventDocument> => {
    const communityEvent: CommunityEventDocument | null =
      await this.communityEventModel
        .findOne<CommunityEventDocument>({
          _id: eventId,
        })
        .exec()
        .catch((err) => {
          this.logger.error(err);
          throw new ProcessorException(`Failed to find event ${eventId}`);
        });

    if (!communityEvent) {
      throw new ProcessorException(`Event ${eventId} not found`);
    }
    return communityEvent;
  };
}
