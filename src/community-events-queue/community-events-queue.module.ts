import { CommunityEventDiscordEntity, DISCORD_COMMUNITY_EVENTS_QUEUE, CommunityParticipantDiscordEntity } from '@badgebuddy/common';
import { DiscordModule } from '@discord-nestjs/core';
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { CommunityEventsProcessorService } from './community-events-queue.service';

@Module({
  imports: [
    DiscordModule.forFeature(),
    BullModule.registerQueue({
      name: DISCORD_COMMUNITY_EVENTS_QUEUE,
    }),
  ],
  providers: [
    Logger,
    CommunityEventsProcessorService,
  ],
})
export class CommunityEventsQueueModule {}
