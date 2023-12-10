import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Guild } from 'discord.js';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GuildDeleteEventService {
  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @On('guildDelete')
  onGuild(guild: Guild): void {
    this.logger.log(`guild left, guildId: ${guild.id}, name: ${guild.name}`);
    this.httpService.delete(`${this.configService.get('BADGE_BUDDY_API')}/discord/bot`, {
      data: {
        guildSId: guild.id,
      }
    }).subscribe(() => {
      this.logger.log(`discord bot deleted from guild, guildId: ${guild.id}, name: ${guild.name}`);
    });
  }
}
