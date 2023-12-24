import { Inject, Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { GuildMember, VoiceState } from 'discord.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CommunityParticipantDiscordEntity,
  DiscordActiveCommunityEventDto,
  DiscordParticipantRedisDto,
  TRACKING_EVENTS_ACTIVE,
  TRACKING_EVENTS_PARTICIPANTS,
} from '@badgebuddy/common';
import { ProcessorException } from '@/community-events-queue/exceptions/processor.exception';
import { DataSource } from 'typeorm';

@Injectable()
export class VoiceStateUpdateEventService {
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {

    if (this.conditionsForTrackingNotBeenMet(oldState, newState)) {
      // participant remained defeaned or did not change voice channels, thus returning
      return;
    }
    const communityEvents = await this.getCommunityEventsFromCache(oldState, newState);

    for (const communityEvent of communityEvents) {
      if (this.hasUserNotChangedVoiceChannelsRelatedToEvent(communityEvent.voiceChannelSId, oldState, newState)) {
        continue;
      }

      if (
        this.hasUserJoinedVoiceChannel(oldState, newState) ||
        this.hasUserUnDeafened(oldState, newState) ||
        this.hasUserHoppedIntoVoiceChannel(
          oldState,
          newState,
          communityEvent.voiceChannelSId,
        )
      ) {
        if (!newState.member) {
          this.logger.error(`User has joined a voice channel or un-deafened, but member is undefined, guildId: ${newState.guild.id}`);
          continue;
        }
        this.logger.verbose(`User has joined a voice channel or un-deafened, guildId: ${newState.member?.guild.id}`);
        const guildMember = newState.member;
        const userCache = await this.getParticipantFromCache(communityEvent.communityEventId, guildMember.guild.id, guildMember.id);
        if (!userCache) {
          await this.insertUserToCache(communityEvent.communityEventId, guildMember);
          this.insertUserToDb(communityEvent.communityEventId, guildMember).catch((e) => {this.logger.error(e)});
          continue;
        }
        userCache.startDate = new Date().toISOString();
        delete userCache.endDate;
        await this.updateUserInCache(communityEvent.communityEventId, guildMember, userCache);
        continue;
      }

      if (
        this.hasUserDeafened(oldState, newState) ||
        this.hasUserLeftVoiceChannel(oldState, newState) ||
        this.hasUserHoppedOutOfVoiceChannel(
          oldState,
          newState,
          communityEvent.voiceChannelSId,
        )
      ) {
        if (!newState.member) {
          this.logger.error(`User has left a voice channel or deafened, but member is undefined, guildId: ${newState.guild.id}`);
          continue;
        }
        const guildMember = newState.member;
        this.logger.log(
          `User ${guildMember.user.username} has left a voice channel or deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent.communityEventId}`,
        );
        let userCache = await this.getParticipantFromCache(communityEvent.communityEventId, guildMember.guild.id, guildMember.id);
        if (!userCache) {
          this.logger.warn(
            `User not found in cache, fetching from db, communityEventId: ${communityEvent.communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
          );
          const dbUser = await this.getParticipantFromDb(communityEvent.communityEventId, guildMember);
          userCache = {
            communityEventId: communityEvent.communityEventId,
            discordUserSId: guildMember.id,
            durationInSeconds: dbUser.participationLength ?? 0,
            startDate: new Date().toISOString(),
            endDate: dbUser.endDate?.toISOString(),
          } as DiscordParticipantRedisDto;
        }
        const startDate = new Date(userCache.startDate);
        const endDate = new Date();
        userCache.endDate = endDate.toISOString();
        userCache.durationInSeconds += (endDate.getTime() - startDate.getTime()) / 1000;
        await this.updateUserInCache(communityEvent.communityEventId, guildMember, userCache);
      }
    }
  }

  private getCommunityEventsFromCache = async (
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<DiscordActiveCommunityEventDto[]> => {

    if (!oldState.channelId && !newState.channelId) {
      return [];
    }

    const getActiveEventFromCache = async (voiceChannelSId: string | null) => {
      if (!voiceChannelSId) {
        return undefined;
      }
      try {
        return await this.cacheManager.get<DiscordActiveCommunityEventDto>(
          TRACKING_EVENTS_ACTIVE(voiceChannelSId),
        );
      } catch (e) {
        this.logger.error(
          `Failed to fetch active event from cache, voiceChannelId: ${voiceChannelSId}`,
        );
      }
    };

    try {
      const prevEvent = await getActiveEventFromCache(oldState.channelId);
      const newEvent = await getActiveEventFromCache(newState.channelId);

      return [
        ...(prevEvent ? [prevEvent] : []),
        ...(newEvent ? [newEvent] : []),
      ];
    } catch (e) {
      this.logger.error(
        `Failed to fetch active event from cache, voiceChannelId: ${oldState.channelId}, ${newState.channelId}`,
      );
      return [];
    }
  };

  private async insertUserToCache(
    communityEventId: string,
    guildMember: GuildMember,
  ) {
    this.logger.log(
      `User ${guildMember.user.username} has joined a voice channel or un-deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEventId}`,
    );
    try {
      const redisKey = TRACKING_EVENTS_PARTICIPANTS(communityEventId, guildMember.id);
      this.logger.verbose(`attempting to store user in cache: ${redisKey}`);
      await this.cacheManager.set(redisKey,
        {
          communityEventId: communityEventId,
          discordUserSId: guildMember.id,
          startDate: new Date().toISOString(),
          durationInSeconds: 0,
        } as DiscordParticipantRedisDto,
        0,
      );
      this.logger.verbose(
        `User stored in cache, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    } catch (e) {
      this.logger.error(
        `Failed to insert user to cache, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    }
  }

  private async insertUserToDb(
    communityEventId: string,
    guildMember: GuildMember,
  ) {
    try {
      const result = await this.dataSource.createQueryBuilder()
        .insert()
        .into(CommunityParticipantDiscordEntity)
        .values({
          communityEventId: communityEventId,
          discordUserSId: guildMember.id.toString(),
          startDate: new Date().toISOString(),
          participationLength: 0,
        })
        .execute();
      if (!result) {
        throw new ProcessorException(
          `Failed to insert user to db, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
        );
      }
      this.logger.verbose(`User inserted to db, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`);
    } catch (e) {
      this.logger.error(
        `Failed to insert user to db, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    }
  }

  private async updateUserInCache(
    communityEventId: string,
    guildMember: GuildMember,
    userCache: DiscordParticipantRedisDto,
  ) {
    this.logger.log(
      `User ${guildMember.user.username} has rejoined a voice channel/un-deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEventId}`,
    );
    try {
      const redisKey = TRACKING_EVENTS_PARTICIPANTS(communityEventId, guildMember.id);
      this.logger.verbose(`attempting to update user in cache: ${redisKey}`);
      await this.cacheManager.set(redisKey, userCache, 0);
      this.logger.verbose(
        `User updated in cache, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    } catch (e) {
      this.logger.error(
        `Failed to update user in cache, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    }
  }

  private async getParticipantFromCache(
    communityEventId: string, guildSId: string, discordUserSId: string
  ): Promise<DiscordParticipantRedisDto | undefined> {
    try {
      const trackingRedisKey = TRACKING_EVENTS_PARTICIPANTS(communityEventId, discordUserSId);
      this.logger.verbose(`attempting to get user from cache: ${trackingRedisKey}`);
      return await this.cacheManager.get<DiscordParticipantRedisDto>(trackingRedisKey);
    } catch (e) {
      this.logger.error(
        `Failed to fetch participant from cache, eventId: ${communityEventId}, userId: ${discordUserSId}, guildId: ${guildSId}`,
      );
    }
  }

  private async getParticipantFromDb(
    communityEventId: string, guildMember: GuildMember
  ): Promise<CommunityParticipantDiscordEntity>  {
    try {
      const result = await this.dataSource.createQueryBuilder()
        .select('participant')
        .from(CommunityParticipantDiscordEntity, 'participant')
        .where('participant.communityEventId = :communityEventId', { communityEventId })
        .andWhere('participant.discordUserSId = :discordUserSId', { discordUserSId: guildMember.id })
        .getOne();
      if (!result) {
        throw new ProcessorException(
          `User not found in db, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
        );
      }
      return result;
    } catch (e) {
      this.logger.error(
        `Failed to fetch participant from db, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
      throw new ProcessorException(
        `User not found in db, eventId: ${communityEventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    }
  }

  /**
   * Logical condition checks for tracking
   */

  /**
   * Conditions for tracking not been met
   * If the user has not changed voice channels
   * or remained deafened between hops
   * @param oldState
   * @param newState
   * @private
   */
  private conditionsForTrackingNotBeenMet(
    oldState: VoiceState,
    newState: VoiceState,
  ): boolean {
    if (
      oldState.channelId === newState.channelId &&
      newState.deaf === oldState.deaf
    ) {
      return true;
    } else if (newState.deaf == true && oldState.deaf == true) {
      return true;
    }
    return false;
  }

  private hasUserNotChangedVoiceChannelsRelatedToEvent(
    voiceChannelSId: string,
    oldState: VoiceState,
    newState: VoiceState,
  ): boolean {
    return (
      voiceChannelSId !== oldState.channelId &&
      voiceChannelSId !== newState.channelId
    );
  }

  private hasUserDeafened(oldState: VoiceState, newState: VoiceState): boolean {
    return !!newState.deaf && !oldState.deaf;
  }

  private hasUserUnDeafened(
    oldState: VoiceState,
    newState: VoiceState,
  ): boolean {
    return !newState.deaf && !!oldState.deaf;
  }

  private hasUserLeftVoiceChannel(
    oldState: VoiceState,
    newState: VoiceState,
  ): boolean {
    return newState.channelId !== oldState.channelId && !newState.channelId;
  }

  private hasUserJoinedVoiceChannel(
    oldState: VoiceState,
    newState: VoiceState,
  ): boolean {
    return (
      newState.channelId !== oldState.channelId &&
      !oldState.channelId &&
      !newState.deaf
    );
  }

  private hasUserHoppedIntoVoiceChannel(
    oldState: VoiceState,
    newState: VoiceState,
    eventChannelId: string | null,
  ): boolean {
    return (
      newState.channelId !== oldState.channelId &&
      !!newState.channelId &&
      !!oldState.channelId &&
      newState.channelId === eventChannelId
    );
  }

  private hasUserHoppedOutOfVoiceChannel(
    oldState: VoiceState,
    newState: VoiceState,
    eventChannelId: string | null,
  ): boolean {
    return (
      newState.channelId !== oldState.channelId &&
      !!newState.channelId &&
      !!oldState.channelId &&
      oldState.channelId === eventChannelId
    );
  }
}
