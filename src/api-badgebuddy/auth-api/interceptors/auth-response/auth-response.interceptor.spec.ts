import { AuthResponseInterceptor } from './auth-response.interceptor';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

describe('AuthResponseInterceptor', () => {
  let authResponseInterceptor: AuthResponseInterceptor;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthResponseInterceptor,
        {
          provide: Logger,
          useValue: jest.fn(),
        },
      ],
    }).compile();

    authResponseInterceptor = module.get<AuthResponseInterceptor>(
      AuthResponseInterceptor,
    );
  });

  it('should be defined', () => {
    expect(authResponseInterceptor).toBeDefined();
  });
});
