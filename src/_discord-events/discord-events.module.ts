import { Module } from '@nestjs/common';
import { GuildDeleteModule } from './guild-delete/guild-delete.module';
import { GuildCreateModule } from './guild-create/guild-create.module';
import { ReadyModule } from './ready/ready.module';

@Module({
  imports: [ReadyModule, GuildCreateModule, GuildDeleteModule],
  providers: [],
})
export class DiscordEventsModule {}
