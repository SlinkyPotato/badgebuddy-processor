import { Test, TestingModule } from '@nestjs/testing';
import { DiscordBotApiService } from './discord-bot-api.service';
import { describe, it, beforeEach, expect } from '@jest/globals';

describe('DiscordBotApiService', () => {
  let service: DiscordBotApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscordBotApiService],
    }).compile();

    service = module.get<DiscordBotApiService>(DiscordBotApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
