import { Test, TestingModule } from '@nestjs/testing';
import { DiscordBotApiService } from './discord-bot-api.service';
import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthApiService } from '@/api-badgebuddy/auth-api/auth-api.service';
import { HttpService } from '@nestjs/axios';

describe('DiscordBotApiService', () => {
  let service: DiscordBotApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordBotApiService,
        { provide: Logger, useValue: jest.fn() },
        { provide: ConfigService, useValue: jest.fn() },
        { provide: HttpService, useValue: jest.fn() },
        { provide: AuthApiService, useValue: jest.fn() },
      ],
    }).compile();

    service = module.get<DiscordBotApiService>(DiscordBotApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
