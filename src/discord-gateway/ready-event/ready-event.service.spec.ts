import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { ReadyEventService } from './ready-event.service';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'discord.js';

describe('ReadyEventService', () => {
  let service: ReadyEventService;

  const mockLogger = {
    log: jest.fn(),
  };

  const mockClient = {
    guilds: {
      cache: {
        forEach: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [ReadyEventService, { provide: Logger, useValue: mockLogger }],
    }).compile();
    service = testModule.get(ReadyEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should print no guild', () => {
    mockClient.guilds.cache.forEach.mockReturnValue([]);
    service.onReady(mockClient as unknown as Client);
    expect(mockLogger.log).toBeCalledWith('Discord client is ready.');
  });
});
