import { Module } from '@nestjs/common';
import { DiscordGatewayModule } from './discord-gateway/discord-gateway.module';
import {
  CommonConfigModule,
  CommonTypeOrmModule,
  RedisConfigModule,
  RedisBullConfigModule,
  DiscordConfigModule,
} from '@badgebuddy/common';
import { CommunityEventsQueueModule } from './community-events-queue/community-events-queue.module';

@Module({
  imports: [
    CommonConfigModule.forRoot(),
    RedisConfigModule.forRootAsync(),
    RedisBullConfigModule.forRootAsync(),
    CommonTypeOrmModule.forRootAsync(),
    DiscordConfigModule.forRootAsync(),
    CommunityEventsQueueModule,
    DiscordGatewayModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
