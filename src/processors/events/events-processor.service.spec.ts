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
import { Collection } from 'discord.js';

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

  const mockVoiceChannel = {
    name: 'test name',
    members: new Collection([
      ['1', { id: '1', voice: { deaf: false }, user: { tag: 'userTag' } }],
    ]),
  };

  const mockCommunityModel = {
    exists: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
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
    channels: {
      fetch: () => {
        return jest.fn().mockReturnValue(Promise.resolve(mockVoiceChannel));
      },
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
      const execMock = jest.fn();
      const spy = jest
        .spyOn(mockCommunityModel, 'findOne')
        .mockReturnValue({ exec: execMock });
      execMock.mockResolvedValue(mockCommunityEvent as never);
      try {
        await service.start(mockJob);
      } catch (e) {}
      expect(spy).toHaveBeenCalled();
      const result = spy.mock.results[0].value;
      await expect(
        (result as jest.MockedFunction<any>).exec(),
      ).resolves.toEqual(mockCommunityEvent);
    });

    it('should fetch voice channel from discord', async () => {
      const spy = jest.spyOn(mockClient.channels, 'fetch');
      try {
        await service.start(mockJob);
      } catch (e) {}
      expect(spy).toHaveBeenCalled();
    });

    it('should not find voice channel', async () => {
      mockClient.channels.fetch = () => {
        return jest.fn().mockReturnValue(null);
      };
      const spy = jest.spyOn(mockClient.channels, 'fetch');
      try {
        await service.start(mockJob);
      } catch (e) {
        console.log(e);
        // expect(e).toEqual(typeof ProcessorException);
      }
      expect(spy).toHaveBeenCalled();

      const result = await spy.mock.results[0].value;
      expect(result).toEqual(null);
    });
  });
});
