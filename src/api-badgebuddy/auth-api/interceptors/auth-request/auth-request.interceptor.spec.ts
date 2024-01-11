import { AuthRequestInterceptor } from './auth-request.interceptor';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuthApiService } from '@/api-badgebuddy/auth-api/auth-api.service';
import { ConfigService } from '@nestjs/config';

describe('AuthRequestInterceptor', () => {
  let interceptor: AuthRequestInterceptor;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        AuthRequestInterceptor,
        { provide: Logger, useValue: jest.fn() },
        { provide: ConfigService, useValue: jest.fn() },
        { provide: AuthApiService, useValue: jest.fn() },
      ],
    }).compile();

    interceptor = testModule.get<AuthRequestInterceptor>(
      AuthRequestInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
