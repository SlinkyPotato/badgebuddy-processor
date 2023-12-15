import { InjectDiscordClient } from '@discord-nestjs/core';
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Channel, ChannelType, Client, GuildMember, VoiceChannel } from 'discord.js';
import { ProcessorException } from './exceptions/processor.exception';
import {
  CommunityEventDiscordEntity,
  DISCORD_COMMUNITY_EVENTS_END_JOB,
  DISCORD_COMMUNITY_EVENTS_QUEUE,
  DISCORD_COMMUNITY_EVENTS_START_JOB,
  CommunityParticipantDiscordEntity,
  DiscordParticipantRedisDto,
} from '@badgebuddy/common';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';

type DiscordParticipant = {
  userSId: string,
  username: string,
  discriminator: string,
}

type DiscordCommunityEventJob = Job<{
  eventId: string,
}>;

@Injectable()
@Processor(DISCORD_COMMUNITY_EVENTS_QUEUE)
export class CommunityEventsProcessorService {
  private static START_QUEUE_LOG = `Queue.${DISCORD_COMMUNITY_EVENTS_START_JOB}` as const;
  private static END_QUEUE_LOG = `Queue.${DISCORD_COMMUNITY_EVENTS_END_JOB}` as const;
  
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDiscordClient() private readonly discordClient: Client,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Add all present voice channel participants to the event tracking in cache
   * @param job NestJS Job object
   * @returns empty object
   */
  @Process(DISCORD_COMMUNITY_EVENTS_START_JOB)
  async startEvent(job: DiscordCommunityEventJob): Promise<{}> {
    const communityEventId = job.data.eventId;
    this.logger.log(
      `Processing queue ${DISCORD_COMMUNITY_EVENTS_START_JOB} for communityEventId: ${communityEventId}`,
      CommunityEventsProcessorService.START_QUEUE_LOG,
    );

    const communityEvent = await this.getCommunityEvent(communityEventId);
    const voiceChannel = await this.fetchVoiceChannel(communityEvent.voiceChannelSId);

    this.logger.verbose(
      `Processing members in voice channel ${voiceChannel.name}`,
      CommunityEventsProcessorService.START_QUEUE_LOG,
    );

    const discordParticipants: DiscordParticipant[] = [];
    
    for (const member of voiceChannel.members.values()) {
      if (member.voice.deaf) {
        this.logger.warn(
          `Skipping deaf member tag: ${member.user.tag}, userId: ${member.id}, communityEventId: ${communityEventId}, guildId: ${communityEvent.botSettings.guildSId}`,
          CommunityEventsProcessorService.START_QUEUE_LOG,
        );
        continue;
      }  

      this.insertParticipantToCache(communityEventId, member).catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process start for communityEventId: ${communityEventId}, guildId: ${communityEvent.botSettings.guildSId}`,
        );
      });

      discordParticipants.push({
        discriminator: member.user.discriminator,
        username: member.user.username,
        userSId: member.id.toString(),
      });
    }

    if (discordParticipants.length <= 0) {
      this.logger.warn(`No participants found for communityEventId: ${communityEventId}`);
      return {};
    }

    this.insertAllParticipantToDb(communityEventId, discordParticipants)
      .catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process start for communityEventId: ${communityEventId}, guildId: ${communityEvent.botSettings.guildSId}`,
        );
    });

    this.logger.log(
      `Processed done for communityEventId: ${communityEventId}, guildId: ${communityEvent.botSettings.guildSId}, organizerId: ${communityEvent.organizerId}, voiceChannelId: ${communityEvent.voiceChannelSId}`,
      CommunityEventsProcessorService.START_QUEUE_LOG,
    );
    return {};
  }

  /**
   * Process end of the community event
   * @param job DiscordCommunityEventJob the job object from the queue
   * @returns 
   */
  @Process(DISCORD_COMMUNITY_EVENTS_END_JOB)
  async endEvent(job: DiscordCommunityEventJob) {
    const communityEventId = job.data.eventId;
    this.logger.log(
      `Processing end of communityEventId: ${communityEventId}`,
      CommunityEventsProcessorService.END_QUEUE_LOG,
    );

    const discordEvent = await this.getCommunityEvent(communityEventId);

    const participantKeys = await this.cacheManager.store.keys(
      `tracking:events:${communityEventId}:participants:*`,
    );

    if (!participantKeys || participantKeys.length === 0) {
      throw new ProcessorException(
        `Participants keys not found for communityEventId: ${communityEventId}, 
        guildId: ${discordEvent.botSettings.guildSId}, organizerId: ${discordEvent.organizerId}`,
      );
    }

    this.logger.log('Participants keys found', CommunityEventsProcessorService.END_QUEUE_LOG);

    const discordParticipants: DiscordParticipantRedisDto[] = 
      await Promise.all(participantKeys.map(async (participantKey) => {
        const participant = await this.fetchParticipantFromCache(communityEventId, participantKey);
        await this.cacheManager.del(participantKey);
        return participant;
    }));

    this.updateParticipantsInDb(communityEventId, discordEvent.communityEvent.endDate, discordParticipants)
      .catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process end for communityEventId: ${communityEventId}, 
          guildId: ${discordEvent.botSettings.guildSId}`,
        );
    });

    this.logger.log(
      `Processed done for communityEventId: ${communityEventId}, guildId: ${discordEvent.botSettings.guildSId}, 
      organizerId: ${discordEvent.organizerId}, voiceChannelId: ${discordEvent.voiceChannelSId}`,
      CommunityEventsProcessorService.END_QUEUE_LOG,
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
    this.logger.error(new ProcessorException(`failed to process jobId: ${job.id}`, 'OnQueueFailed', error.stack));
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

  private async fetchVoiceChannel(voiceChannelSId: string): Promise<VoiceChannel> {
    this.logger.verbose(`Fetching voice channel ${voiceChannelSId} from discord`);
    try {
      const voiceChannel: Channel | null = await this.discordClient.channels.fetch(voiceChannelSId);
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        throw new ProcessorException(
          `voiceChannelId: ${voiceChannelSId} not found`,
        );
      }
      this.logger.verbose(`Fetched voice channel ${voiceChannelSId} from discord`);
      return voiceChannel;
    } catch(err) {
      this.logger.error(err);
      throw new ProcessorException(
        `Failed to fetch voiceChannelId: ${voiceChannelSId}`,
      );
    }
  }

  /**
   * Retrieve the community event from the database
   * @param communityEventId The community event id
   * @returns CommunityEventDiscordEntity The community event entity object
   */
  private async getCommunityEvent(communityEventId: string): Promise<CommunityEventDiscordEntity> {
    this.logger.verbose(`Fetching community event ${communityEventId} from database`);
    try {
      
      const result = await this.dataSource.createQueryBuilder()
        .select('ce')
        .from(CommunityEventDiscordEntity, 'ce')
        .where('ce.communityEventId = :communityEventId', { communityEventId: communityEventId })
        .getOne();

      if (!result) {
        throw new ProcessorException(`Community communityEventId: ${communityEventId} not found`);
      }

      this.logger.verbose(`Fetched community communityEventId: ${communityEventId} from database`);
      return result;
    } catch(err) {
      this.logger.warn('Failed to fetch community event from database');
      throw err;
    }
  }

  private async insertAllParticipantToDb(communityEventId: string, participants: DiscordParticipant[]) {
    try {
      const result = await this.dataSource.createQueryBuilder()
        .insert()
        .into(CommunityParticipantDiscordEntity)
        .values(participants.map((participant) => {
          return {
            communityEventId: communityEventId,
            discordUserSId: participant.userSId,
            startDate: new Date(),
            participationLength: 0,
          } as CommunityParticipantDiscordEntity;
        })).execute();

      if (!result || result.identifiers.length !== participants.length) {
        throw new ProcessorException(`Failed to insert participants for communityEventId: ${communityEventId}`);
      }
    } catch (err) {
      this.logger.warn('Failed to insert participants for community event');
      throw err;
    }
  }

  private async insertParticipantToCache(communityEventId: string, guildMember: GuildMember) {
    try {
      await this.cacheManager.set(`tracking:events:${communityEventId}:participants:${guildMember.id}`, {
        communityEventId: communityEventId,
        discordUserSId: guildMember.id.toString(),
        startDate: new Date().toISOString(),
        durationInSeconds: 0,
      } as DiscordParticipantRedisDto, 0);
    } catch(err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to cache participant ${guildMember.id}`);
    }
  }

  private async fetchParticipantFromCache(
    communityEventId: string, participantKey: string
    ): Promise<DiscordParticipantRedisDto> {
    try {
      const participant = await this.cacheManager.get<DiscordParticipantRedisDto>(participantKey);
      if (!participant) {
        throw new ProcessorException(
          `Participant not found for communityEventId: ${communityEventId}, participantKey: ${participantKey}`,
        );
      }
      return participant;
    } catch(err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to fetch participant for communityEventId: ${communityEventId}`);
    }
  }

  private async updateParticipantsInDb(
    communityEventId: string, startDate: Date, participants: DiscordParticipantRedisDto[]
  ) {
    try {
      const endDate = new Date();
      const result = await this.dataSource.createQueryBuilder()
        .insert()
        .into(CommunityParticipantDiscordEntity)
        .values(participants.map((participant) => {
          return {
            communityEventId: communityEventId,
            discordUserSId: participant.discordUserSId,
            startDate,
            endDate,
            participationLength: (endDate.getTime() - startDate.getTime()) / 1000,
          } as CommunityParticipantDiscordEntity;
        })).execute();
      
      if (!result || result.identifiers.length !== participants.length) {
        throw new ProcessorException(`Failed to update participants for communityEventId: ${communityEventId}`);
      }
    } catch (err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to update participants for communityEventId: ${communityEventId}`);
    }
  }
}
