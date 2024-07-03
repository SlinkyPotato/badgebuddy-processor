import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ENV_BADGE_BUDDY_API_HOST } from '@/app.constants';
import { firstValueFrom } from 'rxjs';
import {
  DiscordBotPostRequestDto,
  DiscordBotPostResponseDto,
} from '@badgebuddy/common';
import { AxiosResponse } from 'axios';
import { AuthApiService } from '@/api-badgebuddy/auth-api/auth-api.service';

@Injectable()
export class DiscordBotApiService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authApiService: AuthApiService,
    private readonly logger: Logger,
  ) {}

  onModuleInit() {
    this.httpService.axiosRef.interceptors.request.use(
      this.authApiService.commonAuthRequestInterceptor().intercept,
    );
  }

  /**
   * Add the discord bot to the guild
   * @param request from common
   */
  async addDiscordBotToGuild(
    request: DiscordBotPostRequestDto,
  ): Promise<DiscordBotPostResponseDto> {
    const url = `${this.configService.get<string>(
      ENV_BADGE_BUDDY_API_HOST,
    )}/discord/bot` as const;
    let response: AxiosResponse<DiscordBotPostResponseDto>;
    try {
      response = await firstValueFrom(
        this.httpService.post<DiscordBotPostResponseDto>(url, request),
      );
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
    if (!response || response.status !== 201) {
      this.logger.warn(response);
      throw new Error(`status code: ${response.status}`);
    }
    return response.data;
  }
}
