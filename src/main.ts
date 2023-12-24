import 'dotenv/config'; // must be first import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommonPinoLogger, CommonPinoLoggerService } from '@badgebuddy/common';

async function bootstrap() {
  const pinoLogger = new CommonPinoLogger('processor');
  const pinoLoggerService = new CommonPinoLoggerService(pinoLogger);
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: pinoLoggerService,
  });

  context.enableShutdownHooks();
}

bootstrap()
  .then(() => {
    console.log('Processor started');
  })
  .catch((err) => {
    console.error('Error starting processor', err);
    process.exit(1);
  });
