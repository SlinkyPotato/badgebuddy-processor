import { Logger, Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { BullModule } from '@nestjs/bull';
import { DISCORD_COMMUNITY_EVENTS_QUEUE } from '@badgebuddy/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DISCORD_COMMUNITY_EVENTS_QUEUE,
    }),
  ],
  providers: [CronJobsService, Logger],
  exports: [CronJobsService],
})
export class CronJobsModule {}
