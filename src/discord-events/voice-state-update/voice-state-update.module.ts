import { Module } from '@nestjs/common';
import { EventTrackingService } from './event-tracking.service';
import { VoiceStateUpdateEvent } from './voice-state-update.event';

@Module({
  imports: [],
  providers: [VoiceStateUpdateEvent, EventTrackingService],
})
export class VoiceStateUpdateModule {}
