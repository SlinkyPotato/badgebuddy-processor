import { Logger, Module } from '@nestjs/common';
import { GuildDeleteEventService } from './guild-delete-event.service';
import { DiscordModule } from '@discord-nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DiscordModule.forFeature(), HttpModule, ConfigModule],
  providers: [GuildDeleteEventService, Logger],
})
export class GuildDeleteModule {}
