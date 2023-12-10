import { Logger, Module } from '@nestjs/common';
import { VoiceStateUpdateEventService } from './voice-state-update-event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityParticipantDiscordEntity } from '@badgebuddy/common'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunityParticipantDiscordEntity,
    ])
  ],
  providers: [
    VoiceStateUpdateEventService, 
    Logger
  ],
})
export class VoiceStateUpdateEventModule {}
