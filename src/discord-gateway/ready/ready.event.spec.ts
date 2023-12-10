import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { ReadyEvent } from './ready.event';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client, Guild } from 'discord.js';

describe('ReadyEvent', () => {
  let service: ReadyEvent;

  const mockLogger = {
    log: jest.fn(),
  };

  const mockClient = {
    guilds: {
      cache: {
        values: jest.fn().mockReturnValue([]),
      },
    },
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [ReadyEvent, { provide: Logger, useValue: mockLogger }],
    }).compile();
    service = testModule.get(ReadyEvent);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should print guild', () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'mockGuild',
    } as Guild;

    mockClient.guilds.cache.values.mockReturnValue([mockGuild]);
    service.onReady(mockClient as unknown as Client);
    expect(mockLogger.log).toBeCalledWith('discord client is ready');
    expect(mockLogger.log).toBeCalledWith(
      'guildId: 850840267082563596, name: mockGuild',
    );
  });

  it('should print no guild', () => {
    mockClient.guilds.cache.values.mockReturnValue([]);
    service.onReady(mockClient as unknown as Client);
    expect(mockLogger.log).toBeCalledWith('discord client is ready');
  });
});
