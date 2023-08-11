import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { LoggerOptions } from 'pino';
import NodeEnvs from '../enums/node-envs.enum';

@Injectable()
export class PinoLoggerService {
  constructor(private configService: ConfigService) {}

  createPinoLogger(): pino.Logger {
    console.log('Initializing pino logger...');
    const targets: any = [
      {
        level: 'info',
        target: 'pino/file',
        options: {
          destination: './logs/app.log',
          sync: false,
          mkdir: true,
        },
      },
      {
        level: 50,
        target: 'pino/file',
        options: {
          destination: './logs/error.log',
          sync: false,
          mkdir: true,
        },
      },
      {
        target: '@logtail/pino',
        options: {
          sourceToken: this.configService.get('logtail.token'),
        },
      },
    ];
    if (this.configService.get('system.nodeEnv') !== NodeEnvs.PRODUCTION) {
      // https://github.com/pinojs/pino-pretty
      targets.push({
        target: 'pino/file',
      });
    }
    return pino({
      name: 'badge-buddy-api',
      level: 'info',
      transport: {
        targets: targets,
      },
    } as LoggerOptions);
  }
}
