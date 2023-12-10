import { Logger, Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { ReadyEventService } from './ready-event.service';

@Module({
  imports: [
    DiscordModule.forFeature()
  ],
  providers: [
    ReadyEventService, 
    Logger
  ],
})
export class ReadyEventModule {}
