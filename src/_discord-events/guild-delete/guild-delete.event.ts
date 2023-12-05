import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Guild } from 'discord.js';
import { DiscordGuildsService } from '../../discord-guilds/discord-guilds.service';

@Injectable()
export class GuildDeleteEvent {
  constructor(
    private readonly logger: Logger,
    private guildsApiService: DiscordGuildsService,
  ) {}

  @On('guildDelete')
  onGuild(guild: Guild): void {
    this.logger.log(`guild left, guildId: ${guild.id}, name: ${guild.name}`);
    this.guildsApiService.removeGuild(guild.id.toString()).catch((err) => {
      this.logger.error(err);
    });
  }
}
