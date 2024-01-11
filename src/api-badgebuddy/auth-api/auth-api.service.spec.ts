import { Test, TestingModule } from '@nestjs/testing';
import { AuthApiService } from './auth-api.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('AuthService', () => {
  let service: AuthApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthApiService],
    }).compile();

    service = module.get<AuthApiService>(AuthApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
