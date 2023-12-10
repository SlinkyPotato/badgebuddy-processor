import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { GuildCreateEventService } from './guild-create-event.service';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Guild } from 'discord.js';
import { HttpService } from '@nestjs/axios';

describe('GuildCreateEventService', () => {
  let service: GuildCreateEventService;

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
  };

  const mockHttpService = {
    post: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        GuildCreateEventService,
        { provide: Logger, useValue: mockLogger },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();
    service = testModule.get(GuildCreateEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw for guild unavailable', async () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'test guild',
      available: false,
    };
    await service.onGuildCreate(mockGuild as Guild);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      `guild outage for guildId: ${mockGuild.id}, guildName: ${mockGuild.name}`,
    );
  });

  it('should call setup for guild available', async () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'test guild',
      available: true,
    };

    await service.onGuildCreate(mockGuild as Guild);
    expect(mockLogger.log).toHaveBeenCalledWith(
      `guild joined, guildId: ${mockGuild.id}, name: ${mockGuild.name}`,
    );
  });
});
