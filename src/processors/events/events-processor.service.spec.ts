import { EventsProcessorService } from './events-processor.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CommunityEvent,
  DiscordParticipant,
} from '@solidchain/badge-buddy-common';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Job } from 'bull';
import { describe, expect, jest, it, beforeEach } from '@jest/globals';

describe('EventsProcessorService', () => {
  let service: EventsProcessorService;
  const mockCommunityEvent: CommunityEvent = {
    eventName: 'test name',
    organizerId: '123',
    voiceChannelId: '123',
    guildId: '123',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 1000 * 60 * 60),
    isActive: true,
    participants: [],
  };

  const mockCommunityModel = {
    exists: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    findOne: () => {
      return {
        exec: () => {
          return Promise.resolve(mockCommunityEvent);
        },
      };
    },
  };

  const mockDiscordParticipantModel = {
    exists: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
  };

  const mockCacheManager = {
    del: jest.fn().mockReturnThis(),
  };

  const mockBullQueue = {
    add: jest.fn().mockReturnThis(),
  };

  const mockClient = {
    guilds: {
      fetch: jest.fn().mockReturnThis(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsProcessorService,
        {
          provide: getModelToken(CommunityEvent.name),
          useValue: mockCommunityModel,
        },
        {
          provide: getModelToken(DiscordParticipant.name),
          useValue: mockDiscordParticipantModel,
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'BullQueue_events', useValue: mockBullQueue },
        { provide: '__inject_discord_client__', useValue: mockClient },
        Logger,
      ],
    }).compile();

    service = module.get<EventsProcessorService>(EventsProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ProcessEvent.start', () => {
    const mockJob = {
      data: {
        eventId: '123',
      },
    } as Job<{ eventId: string }>;

    it('should be defined', () => {
      expect(service.start).toBeDefined();
    });

    it('should pull Community Event from db', async () => {
      const spy = jest.spyOn(mockCommunityModel, 'findOne');
      try {
        await service.start(mockJob);
      } catch (e) {}
      expect(spy).toHaveBeenCalled();

      // expect mockCommunityModel.findOne to return mockCommunityEvent
      await expect(
        (spy.mock.results[0].value as jest.MockedFunction<any>).exec(),
      ).resolves.toEqual(mockCommunityEvent);
    });
  });
});
