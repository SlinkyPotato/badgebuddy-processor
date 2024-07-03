import { Injectable } from '@nestjs/common';
import { InternalAxiosRequestConfig } from 'axios';
import { AuthRequestInterceptor } from '@/api-badgebuddy/auth-api/interceptors/auth-request/auth-request.interceptor';

@Injectable()
export class AuthApiService {
  constructor(
    private readonly authRequestInterceptor: AuthRequestInterceptor,
  ) {}

  commonAuthRequestInterceptor() {
    return {
      intercept: (config: InternalAxiosRequestConfig<any>) => {
        return this.authRequestInterceptor.intercept(config);
      },
    };
  }
}
