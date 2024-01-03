import { DISCORD_COMMUNITY_EVENTS_QUEUE } from '@badgebuddy/common';
import { DiscordModule } from '@discord-nestjs/core';
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { CommunityEventsProcessorService } from './community-events-queue.service';
import { CronJobsModule } from '@/cron-jobs/cron-jobs.module';

@Module({
  imports: [
    DiscordModule.forFeature(),
    BullModule.registerQueue({
      name: DISCORD_COMMUNITY_EVENTS_QUEUE,
    }),
    CronJobsModule,
  ],
  providers: [Logger, CommunityEventsProcessorService],
})
export class CommunityEventsQueueModule {}
