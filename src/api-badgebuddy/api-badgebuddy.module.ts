import { Module } from '@nestjs/common';
import { AuthApiModule } from './auth-api/auth-api.module';
import { DiscordBotApiModule } from './discord-bot-api/discord-bot-api.module';

@Module({
  imports: [AuthApiModule, DiscordBotApiModule],
})
export class ApiBadgebuddyModule {}
