import { ENV_BADGE_BUDDY_API_HOST } from '@/app.constants';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthApiService } from '../../auth-api.service';
import { InternalAxiosRequestConfig } from 'axios';

@Injectable()
export class AuthRequestInterceptor {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private authService: AuthApiService,
  ) {}

  intercept(
    config: InternalAxiosRequestConfig<{
      organizerSId: string;
    }>,
  ) {
    const url = config.url;
    const bbBaseUrl = this.configService.get<string>(ENV_BADGE_BUDDY_API_HOST);

    if (!url || !url.startsWith(`${bbBaseUrl}`)) {
      this.logger.verbose('skip intercepting request');
      return config;
    }

    if (!config.headers) {
      return config;
    }

    const discordUserSId = config?.data!.organizerSId;
    const authToken = this.authService.generateToken(discordUserSId);

    config.headers.Authorization = `Bearer ${authToken}`;
    this.logger.verbose(`intercepted request: ${url}`);
    return config;
  }
}
