import 'dotenv/config'; // must be first import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogtailPinoLogger } from './config/logtail-pino.logger';

async function bootstrap() {
  const pinoLogger = new LogtailPinoLogger();
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: pinoLogger,
  });
}

bootstrap();
