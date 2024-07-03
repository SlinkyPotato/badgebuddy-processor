import { Logger, Module } from '@nestjs/common';
import { GuildCreateEventService } from './guild-create-event.service';
import { DiscordModule } from '@discord-nestjs/core';
import { DiscordBotApiModule } from '@/api-badgebuddy/discord-bot-api/discord-bot-api.module';

@Module({
  imports: [DiscordModule.forFeature(), DiscordBotApiModule],
  providers: [GuildCreateEventService, Logger],
})
export class GuildCreateEventModule {}
