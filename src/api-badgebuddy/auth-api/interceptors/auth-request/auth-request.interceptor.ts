import { ENV_BADGE_BUDDY_API_HOST } from '@/app.constants';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalAxiosRequestConfig } from 'axios';
import { ProcessorTokenDto } from '@badgebuddy/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthRequestInterceptor {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  intercept(config: InternalAxiosRequestConfig<any>) {
    const url = config.url;
    const bbBaseUrl = this.configService.get<string>(ENV_BADGE_BUDDY_API_HOST);

    if (!url || !url.startsWith(`${bbBaseUrl}`)) {
      this.logger.verbose('skip intercepting request');
      return config;
    }

    if (!config.headers) {
      return config;
    }

    const authToken = this.generateToken();

    config.headers.Authorization = `Bearer ${authToken}`;
    this.logger.verbose(`intercepted request: ${url}`);
    return config;
  }

  generateToken(): string {
    return this.jwtService.sign({
      sessionId: crypto.randomUUID().toString(),
    } as ProcessorTokenDto);
  }
}
