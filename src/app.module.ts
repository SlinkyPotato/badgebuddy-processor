import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import LogtailConfig from './config/logtail.config';
import { MongooseModule } from '@nestjs/mongoose';
import MongoConfig from './config/mongo.config';
import SystemConfig from './config/system.config';
import RedisConfig from './config/redis.config';
import DiscordConfig from './config/discord.config';
import { GatewayIntentBits, Partials } from 'discord.js';

import { DiscordModule, DiscordModuleOption } from '@discord-nestjs/core';
import { ProcessorsModule } from './processors/processors.module';
import { DiscordEventsModule } from './discord-events/discord-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      cache: true,
      load: [
        LogtailConfig,
        MongoConfig,
        SystemConfig,
        RedisConfig,
        DiscordConfig,
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<any, true>) => ({
        uri: configService.get('mongo.uri'),
      }),
    }),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<any, true>,
      ): Promise<DiscordModuleOption> | DiscordModuleOption => ({
        token: configService.get('discord.token'),
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
