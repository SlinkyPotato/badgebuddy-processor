import { Injectable, Logger } from '@nestjs/common';
import { Once } from '@discord-nestjs/core';
import { Client } from 'discord.js';

@Injectable()
export class ReadyEventService {
  constructor(private readonly logger: Logger) {}

  @Once(`ready`)
  onReady(client: Client): void {
    this.logger.log('Discord client is ready.');
    client.guilds.cache.forEach((guild) => {
      this.logger.log(`guildId: ${guild.id}, name: ${guild.name}`);
    });
  }
}
