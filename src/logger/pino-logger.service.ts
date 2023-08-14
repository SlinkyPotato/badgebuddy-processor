import { LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export class PinoLoggerService implements LoggerService {
  pinoLogger: PinoLogger;

  constructor(pinoLogger: PinoLogger) {
    this.pinoLogger = pinoLogger;
  }

  error(message: any, ...optionalParams: any[]): any {
    if (optionalParams.length > 0) {
      this.pinoLogger.error({ ...optionalParams }, message);
    } else {
      this.pinoLogger.error(message);
    }
  }

  log(message: any, ...optionalParams: any[]): any {
    if (optionalParams.length > 0) {
      this.pinoLogger.info({ ...optionalParams }, message);
    } else {
      this.pinoLogger.info(message);
    }
  }

  warn(message: any, ...optionalParams: any[]): any {
    if (optionalParams.length > 0) {
      this.pinoLogger.warn({ ...optionalParams }, message);
    } else {
      this.pinoLogger.warn(message);
    }
  }

  debug(message: any, ...optionalParams: any[]): any {
    if (optionalParams.length > 0) {
      this.pinoLogger.debug({ ...optionalParams }, message);
    } else {
      this.pinoLogger.debug(message);
    }
  }

  verbose(message: any, ...optionalParams: any[]): any {
    if (optionalParams.length > 0) {
      this.pinoLogger.trace({ ...optionalParams }, message);
    } else {
      this.pinoLogger.trace(message);
    }
  }
}
