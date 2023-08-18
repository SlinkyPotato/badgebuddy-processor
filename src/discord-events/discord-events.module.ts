import { Module } from '@nestjs/common';
import { VoiceStateUpdateModule } from './voice-state-update/voice-state-update.module';

@Module({
  imports: [VoiceStateUpdateModule],
})
export class DiscordEventsModule {}
