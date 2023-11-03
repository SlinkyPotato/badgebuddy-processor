import { Module } from '@nestjs/common';
import { ProcessorsModule } from './processors/processors.module';
import { DiscordEventsModule } from './discord-events/discord-events.module';
import {
  CommonConfigModule,
  CommonTypeOrmModule,
  RedisConfigModule,
  RedisBullConfigModule,
  DiscordConfigModule,
  MongooseConfigModule,
} from '@badgebuddy/common';

@Module({
  imports: [
    CommonConfigModule.forRoot(),
    RedisConfigModule.forRootAsync(),
    RedisBullConfigModule.forRootAsync(),
    CommonTypeOrmModule.forRootAsync(),
    MongooseConfigModule.forRootAsync(),
    DiscordConfigModule.forRootAsync(),
    ProcessorsModule,
    DiscordEventsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
