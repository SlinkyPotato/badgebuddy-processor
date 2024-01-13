import { Injectable, Logger } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Guild } from 'discord.js';
import { DiscordBotApiService } from '@/api-badgebuddy/discord-bot-api/discord-bot-api.service';
import { DiscordBotPostResponseDto } from '@badgebuddy/common';

@Injectable()
export class GuildCreateEventService {
  constructor(
    private readonly logger: Logger,
    private readonly discordBotApiService: DiscordBotApiService,
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
    let response: DiscordBotPostResponseDto;
    try {
      response = await this.discordBotApiService.addDiscordBotToGuild({
        guildSId: guild.id,
      });
    } catch (err) {
      this.logger.error(
        `error adding discord bot to guild, guildId: ${guild.id}, name: ${guild.name}, error: ${err}`,
      );
      return;
    }
    this.logger.log(
      `successfully added discord bot to guild, guildSId: ${guild.id}, name: ${guild.name}, botId: ${response.discordBotSettingsId}`,
    );
  }
}
