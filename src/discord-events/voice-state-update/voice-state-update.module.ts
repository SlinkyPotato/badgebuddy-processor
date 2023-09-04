import { Logger, Module } from '@nestjs/common';
import { EventTrackingService } from './event-tracking.service';
import { VoiceStateUpdateEvent } from './voice-state-update.event';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CommunityEvent,
  CommunityEventSchema,
  DiscordParticipant,
  DiscordParticipantSchema,
} from '@solidchain/badge-buddy-common';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiscordParticipant.name, schema: DiscordParticipantSchema },
    ]),
  ],
  providers: [VoiceStateUpdateEvent, EventTrackingService, Logger],
})
export class VoiceStateUpdateModule {}
