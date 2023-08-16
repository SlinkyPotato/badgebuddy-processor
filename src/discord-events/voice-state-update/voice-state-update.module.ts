import { Module } from '@nestjs/common';
import { VoiceStateUpdateService } from './voice-state-update.service';

@Module({
  providers: [VoiceStateUpdateService],
})
export class VoiceStateUpdateModule {}
