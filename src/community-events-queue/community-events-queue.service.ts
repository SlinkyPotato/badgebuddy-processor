import { InjectDiscordClient } from '@discord-nestjs/core';
import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Channel, ChannelType, Client, VoiceChannel } from 'discord.js';
import {
  CommunityEventDiscordEntity,
  CommunityEventEntity,
  CommunityEventParticipantDiscordEntity,
  DISCORD_COMMUNITY_EVENTS_END_JOB,
  DISCORD_COMMUNITY_EVENTS_QUEUE,
  DISCORD_COMMUNITY_EVENTS_START_JOB,
  DiscordParticipantRedisDto,
  TRACKING_EVENTS_PARTICIPANTS,
} from '@badgebuddy/common';
import { Cache } from 'cache-manager';
import { DataSource, EntityManager, In } from 'typeorm';
import { ProcessorException } from '@/exceptions/processor.exception';
import { CronJobsService } from '@/cron-jobs/cron-jobs.service';

type DiscordParticipant = {
  userSId: string;
  username: string;
  discriminator: string;
};

type DiscordCommunityEventJob = Job<{
  eventId: string;
}>;

@Injectable()
@Processor(DISCORD_COMMUNITY_EVENTS_QUEUE)
export class CommunityEventsProcessorService {
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDiscordClient() private readonly discordClient: Client,
    private readonly dataSource: DataSource,
    private readonly cronJobService: CronJobsService,
  ) {}

  /**
   * Add all present voice channel participants to the event tracking in cache
   * @param job NestJS Job object
   * @returns empty object
   */
  @Process(DISCORD_COMMUNITY_EVENTS_START_JOB)
  async startEvent(job: DiscordCommunityEventJob): Promise<any> {
    const communityEventId = job.data.eventId;
    this.logger.log(
      `starting jobId: ${job.id}, to start communityEventId: ${communityEventId}, in queue: ${DISCORD_COMMUNITY_EVENTS_START_JOB}`,
    );

    const { voiceChannelSId, communityEvent } =
      await this.fetchDiscordEvent(communityEventId);

    const { name, members } = await this.fetchVoiceChannel(voiceChannelSId);

    this.logger.verbose(
      `processing members in voice channel ${name}, with ${members.size} members`,
    );

    const discordParticipants: DiscordParticipant[] = [];

    for (const member of members.values()) {
      if (member.voice.deaf) {
        this.logger.warn(
          `skipping deaf member tag: ${member.user.tag}, userId: ${member.id}, communityEventId: ${communityEventId}`,
          DISCORD_COMMUNITY_EVENTS_START_JOB,
        );
        continue;
      }

      this.insertParticipantToCache(communityEventId, member.user.id).catch(
        (err) => {
          this.logger.error(err);
          this.logger.warn(
            `continuing with job process start for communityEventId: ${communityEventId}`,
          );
        },
      );

      discordParticipants.push({
        discriminator: member.user.discriminator,
        username: member.user.username,
        userSId: member.id.toString(),
      });
    }

    if (discordParticipants.length <= 0) {
      this.logger.warn(`no participants found for 
      communityEventId: ${communityEventId}`);
      this.logger.log(
        `finished jobId: ${job.id}, to start communityEventId: ${communityEventId} in queue, ${DISCORD_COMMUNITY_EVENTS_START_JOB}`,
      );
      return {};
    }

    this.logger.verbose(
      `stored ${discordParticipants.length} participants in cache`,
    );

    await this.insertAllParticipantToDb(communityEventId, discordParticipants);

    this.cronJobService.addCronTimeoutToDisbandEvent(
      communityEventId,
      communityEvent.endDate,
    );

    this.logger.log(
      `finished jobId: ${job.id}, to start communityEventId: ${communityEventId} in queue, ${DISCORD_COMMUNITY_EVENTS_START_JOB}`,
    );
    return {};
  }

  /**
   * Process end of the community event
   * @param job DiscordCommunityEventJob the job object from the queue
   * @returns
   */
  @Process(DISCORD_COMMUNITY_EVENTS_END_JOB)
  async disbandEvent(job: DiscordCommunityEventJob) {
    const communityEventId = job.data.eventId;
    this.logger.log(
      `starting jobId: ${job.id}, to end communityEventId: ${communityEventId}, in queue: ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
      DISCORD_COMMUNITY_EVENTS_END_JOB,
    );

    const endDate = (await this.fetchDiscordEvent(communityEventId))
      .communityEvent.endDate;
    const participantKeys = await this.cacheManager.store.keys(
      TRACKING_EVENTS_PARTICIPANTS(communityEventId, '*'),
    );

    if (!participantKeys || participantKeys.length === 0) {
      this.logger.warn(
        `participants keys not found for communityEventId: ${communityEventId}`,
      );
      await this.disbandEventInDb(communityEventId);
      this.logger.log(
        `finished jobId: ${job.id}, to end communityEventId: ${communityEventId} in queue, ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
      );
      return {};
    }

    this.logger.verbose(
      `participants keys found, count: ${participantKeys.length} for communityEventId: ${communityEventId},`,
      DISCORD_COMMUNITY_EVENTS_END_JOB,
    );

    const discordParticipants: DiscordParticipantRedisDto[] = (
      await Promise.all(
        participantKeys.map(async (participantKey) => {
          try {
            const participant: DiscordParticipantRedisDto =
              await this.fetchParticipantFromCache(
                communityEventId,
                participantKey,
              );
            await this.cacheManager.del(participantKey);
            return participant;
          } catch (err) {
            this.logger.error(err);
            this.logger.warn(
              `continuing to end next participant for communityEventId: ${communityEventId}`,
            );
            return null;
          }
        }),
      )
    ).filter(
      (participant) => participant !== null,
    ) as DiscordParticipantRedisDto[];

    if (discordParticipants.length <= 0) {
      this.logger.warn(`no participants found for 
      communityEventId: ${communityEventId}`);
      this.logger.log(
        `finished jobId: ${job.id}, to end communityEventId: ${communityEventId} in queue, ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
      );
      return {};
    }

    await this.dataSource.transaction(async (manager) => {
      await this.setParticipationLengthInDb(
        communityEventId,
        endDate,
        discordParticipants,
        manager,
      );
      await this.disbandEventInDb(communityEventId, manager);
    });

    this.logger.log(
      `finished jobId: ${job.id}, to end communityEventId: ${communityEventId} in queue, ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
    );
    return {};
  }

  /**
   * Error handler for the queue
   * @param job job object
   * @param error error that occured
   */
  @OnQueueFailed()
  onQueueFailed(job: Job, error: Error) {
    this.logger.warn(`failed jobId: ${job.id}`);
    this.logger.error(error);
  }

  // TODO: enable when activating horizontal scaling
  // @OnGlobalQueueFailed()
  // onGlobalQueueFailed(job: number, error: Error) {
  //   // this.logger.error(`failed jobId: ${job}`);
  //   this.logger.error(error);
  // }

  /**
   * Helper functions
   */

  private async fetchVoiceChannel(
    voiceChannelSId: string,
  ): Promise<VoiceChannel> {
    this.logger.verbose(
      `fetching voice channel ${voiceChannelSId} from discord`,
    );
    let voiceChannel: Channel | null;
    try {
      voiceChannel = await this.discordClient.channels.fetch(voiceChannelSId);
    } catch (err) {
      this.logger.warn('Failed to fetch voice channel from discord');
      throw err;
    }
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      throw new ProcessorException(
        `voiceChannelId: ${voiceChannelSId} not found`,
      );
    }
    this.logger.verbose(
      `fetched voice channel ${voiceChannelSId} and found ${voiceChannel.members.size} members`,
    );
    return voiceChannel;
  }

  /**
   * Retrieve the community event from the database
   * @param communityEventId The community event id
   * @returns CommunityEventDiscordEntity The community event entity object
   */
  private async fetchDiscordEvent(
    communityEventId: string,
  ): Promise<CommunityEventDiscordEntity> {
    this.logger.verbose(
      `fetching community event ${communityEventId} from database`,
    );
    let result: CommunityEventDiscordEntity | null;
    try {
      result = await this.dataSource
        .getRepository(CommunityEventDiscordEntity)
        .findOneBy({
          communityEventId: communityEventId,
        });
    } catch (err) {
      this.logger.warn('Failed to fetch community event from database');
      throw err;
    }
    if (result?.communityEvent.id !== communityEventId) {
      throw new ProcessorException(
        `Community communityEventId: ${communityEventId} not found`,
      );
    }
    this.logger.verbose(
      `fetched community communityEventId: ${communityEventId} from database`,
    );
    return result;
  }

  private async insertAllParticipantToDb(
    communityEventId: string,
    participants: DiscordParticipant[],
  ) {
    this.logger.verbose(
      `attempting to insert ${participants.length} participants into db`,
    );
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(CommunityEventParticipantDiscordEntity)
      .values(
        participants.map((participant) => {
          return {
            communityEventId: communityEventId,
            discordUserSId: participant.userSId,
            startDate: new Date(),
            participationLength: 0,
          } as CommunityEventParticipantDiscordEntity;
        }),
      )
      .execute();
    if (result.identifiers.length !== participants.length) {
      throw new ProcessorException(`Failed to insert all participants 
        for communityEventId: ${communityEventId}`);
    }
    this.logger.verbose(`inserted ${result.identifiers.length} participants`);
  }

  private async insertParticipantToCache(
    communityEventId: string,
    discordUserSId: string,
  ) {
    return this.cacheManager.set(
      TRACKING_EVENTS_PARTICIPANTS(communityEventId, discordUserSId),
      {
        communityEventId: communityEventId,
        discordUserSId: discordUserSId,
        startDate: new Date().toISOString(),
        durationInSeconds: 0,
      } as DiscordParticipantRedisDto,
      0,
    );
  }

  private async fetchParticipantFromCache(
    communityEventId: string,
    participantKey: string,
  ): Promise<DiscordParticipantRedisDto> {
    const participant =
      await this.cacheManager.get<DiscordParticipantRedisDto>(participantKey);
    if (!participant) {
      throw new ProcessorException(
        `Participant not found for communityEventId: ${communityEventId}, 
          participantKey: ${participantKey}`,
      );
    }
    return participant;
  }

  private async setParticipationLengthInDb(
    communityEventId: string,
    startDate: Date,
    participants: DiscordParticipantRedisDto[],
    manager: DataSource | EntityManager = this.dataSource,
  ) {
    const endDate = new Date();
    const insertParticipantResult = await manager
      .getRepository(CommunityEventParticipantDiscordEntity)
      .update(
        {
          communityEventId: communityEventId,
          discordUserSId: In(participants.map((p) => p.discordUserSId)),
        },
        {
          endDate: endDate,
          participationLength: Math.round(
            (endDate.getTime() - startDate.getTime()) / 1000,
          ),
        },
      );

    if (insertParticipantResult.affected !== participants.length) {
      throw new ProcessorException(
        `Failed to update participants for communityEventId: ${communityEventId}`,
      );
    }

    this.logger.verbose(
      `updated ${insertParticipantResult.affected} participants`,
    );
  }

  private async disbandEventInDb(
    communityEventId: string,
    manager: DataSource | EntityManager = this.dataSource,
  ) {
    this.logger.verbose(`disbanding community event ${communityEventId}`);
    const disbandResult = await manager
      .createQueryBuilder()
      .update(CommunityEventEntity)
      .set({
        disbandedDate: new Date(),
      } as CommunityEventEntity)
      .where('id = :id', { id: communityEventId })
      .execute();

    if (disbandResult?.affected !== 1) {
      throw new ProcessorException(`Failed to disband community event 
        for communityEventId: ${communityEventId}`);
    }
    this.logger.verbose(`disbanded community event ${communityEventId}`);
    return disbandResult;
  }
}
