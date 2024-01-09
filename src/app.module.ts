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
import { ScheduleModule } from '@nestjs/schedule';
import { CronJobsModule } from './cron-jobs/cron-jobs.module';

@Module({
  imports: [
    CommonConfigModule.forRoot({
      validationSchema: {
        MARIADB_HOST: Joi.string().required(),
        MARIADB_PORT: Joi.number().required(),
        MARIADB_USERNAME: Joi.string().required(),
        MARIADB_PASSWORD: Joi.string().required(),
        MARIADB_DATABASE: Joi.string().required(),
        MARIADB_LOGGING: Joi.required(),
        REDIS_HOST: Joi.string().optional(),
        REDIS_PORT: Joi.number().optional(),
        REDIS_CACHE_MIN: Joi.number().required(),
      },
    }),
    RedisConfigModule.forRootAsync(),
    RedisBullConfigModule.forRootAsync(),
    CommonTypeOrmModule.forRootAsync(),
    DiscordConfigModule.forRootAsync(),
    CommunityEventsQueueModule,
    DiscordGatewayModule,
    ScheduleModule.forRoot(),
    CronJobsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
