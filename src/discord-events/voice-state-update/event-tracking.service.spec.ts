import { Test, TestingModule } from '@nestjs/testing';
import { EventTrackingService } from './event-tracking.service';
import {describe, expect, it, beforeEach, jest} from '@jest/globals';
import {Logger} from "@nestjs/common";
import {CACHE_MANAGER} from "@nestjs/cache-manager";

describe('VoiceStateUpdateService', () => {
  let service: EventTrackingService;

  const mockCacheManager = {
    del: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventTrackingService, Logger, { provide: CACHE_MANAGER, useValue: mockCacheManager },],
    }).compile();

    service = module.get<EventTrackingService>(EventTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
