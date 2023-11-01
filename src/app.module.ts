import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits, Partials } from 'discord.js';

import { DiscordModule, DiscordModuleOption } from '@discord-nestjs/core';
import { ProcessorsModule } from './processors/processors.module';
import { DiscordEventsModule } from './discord-events/discord-events.module';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import {
  configureBullOptions,
  configureCacheOptions,
  CommonConfigModule,
  CommonTypeOrmModule,
} from '@solidchain/badge-buddy-common';

@Module({
  imports: [
    CommonConfigModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) =>
        configureCacheOptions(configService),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configureBullOptions(configService),
    }),
    CommonTypeOrmModule.forRootAsync(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    DiscordModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<{ DISCORD_BOT_TOKEN: string }, true>,
      ): Promise<DiscordModuleOption> | DiscordModuleOption => ({
        token: configService.get('DISCORD_BOT_TOKEN', { infer: true }),
        discordClientOptions: {
          // TODO: Reduce and compact the intents
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
          ],
          partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction,
            Partials.User,
          ],
        },
        failOnLogin: true,
      }),
    }),
    ProcessorsModule,
    DiscordEventsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
