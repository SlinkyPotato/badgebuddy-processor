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
  TRACKING_EVENTS_PARTICIPANTS,
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
  async startEvent(job: DiscordCommunityEventJob): Promise<any> {
    const communityEventId = job.data.eventId;
    this.logger.log(
      `Processing queue ${DISCORD_COMMUNITY_EVENTS_START_JOB} for 
      communityEventId: ${communityEventId}`,
      CommunityEventsProcessorService.START_QUEUE_LOG,
    );

    const { voiceChannelSId, botSettingsId, organizerId } =
      await this.getDiscordCommunityEvent(communityEventId);
    const { name, members } = await this.fetchVoiceChannel(voiceChannelSId);

    this.logger.verbose(
      `Processing members in voice channel ${name}`,
      CommunityEventsProcessorService.START_QUEUE_LOG,
    );

    const discordParticipants: DiscordParticipant[] = [];

    for (const member of members.values()) {
      if (member.voice.deaf) {
        this.logger.warn(
          `Skipping deaf member tag: ${member.user.tag}, userId: ${member.id}, 
          communityEventId: ${communityEventId}, botSettingsId: ${botSettingsId}`,
          CommunityEventsProcessorService.START_QUEUE_LOG,
        );
        continue;
      }

      this.insertParticipantToCache(communityEventId, member).catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process start for 
          communityEventId: ${communityEventId}, botSettingsId: ${botSettingsId}`,
        );
      });

      discordParticipants.push({
        discriminator: member.user.discriminator,
        username: member.user.username,
        userSId: member.id.toString(),
      });
    }

    if (discordParticipants.length <= 0) {
      this.logger.warn(`No participants found for 
      communityEventId: ${communityEventId}`);
      return {};
    }

    this.insertAllParticipantToDb(communityEventId, discordParticipants)
      .catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process start for 
          communityEventId: ${communityEventId}, botSettingsId: ${botSettingsId}`,
        );
    });

    this.logger.log(
      `Processed done for communityEventId: ${communityEventId}, 
      botSettingsId: ${botSettingsId}, organizerId: ${organizerId}, 
      voiceChannelId: ${voiceChannelSId}`,
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

    const discordEvent = await this.getDiscordCommunityEvent(communityEventId);
    const participantKeys =
      await this.cacheManager.store.keys(TRACKING_EVENTS_PARTICIPANTS(communityEventId, '*'));

    if (!participantKeys || participantKeys.length === 0) {
      throw new ProcessorException(
        `Participants keys not found for communityEventId: ${communityEventId}, 
        botSettingsId: ${discordEvent.botSettingsId}, organizerId: ${discordEvent.organizerId}`,
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
          botSettingsId: ${discordEvent.botSettingsId}`,
        );
    });

    this.logger.log(
      `Processed done for communityEventId: ${communityEventId}, 
      botSettingsId: ${discordEvent.botSettingsId}, 
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

  private async fetchVoiceChannel(voiceChannelSId: string): Promise<VoiceChannel> {
    this.logger.verbose(`Fetching voice channel ${voiceChannelSId} from discord`);
    let voiceChannel: Channel | null;
    try {
      voiceChannel = await this.discordClient.channels.fetch(voiceChannelSId);
    } catch(err) {
      this.logger.warn('Failed to fetch voice channel from discord');
      throw err;
    }
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      throw new ProcessorException(
        `voiceChannelId: ${voiceChannelSId} not found`,
      );
    }
    this.logger.verbose(`Fetched voice channel ${voiceChannelSId} from discord`);
    return voiceChannel;
  }

  /**
   * Retrieve the community event from the database
   * @param communityEventId The community event id
   * @returns CommunityEventDiscordEntity The community event entity object
   */
  private async getDiscordCommunityEvent(communityEventId: string): Promise<CommunityEventDiscordEntity> {
    this.logger.verbose(`Fetching community event ${communityEventId} from database`);
    let result: CommunityEventDiscordEntity | null;
    try {
      result = await this.dataSource.createQueryBuilder()
        .select('de')
        .from(CommunityEventDiscordEntity, 'de')
        .leftJoinAndSelect('de.communityEvent', 'e')
        .where('de.communityEventId = :communityEventId', { communityEventId: communityEventId })
        .getOne();
    } catch(err) {
      this.logger.warn('Failed to fetch community event from database');
      throw err;
    }
    if (result?.communityEvent.id !== communityEventId) {
      throw new ProcessorException(`Community communityEventId: ${communityEventId} not found`);
    }
    this.logger.verbose(`Fetched community communityEventId: ${communityEventId} from database`);
    return result;
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
        throw new ProcessorException(`Failed to insert participants 
        for communityEventId: ${communityEventId}`);
      }
    } catch (err) {
      this.logger.warn('Failed to insert participants for community event');
      throw err;
    }
  }

  private async insertParticipantToCache(communityEventId: string, guildMember: GuildMember) {
    try {
      await this.cacheManager.set(TRACKING_EVENTS_PARTICIPANTS(communityEventId, guildMember.id), {
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
          `Participant not found for communityEventId: ${communityEventId}, 
          participantKey: ${participantKey}`,
        );
      }
      return participant;
    } catch(err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to fetch participant 
      for communityEventId: ${communityEventId}`);
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
        throw new ProcessorException(`Failed to update participants 
        for communityEventId: ${communityEventId}`);
      }
    } catch (err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to update participants 
      for communityEventId: ${communityEventId}`);
    }
  }
}
