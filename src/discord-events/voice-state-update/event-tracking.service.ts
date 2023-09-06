import { Inject, Injectable, Logger } from '@nestjs/common';
import { GuildMember, VoiceState } from 'discord.js';
import {
  CommunityEventDto,
  DiscordParticipant,
  DiscordParticipantDto,
} from '@solidchain/badge-buddy-common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProcessorException } from '../../processors/_exceptions/processor.exception';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EventTrackingService {
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(DiscordParticipant.name)
    private discordParticipantModel: Model<DiscordParticipant>,
  ) {}

  async handleParticipantTracking(oldState: VoiceState, newState: VoiceState) {
    if (this.conditionsForTrackingNotBeenMet(oldState, newState)) {
      return;
    }

    const communityEvents: CommunityEventDto[] = await this.getCommunityEvents(
      oldState,
      newState,
    );

    for (const communityEvent of communityEvents) {
      if (
        this.conditionsForTrackingNotBeenMetForCommunityEvent(
          communityEvent,
          oldState,
          newState,
        )
      ) {
        continue;
      }

      if (
        this.hasUserJoinedVoiceChannel(oldState, newState) ||
        this.hasUserUnDeafened(oldState, newState) ||
        this.hasUserHoppedIntoVoiceChannel(
          oldState,
          newState,
          communityEvent.voiceChannelId,
        )
      ) {
        const guildMember = newState.member as GuildMember;
        const userCache: DiscordParticipantDto | undefined =
          await this.cacheManager.get(
            `tracking:events:${communityEvent.eventId.toString()}:participants:${guildMember.id.toString()}`,
          );
        if (!userCache) {
          await this.handleUserJoinedVoiceChannel(communityEvent, guildMember);
          continue;
        }
        await this.handleUserRejoinedVoiceChannel(
          communityEvent,
          guildMember,
          userCache,
        );
        continue;
      }

      if (
        this.hasUserDeafened(oldState, newState) ||
        this.hasUserLeftVoiceChannel(oldState, newState) ||
        this.hasUserHoppedOutOfVoiceChannel(
          oldState,
          newState,
          communityEvent.voiceChannelId,
        )
      ) {
        const guildMember = newState.member as GuildMember;
        await this.handleUserLeftVoiceChannel(communityEvent, guildMember);
      }
    }
  }

  private getCommunityEvents = async (
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<CommunityEventDto[]> => {
    const results = [];
    let prevEvent;
    let newEvent;
    if (!oldState.channelId) {
      newEvent = await this.getActiveEventForVoiceChannel(newState.channelId);
    } else if (!newState.channelId) {
      prevEvent = await this.getActiveEventForVoiceChannel(oldState.channelId);
    } else if (newState.channelId == oldState.channelId) {
      newEvent = await this.getActiveEventForVoiceChannel(newState.channelId);
    } else {
      prevEvent = await this.getActiveEventForVoiceChannel(oldState.channelId);
      newEvent = await this.getActiveEventForVoiceChannel(newState.channelId);
    }
    newEvent ? results.push(newEvent) : null;
    prevEvent ? results.push(prevEvent) : null;
    return results;
  };

  /**
   * Conditions for tracking not been met
   *
   * If the user has not changed voice channels or deafened
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

  private conditionsForTrackingNotBeenMetForCommunityEvent(
    communityEvent: CommunityEventDto,
    oldState: VoiceState,
    newState: VoiceState,
  ): boolean {
    return (
      communityEvent.voiceChannelId !== oldState.channelId &&
      communityEvent.voiceChannelId !== newState.channelId
    );
  }

  private async handleUserLeftVoiceChannel(
    communityEvent: CommunityEventDto,
    guildMember: GuildMember,
  ) {
    this.logger.log(
      `User ${guildMember.user.username} has left a voice channel or deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent.eventId}`,
    );
    let userCache: DiscordParticipantDto | undefined =
      await this.cacheManager.get(
        `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      );
    if (!userCache) {
      this.logger.warn(
        `User not found in cache, fetching from db, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
      const dbUser = await this.discordParticipantModel
        .findOne({
          eventId: communityEvent.eventId,
          userId: guildMember.id,
        })
        .exec()
        .catch((err) => {
          this.logger.error(err);
          throw new ProcessorException(
            `Failed to fetch user from db, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
          );
        });
      if (!dbUser) {
        throw new ProcessorException(
          `User not found in db, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
        );
      }
      userCache = new DiscordParticipantDto();
      userCache.eventId = communityEvent.eventId;
      userCache.durationInMinutes = dbUser.durationInMinutes;
      userCache.startDate = dbUser.startDate.toISOString();
      userCache.userTag = dbUser.userTag;
      userCache.userId = dbUser.userId;
      userCache.endDate = dbUser.endDate?.toISOString();
    }
    const startDate = new Date(userCache.startDate);
    const endDate = new Date();
    const durationInMinutes =
      (endDate.getTime() - startDate.getTime()) / 1000 / 60;
    userCache.endDate = endDate.toString();
    userCache.durationInMinutes += durationInMinutes;
    await this.cacheManager.set(
      `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      userCache,
      0,
    );
    this.logger.verbose(
      `User stored in cache, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
    );
  }

  private async handleUserJoinedVoiceChannel(
    communityEvent: CommunityEventDto,
    guildMember: GuildMember,
  ) {
    this.logger.log(
      `User ${guildMember.user.username} has joined a voice channel or un-deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent.eventId}`,
    );
    const startDate = new Date();
    const userCache = new DiscordParticipantDto();
    userCache.eventId = communityEvent.eventId;
    userCache.userId = guildMember.id;
    userCache.userTag = guildMember.user.tag;
    userCache.startDate = startDate.toISOString();
    userCache.durationInMinutes = 0.0;
    await this.cacheManager.set(
      `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      userCache,
      0,
    );
    this.logger.verbose(
      `User stored in cache, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
    );
  }

  private async handleUserRejoinedVoiceChannel(
    communityEvent: CommunityEventDto,
    guildMember: GuildMember,
    userCache: DiscordParticipantDto,
  ) {
    this.logger.log(
      `User ${guildMember.user.username} has rejoined a voice channel/un-deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent.eventId}`,
    );
    userCache.startDate = new Date().toISOString();
    delete userCache.endDate;
    await this.cacheManager.set(
      `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      userCache,
      0,
    );
    this.logger.verbose(
      `User stored in cache, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
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

  private async getActiveEventForVoiceChannel(
    voiceChannelId: string | null,
  ): Promise<CommunityEventDto | null> {
    return (
      (await this.cacheManager.get(
        `tracking:events:active:voiceChannelId:${voiceChannelId}`,
      )) ?? null
    );
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
