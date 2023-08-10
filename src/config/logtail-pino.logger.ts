import { LoggerService } from '@nestjs/common';
import pino, { LoggerOptions } from 'pino';
import { PinoLogger } from 'nestjs-pino';
import NodeEnvs from './enums/node-envs.enum';

export class LogtailPinoLogger extends PinoLogger implements LoggerService {
  constructor() {
    super({
      pinoHttp: { logger: LogtailPinoLogger.createPino() },
    });
  }

  static createPino(): pino.Logger {
    console.log('creating pino logger');
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
          sourceToken: process.env.LOGTAIL_TOKEN,
        },
      },
    ];
    if (process.env.NODE_ENV !== NodeEnvs.PRODUCTION) {
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

  log(message: any, ...optionalParams: any[]): any {
    this.info({ ...optionalParams }, message);
  }

  info(mergingObj: unknown, msg?: string, ...args: any[]): void {
    super.info(mergingObj, msg, ...args);
  }
}
