import { Logger, Module } from '@nestjs/common';
import { EventsProcessorService } from './events-processor.service';
import { DiscordModule } from '@discord-nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CommunityEvent,
  DiscordParticipant,
  DiscordParticipantSchema,
  CommunityEventSchema,
} from '@badgebuddy/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    DiscordModule.forFeature(),
    MongooseModule.forFeature([
      { name: CommunityEvent.name, schema: CommunityEventSchema },
      { name: DiscordParticipant.name, schema: DiscordParticipantSchema },
    ]),
    BullModule.registerQueue({
      name: 'events',
    }),
  ],
  providers: [Logger, EventsProcessorService],
})
export class EventsProcessorModule {}
