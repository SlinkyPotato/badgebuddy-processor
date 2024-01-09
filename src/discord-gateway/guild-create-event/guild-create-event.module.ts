import { Logger, Module } from '@nestjs/common';
import { GuildCreateEventService } from './guild-create-event.service';
import { ConfigModule } from '@nestjs/config';
import { DiscordModule } from '@discord-nestjs/core';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DiscordModule.forFeature(), HttpModule, ConfigModule],
  providers: [GuildCreateEventService, Logger],
})
export class GuildCreateEventModule {}
