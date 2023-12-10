import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { EventTrackingService } from './event-tracking.service';
import { VoiceState } from 'discord.js';

@Injectable()
export class VoiceStateUpdateEvent {
  constructor(
    private eventTrackingService: EventTrackingService,
    private readonly logger: Logger,
  ) {}

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    this.eventTrackingService
      .handleParticipantTracking(oldState, newState)
      .catch((err) => {
        this.logger.error(err);
      });
  }
}
