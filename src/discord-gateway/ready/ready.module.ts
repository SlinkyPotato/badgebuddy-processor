import { Logger, Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { ReadyEvent } from './ready.event';

@Module({
  imports: [DiscordModule.forFeature()],
  providers: [ReadyEvent, Logger],
})
export class ReadyModule {}
