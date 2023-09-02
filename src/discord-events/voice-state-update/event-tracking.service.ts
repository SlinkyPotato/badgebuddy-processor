import { Inject, Injectable, Logger } from '@nestjs/common';
import { GuildMember, VoiceState } from 'discord.js';
import {
  CommunityEventDto,
  DiscordParticipantDto,
} from '@solidchain/badge-buddy-common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProcessorException } from '../../processors/_exceptions/processor.exception';

@Injectable()
export class EventTrackingService {
  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async handleParticipantTracking(oldState: VoiceState, newState: VoiceState) {
    const communityEvent: CommunityEventDto | null =
      (await this.getActiveEventForVoiceChannel(newState.channelId)) ??
      (await this.getActiveEventForVoiceChannel(oldState.channelId));

    if (!communityEvent) {
      return;
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
          `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
        );
      if (!userCache) {
        return this.handleUserJoinedVoiceChannel(communityEvent, guildMember);
      }
      return this.handleUserRejoinedVoiceChannel(
        communityEvent,
        guildMember,
        userCache,
      );
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
      return this.handleUserLeftVoiceChannel(communityEvent, guildMember);
    }
  }

  private async handleUserLeftVoiceChannel(
    communityEvent: CommunityEventDto,
    guildMember: GuildMember,
  ) {
    this.logger.log(
      `User ${guildMember.user.username} has left a voice channel or deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent.voiceChannelId}`,
    );
    const userCache: DiscordParticipantDto | undefined =
      await this.cacheManager.get(
        `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      );
    if (!userCache) {
      //TODO: maybe pull from db
      throw new ProcessorException(
        `User not found in cache, was service down? eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
      );
    }
    const endDate = new Date();
    const durationInMinutes =
      (endDate.getTime() - userCache.startDate.getTime()) / 1000 / 60;
    userCache.endDate = endDate;
    userCache.durationInMinutes += durationInMinutes;
    await this.cacheManager.set(
      `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      userCache,
    );
    this.logger.log(
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
    userCache.startDate = startDate;
    userCache.durationInMinutes = 0.0;
    userCache.startDate = startDate;
    await this.cacheManager.set(
      `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      userCache,
    );
    const keys: string[] | null | undefined = await this.cacheManager.get(
      `tracking:events:${communityEvent.eventId}:participants:keys`,
    );
    if (keys) {
      await this.cacheManager.set(
        `tracking:events:${communityEvent.eventId}:participants:keys`,
        [...keys, guildMember.id],
      );
    }
    this.logger.log(
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
    userCache.startDate = new Date();
    delete userCache.endDate;
    await this.cacheManager.set(
      `tracking:events:${communityEvent.eventId}:participants:${guildMember.id}`,
      userCache,
    );
    this.logger.log(
      `User rejoined and stored in cache, eventId: ${communityEvent.eventId}, userId: ${guildMember.id}, guildId: ${guildMember.guild.id}`,
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
      !!newState.deaf
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
