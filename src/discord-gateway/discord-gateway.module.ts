import { Module } from '@nestjs/common';
import { VoiceStateUpdateEventModule } from './voice-state-update-event/voice-state-update-event.module';
import { ReadyEventModule } from './ready-event/ready.module';
import { GuildCreateEventModule } from './guild-create-event/guild-create-event.module';
import { GuildDeleteModule } from './guild-delete-event/guild-delete-event.module';

@Module({
  imports: [
    ReadyEventModule,
    GuildCreateEventModule,
    GuildDeleteModule,
    VoiceStateUpdateEventModule
  ],
})
export class DiscordGatewayModule {}
