import { Logger, Module } from '@nestjs/common';
import { VoiceStateUpdateEventService } from './voice-state-update-event.service';

@Module({
  imports: [],
  providers: [
    VoiceStateUpdateEventService,
    Logger
  ],
})
export class VoiceStateUpdateEventModule {}
