import { Logger, Module } from '@nestjs/common';
import { GuildDeleteEvent } from './guild-delete.event';
import { DiscordGuildsModule } from '../../discord-guilds/discord-guilds.module';
import { DiscordModule } from '@discord-nestjs/core';

@Module({
  imports: [DiscordModule.forFeature(), DiscordGuildsModule],
  providers: [GuildDeleteEvent, Logger],
})
export class GuildDeleteModule {}
