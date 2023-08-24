import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits, Partials } from 'discord.js';

import { DiscordModule, DiscordModuleOption } from '@discord-nestjs/core';
import { ProcessorsModule } from './processors/processors.module';
import { DiscordEventsModule } from './discord-events/discord-events.module';
import {
  configureBull,
  configureCache,
  EnvConfig,
  validationSchema,
} from '@solidchain/badge-buddy-common';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      cache: true,
      load: [EnvConfig],
      validationSchema: validationSchema(),
      validationOptions: {},
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) =>
        configureCache(configService),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configureBull(configService),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
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
    ConfigModule,
    ProcessorsModule,
    DiscordEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
