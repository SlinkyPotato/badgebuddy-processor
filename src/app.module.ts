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
import Joi from 'joi';

@Module({
  imports: [
    CommonConfigModule.forRoot({
      validationSchema: {
        MARIADB_HOST: Joi.string().required(),
        MARIADB_PORT: Joi.number().required(),
        MARIADB_USERNAME: Joi.string().required(),
        MARIADB_PASSWORD: Joi.string().required(),
        MARIADB_DATABASE: Joi.string().required(),
      }
    }),
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
