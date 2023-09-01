import { Injectable } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { EventTrackingService } from './event-tracking.service';
import { VoiceState } from 'discord.js';

@Injectable()
export class VoiceStateUpdateEvent {
  constructor(private eventTrackingService: EventTrackingService) {}

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    await this.eventTrackingService.handleParticipantTracking(
      oldState,
      newState,
    );
  }
}
