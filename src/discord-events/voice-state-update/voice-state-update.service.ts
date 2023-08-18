import { Injectable } from '@nestjs/common';
import { VoiceState } from 'discord.js';

@Injectable()
export class VoiceStateUpdateService {
  async handleParticipantTracking(oldState: VoiceState, newState: VoiceState) {
    if (newState.deaf && !oldState.deaf) {
      // todo: users leaves voice channel
      return;
    }

    if (!newState.deaf && oldState.deaf) {
      // todo: user joins voice channel
      return;
    }
  }

  // async isEventActiveForVoiceChannel(
  //   voiceChannelId: string,
  // ): Promise<boolean> {}
  //
  // async getActiveEventsForGuildId(guildId: string): Promise<string[]> {}
}
