import { Logger, Module } from '@nestjs/common';
import { GuildDeleteEventService } from './guild-delete-event.service';
import { DiscordModule } from '@discord-nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

@Module({
  imports: [
    DiscordModule.forFeature(),
    HttpModule,
    ConfigModule.forFeature(() => {
      return {
        validationSchema: Joi.object({
          BADGE_BUDDY_API: Joi.string().required(),
        }),
      }
    }),
  ],
  providers: [
    GuildDeleteEventService, 
    Logger
  ],
})
export class GuildDeleteModule {}
