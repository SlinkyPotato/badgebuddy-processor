import { Injectable } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { VoiceStateUpdateService } from './voice-state-update.service';
import { VoiceState } from 'discord.js';

@Injectable()
export class VoiceStateUpdateEvent {
  constructor(private voiceStateUpdateService: VoiceStateUpdateService) {}

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    await this.voiceStateUpdateService.handleParticipantTracking(
      oldState,
      newState,
    );
  }
}
