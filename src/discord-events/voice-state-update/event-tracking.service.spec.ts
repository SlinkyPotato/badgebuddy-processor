import { Test, TestingModule } from '@nestjs/testing';
import { EventTrackingService } from './event-tracking.service';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { VoiceState } from 'discord.js';
import { CommunityEventDto } from '@solidchain/badge-buddy-common';
import * as mongoose from 'mongoose';

describe('VoiceStateUpdateService', () => {
  let service: EventTrackingService;

  const mockOldVoiceState = {
    channelId: '123',
    deaf: false,
    member: {
      id: '123',
      user: {
        tag: 'test',
      },
      guild: {
        id: '123',
      },
    },
  };

  const mockNewVoiceState = {
    channelId: '123',
    deaf: false,
    member: {
      id: '123',
      user: {
        tag: 'test',
      },
      guild: {
        id: '123',
      },
    },
  };

  const mockCommunityEvent: CommunityEventDto = {
    eventId: new mongoose.Types.ObjectId('64e90a7a0eed9208a77e9b15'),
    eventName: 'Test event',
    organizerId: '159014522542096384',
    voiceChannelId: '850840267082563600',
    guildId: '850840267082563596',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 1000 * 60 * 60),
  };

  const mockCacheManager = {
    del: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTrackingService,
        Logger,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<EventTrackingService>(EventTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ignore non-active event', async () => {
    const spy = jest.spyOn(mockCacheManager, 'get');
    spy.mockReturnValue(null);
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.results[0].value).toBe(null);
  });

  // TODO: Add more tests
  it('should ignore new user that is deafend', async () => {
    mockNewVoiceState.channelId = '111';
    mockNewVoiceState.deaf = true;
    const spy = jest.spyOn(mockCacheManager, 'get');
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.results[0].value).toBe(mockCommunityEvent);
  });
});
