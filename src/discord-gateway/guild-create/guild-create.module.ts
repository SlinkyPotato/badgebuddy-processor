import { Logger, Module } from '@nestjs/common';
import { GuildCreateEvent } from './guild-create.event';
import { GuildCreateService } from './guild-create.service';
import { DiscordGuildsModule } from '../../discord-guilds/discord-guilds.module';
import { ConfigModule } from '@nestjs/config';
import { DiscordModule } from '@discord-nestjs/core';

@Module({
  imports: [DiscordModule.forFeature(), ConfigModule, DiscordGuildsModule],
  providers: [GuildCreateEvent, GuildCreateService, Logger],
})
export class GuildCreateModule {}
