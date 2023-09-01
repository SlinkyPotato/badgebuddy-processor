import { Inject, Injectable, Logger } from '@nestjs/common';
import { GuildMember, VoiceState } from 'discord.js';
import { CommunityEventDto } from '@solidchain/badge-buddy-common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
      this.logger.log(
        `User ${guildMember.user.username} has joined a voice channel or un-deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent._id}`,
      );
      //TODO: begin tracking user
      return;
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
      this.logger.log(
        `User ${guildMember.user.username} has left a voice channel or deafened, guildId: ${guildMember.guild.id}, eventId: ${communityEvent._id}`,
      );
      //TODO: stop tracking user
      return;
    }
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
    return newState.channelId !== oldState.channelId && !oldState.channelId;
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
