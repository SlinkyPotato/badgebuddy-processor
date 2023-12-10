import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { GuildCreateEvent } from './guild-create.event';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GuildCreateService } from './guild-create.service';
import { Guild } from 'discord.js';

describe('GuildCreateEvent', () => {
  let service: GuildCreateEvent;

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
  };

  const mockGuildCreateService = {
    setupGuild: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        GuildCreateEvent,
        { provide: Logger, useValue: mockLogger },
        { provide: GuildCreateService, useValue: mockGuildCreateService },
      ],
    }).compile();
    service = testModule.get(GuildCreateEvent);
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
    expect(mockLogger.error).toHaveBeenCalledWith(
      `guild outage for guildId: ${mockGuild.id}, guildName: ${mockGuild.name}`,
    );
  });

  it('should call setup for guild available', async () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'test guild',
      available: true,
    };

    mockGuildCreateService.setupGuild.mockReturnValue(Promise.resolve(null));
    await service.onGuildCreate(mockGuild as Guild);
    expect(mockLogger.log).toHaveBeenCalledWith(
      `guild joined, guildId: ${mockGuild.id}, name: ${mockGuild.name}`,
    );
  });

  it('should throw for guild setup error', async () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'test guild',
      available: true,
    };
    mockGuildCreateService.setupGuild.mockReturnValue(
      Promise.reject(new Error('setup error')),
    );
    await service.onGuildCreate(mockGuild as Guild);
    expect(mockLogger.error).toHaveBeenCalledWith(new Error('setup error'));
  });
});
