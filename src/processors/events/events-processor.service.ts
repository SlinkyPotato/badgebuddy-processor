import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Error, Model, Types } from 'mongoose';
import {
  CommunityEvent,
  CommunityEventDocument,
  DiscordParticipant,
  DiscordParticipantDto,
} from '@solidchain/badge-buddy-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client, VoiceChannel } from 'discord.js';
import { ProcessorException } from '../_exceptions/processor.exception';

@Injectable()
@Processor('events')
export class EventsProcessorService {
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
        );
      })) as VoiceChannel | null;

    if (!voiceChannel) {
      throw new ProcessorException(
        `voiceChannelId: ${communityEvent.voiceChannelId} not found`,
      );
    }

    this.logger.log(
      `Processing members in voice channel ${voiceChannel.name}`,
      'EventsProcessor.start',
    );

    const discordParticipants: DiscordParticipant[] = [];
    const participantsSet = new Set<string>();
    for (const member of voiceChannel.members.values()) {
      if (member.voice.deaf) {
        this.logger.warn(
          `Skipping deaf member tag: ${member.user.tag}, userId: ${member.id}, eventId: ${eventId}, guildId: ${communityEvent.guildId}`,
          'EventsProcessor.start',
        );
        continue;
      }

      const discordParticipant = new DiscordParticipant();
      discordParticipant.communityEvent = new Types.ObjectId(
        communityEvent._id,
      );
      discordParticipant.userId = member.id;
      discordParticipant.userTag = member.user.tag;
      discordParticipant.startDate = new Date();
      discordParticipant.durationInMinutes = 0.0;

      const cacheUser = new DiscordParticipantDto();
      cacheUser.eventId = discordParticipant.communityEvent._id;
      cacheUser.userId = discordParticipant.userId;
      cacheUser.userTag = discordParticipant.userTag;
      cacheUser.startDate = discordParticipant.startDate;
      cacheUser.durationInMinutes = discordParticipant.durationInMinutes;

      participantsSet.add(member.id.toString());

      await this.cacheManager
        .set(
          `tracking:events:${eventId}:participants:${member.id}`,
          cacheUser,
          EventsProcessorService.CACHE_TTL,
        )
        .catch((err) => {
          this.logger.error(err);
          throw new ProcessorException('Failed to cache discordParticipant');
        });

      discordParticipants.push(discordParticipant);
    }

    await this.cacheManager
      .set(
        `tracking:events:${eventId}:participants:keys`,
        Array.from(participantsSet),
        EventsProcessorService.CACHE_TTL,
      )
      .catch((err) => {
        this.logger.error(err);
        throw new ProcessorException('Failed to cache participants keys');
      });

    await this.discordParticipantModel
      .insertMany(discordParticipants, { ordered: false })
      .catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process start for eventId: ${eventId}, guildId: ${communityEvent.guildId}`,
        );
      });

    this.logger.log(
      `Processed done for eventId: ${eventId}, guildId: ${communityEvent.guildId}, organizerId: ${communityEvent.organizerId}, voiceChannelId: ${communityEvent.voiceChannelId}`,
      'EventsProcessor.start',
    );
    return {};
  }

  @Process('end')
  async end(job: Job<{ eventId: string }>) {
    const eventId = job.data.eventId;
    this.logger.log(
      `Processing end eventId: ${eventId}`,
      'EventsProcessor.end',
    );

    const communityEvent = await this.getCommunityEvent(eventId);

    const participantKeys = await this.cacheManager.get<string[]>(
      `tracking:events:${eventId}:participants:keys`,
    );

    if (!participantKeys) {
      throw new ProcessorException(
        `Participants keys not found for eventId: ${eventId}, guildId: ${communityEvent.guildId}, organizerId: ${communityEvent.organizerId}`,
      );
    }

    this.logger.log('Participants keys found', 'EventsProcessor.end');
    const endDate = new Date();
    const bulkWriteOps = [];

    for (const participantKey of participantKeys) {
      const participant: DiscordParticipant | undefined =
        await this.cacheManager.get<DiscordParticipant>(
          `tracking:events:${eventId}:participants:${participantKey}`,
        );
      if (!participant) {
        throw new ProcessorException(
          `Participant not found for eventId: ${eventId}, guildId: ${communityEvent.guildId}, organizerId: ${communityEvent.organizerId}, participantKey: ${participantKey}`,
        );
      }
      participant.communityEvent = new Types.ObjectId(
        participant.communityEvent.toString(),
      );
      participant.startDate = new Date(participant.startDate);
      participant.endDate = endDate;
      participant.durationInMinutes =
        (endDate.getTime() - participant.startDate.getTime()) / 1000 / 60;
      bulkWriteOps.push({
        updateOne: {
          filter: {
            communityEvent: participant.communityEvent,
            userId: participant.userId,
          },
          update: participant,
          upsert: true,
        },
      });
      await this.cacheManager.del(
        `tracking:events:${eventId}:participants:${participantKey}`,
      );
    }
    await this.discordParticipantModel
      .bulkWrite(bulkWriteOps, { ordered: false })
      .catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process end for eventId: ${eventId}, guildId: ${communityEvent.guildId}`,
        );
      });

    await this.cacheManager.del(`tracking:events:${eventId}:participants:keys`);
    this.logger.log(
      `Processed done for eventId: ${eventId}, guildId: ${communityEvent.guildId}, organizerId: ${communityEvent.organizerId}, voiceChannelId: ${communityEvent.voiceChannelId}`,
      'EventsProcessor.end',
    );
    return {};
  }

  @OnQueueFailed()
  onQueueFailed(job: Job, error: Error) {
    error.message = error.message + `, jobId: ${job.id}`;
    this.logger.error(error);
  }

  // TODO: enable when activating horizontal scaling
  // @OnGlobalQueueFailed()
  // onGlobalQueueFailed(job: number, error: Error) {
  //   // this.logger.error(`failed jobId: ${job}`);
  //   this.logger.error(error);
  // }

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
