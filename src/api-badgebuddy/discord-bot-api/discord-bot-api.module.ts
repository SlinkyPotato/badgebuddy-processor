import { Logger, Module } from '@nestjs/common';
import { DiscordBotApiService } from './discord-bot-api.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthApiModule } from '@/api-badgebuddy/auth-api/auth-api.module';

@Module({
  imports: [ConfigModule, AuthApiModule, HttpModule],
  providers: [DiscordBotApiService, Logger],
  exports: [DiscordBotApiService],
})
export class DiscordBotApiModule {}
