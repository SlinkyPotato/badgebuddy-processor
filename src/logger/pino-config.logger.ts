import { PinoLogger } from 'nestjs-pino';
import NodeEnvs from '../config/enums/node-envs.enum';

export class PinoConfigLogger extends PinoLogger {
  constructor() {
    console.log('creating logger...');
    // const { formatters, messageKey, timestamp } = ecsFormat();
    const targets: any = [
      {
        level: 'info', // all logs printed since info does not map
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
        options: {},
      });
    }
    super({
      pinoHttp: {
        name: 'badge-buddy-api',
        level: 'info',
        transport: {
          targets: targets,
        },
      },
    });
  }
}
