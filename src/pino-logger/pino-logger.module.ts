import { Module } from '@nestjs/common';
import { PinoLoggerService } from './pino-logger.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ConfigService, PinoLoggerService],
})
export class PinoLoggerModule {}
