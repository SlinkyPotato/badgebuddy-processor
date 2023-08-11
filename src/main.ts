import 'dotenv/config'; // must be first import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const context = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  context.useLogger(context.get(Logger));

  // TODO: add shutdown hook
  context.enableShutdownHooks();
}

bootstrap();
