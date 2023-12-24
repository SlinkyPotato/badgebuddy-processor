import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Guild } from 'discord.js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GuildCreateEventService {
  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
  ) {}

  @On('guildCreate')
  async onGuildCreate(guild: Guild): Promise<void> {
    if (!guild.available) {
      this.logger.warn(
        `guild outage for guildId: ${guild.id}, guildName: ${guild.name}`,
      );
      return;
    }
    this.logger.log(`guild joined, guildId: ${guild.id}, name: ${guild.name}`);
    try {
      const response = await firstValueFrom(this.httpService.post(`${process.env.BADGE_BUDDY_API}/discord/bot`, {
        guildSId: guild.id,
      }));
      if (response.status !== 200) {
        this.logger.error(`error adding discord bot to guild, guildId: ${guild.id}, name: ${guild.name}, status: ${response.status}`);
        return;
      }
      this.logger.log(`discord bot added to guild, guildId: ${guild.id}, name: ${guild.name}`);
    } catch(err) {
      this.logger.error(`error adding discord bot to guild, guildId: ${guild.id}, name: ${guild.name}, error: ${err}`);
    }
  }
}
