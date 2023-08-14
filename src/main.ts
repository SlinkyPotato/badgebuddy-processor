import 'dotenv/config'; // must be first import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PinoConfigLogger } from './logger/pino-config.logger';
import { PinoLoggerService } from './logger/pino-logger.service';

async function bootstrap() {
  const pinoLogger = new PinoConfigLogger();
  const pinoLoggerService = new PinoLoggerService(pinoLogger);
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: pinoLoggerService,
  });

  // TODO: add shutdown hook
  context.enableShutdownHooks();
}

bootstrap();
