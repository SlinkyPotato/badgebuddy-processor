import { Test, TestingModule } from '@nestjs/testing';
import { AuthApiService } from './auth-api.service';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { AuthRequestInterceptor } from '@/api-badgebuddy/auth-api/interceptors/auth-request/auth-request.interceptor';

describe('AuthService', () => {
  let service: AuthApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthApiService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
          },
        },
        {
          provide: AuthRequestInterceptor,
          useValue: jest.fn().mockReturnThis(),
        },
      ],
    }).compile();

    service = module.get<AuthApiService>(AuthApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
