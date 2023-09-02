import { Test, TestingModule } from '@nestjs/testing';
import { EventTrackingService } from './event-tracking.service';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { VoiceState } from 'discord.js';

describe('VoiceStateUpdateService', () => {
  let service: EventTrackingService;

  const mockOldVoiceState = {
    channelId: '123',
    deaf: false,
  };

  const mockNewVoiceState = {
    channelId: '123',
    deaf: false,
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
    try {
      await service.handleParticipantTracking(
        mockOldVoiceState as VoiceState,
        mockNewVoiceState as VoiceState,
      );
    } catch (e) {}
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.results[0].value).toBe(null);
  });

  // TODO: Add more tests
});
