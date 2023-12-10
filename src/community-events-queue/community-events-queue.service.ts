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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
  
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDiscordClient() private readonly discordClient: Client,
    @InjectRepository(CommunityEventDiscordEntity) 
      private discordCommunityEventsRepo: Repository<CommunityEventDiscordEntity>,
    @InjectRepository(CommunityParticipantDiscordEntity) 
      private discordParticipantRepo: Repository<CommunityParticipantDiscordEntity>,
  ) {}

  /**
   * Add all present voice channel participants to the event tracking in cache
   * @param job NestJS Job object
   * @returns empty object
   */
  @Process(DISCORD_COMMUNITY_EVENTS_START_JOB)
  async start(job: DiscordCommunityEventJob): Promise<{}> {
    const eventId = job.data.eventId;
    this.logger.log(
      `Processing start eventId: ${eventId}`,
      'EventsProcessor.start',
    );

    const communityEvent = await this.getCommunityEvent(eventId);
    const voiceChannel = await this.fetchVoiceChannel(communityEvent.voiceChannelSId);

    this.logger.verbose(
      `Processing members in voice channel ${voiceChannel.name}`,
      'EventsProcessor.start',
    );

    const discordParticipants: DiscordParticipant[] = [];
    
    for (const member of voiceChannel.members.values()) {
      if (member.voice.deaf) {
        this.logger.warn(
          `Skipping deaf member tag: ${member.user.tag}, userId: ${member.id}, eventId: ${eventId}, guildId: ${communityEvent.botSettings.guildSId}`,
          'EventsProcessor.start',
        );
        continue;
      }  

      this.insertParticipantToCache(eventId, member).catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process start for eventId: ${eventId}, guildId: ${communityEvent.botSettings.guildSId}`,
        );
      });

      discordParticipants.push({
        discriminator: member.user.discriminator,
        username: member.user.username,
        userSId: member.id.toString(),
      });
    }

    if (discordParticipants.length <= 0) {
      this.logger.warn(`No participants found for eventId: ${eventId}`);
      return {};
    }

    this.insertAllParticipantToDb(eventId, discordParticipants).catch((err) => {
      this.logger.error(err);
      this.logger.warn(
        `continuing with job process start for eventId: ${eventId}, guildId: ${communityEvent.botSettings.guildSId}`,
      );
    });

    this.logger.log(
      `Processed done for eventId: ${eventId}, guildId: ${communityEvent.botSettings.guildSId}, organizerId: ${communityEvent.organizerId}, voiceChannelId: ${communityEvent.voiceChannelSId}`,
      'EventsProcessor.start',
    );
    return {};
  }

  @Process(DISCORD_COMMUNITY_EVENTS_END_JOB)
  async end(job: DiscordCommunityEventJob) {
    const eventId = job.data.eventId;
    this.logger.log(
      `Processing end eventId: ${eventId}`,
      'EventsProcessor.end',
    );

    const discordEvent = await this.getCommunityEvent(eventId);

    const participantKeys = await this.cacheManager.store.keys(
      `tracking:events:${eventId}:participants:*`,
    );

    if (!participantKeys || participantKeys.length === 0) {
      throw new ProcessorException(
        `Participants keys not found for eventId: ${eventId}, 
        guildId: ${discordEvent.botSettings.guildSId}, organizerId: ${discordEvent.organizerId}`,
      );
    }

    this.logger.log('Participants keys found', 'EventsProcessor.end');

    const discordParticipants: DiscordParticipantRedisDto[] = 
      await Promise.all(participantKeys.map(async (participantKey) => {
        const participant = await this.fetchParticipantFromCache(eventId, participantKey);
        await this.cacheManager.del(participantKey);
        return participant;
    }));

    this.updateParticipantsInDb(eventId, discordEvent.communityEvent.endDate, discordParticipants)
      .catch((err) => {
        this.logger.error(err);
        this.logger.warn(
          `continuing with job process end for eventId: ${eventId}, 
          guildId: ${discordEvent.botSettings.guildSId}`,
        );
    });

    this.logger.log(
      `Processed done for eventId: ${eventId}, guildId: ${discordEvent.botSettings.guildSId}, 
      organizerId: ${discordEvent.organizerId}, voiceChannelId: ${discordEvent.voiceChannelSId}`,
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
      return await this.discordCommunityEventsRepo.findOneOrFail({
        where: {
          communityEventId: communityEventId
        }
      });
    } catch(err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to find event ${communityEventId}`);
    }
  }

  private async insertAllParticipantToDb(communityEventId: string, participants: DiscordParticipant[]) {
    try {
      await this.discordParticipantRepo.save<CommunityParticipantDiscordEntity>(
        participants.map((participant) => {
          return {
            communityEventId: communityEventId,
            discordUser: {
              userSId: participant.userSId,
              discriminator: participant.discriminator,
              username: participant.username,
            },
            startDate: new Date(),
            participationLength: 0,
          } as CommunityParticipantDiscordEntity;
        })
      );
    } catch (err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to insert participants for communityEventId: ${communityEventId}`);
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
      await this.discordParticipantRepo.save<CommunityParticipantDiscordEntity>(
        participants.map((participant) => {
          const endDate = new Date();
          return {
            communityEventId: communityEventId,
            discordUserSId: participant.discordUserSId,
            endDate: new Date(),
            participationLength: (endDate.getTime() - startDate.getTime()) / 1000,
          } as CommunityParticipantDiscordEntity;
        })
      );
    } catch (err) {
      this.logger.error(err);
      throw new ProcessorException(`Failed to update participants for communityEventId: ${communityEventId}`);
    }
  }
}
