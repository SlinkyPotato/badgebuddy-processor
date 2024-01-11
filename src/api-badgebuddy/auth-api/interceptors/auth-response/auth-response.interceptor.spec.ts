import { AuthResponseInterceptor } from './auth-response.interceptor';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';

describe('AuthResponseInterceptor', () => {
  let authResponseInterceptor: AuthResponseInterceptor;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthResponseInterceptor],
    }).compile();

    authResponseInterceptor = module.get<AuthResponseInterceptor>(
      AuthResponseInterceptor,
    );
  });

  it('should be defined', () => {
    expect(authResponseInterceptor).toBeDefined();
  });
});
