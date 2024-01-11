import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ENV_AUTH_PROCESSOR_CLIENT_ID,
  ENV_AUTH_PROCESSOR_CLIENT_SECRET,
} from '@/app.constants';
import { JwtModule } from '@nestjs/jwt';
import { AuthApiService } from './auth-api.service';
import { AuthRequestInterceptor } from '@/api-badgebuddy/auth-api/interceptors/auth-request/auth-request.interceptor';
import { AuthResponseInterceptor } from '@/api-badgebuddy/auth-api/interceptors/auth-response/auth-response.interceptor';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(ENV_AUTH_PROCESSOR_CLIENT_SECRET),
        signOptions: {
          expiresIn: '4s',
          issuer: configService.get<string>(ENV_AUTH_PROCESSOR_CLIENT_ID),
          subject: configService.get<string>(ENV_AUTH_PROCESSOR_CLIENT_ID),
        },
      }),
    }),
  ],
  providers: [
    AuthApiService,
    Logger,
    AuthRequestInterceptor,
    AuthResponseInterceptor,
  ],
  exports: [AuthApiService],
})
export class AuthApiModule {}
