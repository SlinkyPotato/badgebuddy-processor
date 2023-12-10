import { Test, TestingModule } from '@nestjs/testing';
import { EventTrackingService } from './event-tracking.service';
import {
  describe,
  expect,
  it,
  beforeEach,
  jest,
  afterEach,
} from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { VoiceState } from 'discord.js';
import {
  CommunityEventDto,
  DiscordParticipant,
  DiscordParticipantDto,
} from '@badgebuddy/common';
import * as mongoose from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { MongooseError } from 'mongoose';
import { ProcessorException } from '../../community-events-queue/exceptions/processor.exception';

describe('VoiceStateUpdateService', () => {
  let service: EventTrackingService;
  let mockNewVoiceState: VoiceState | any;
  let mockOldVoiceState: VoiceState | any;
  let mockCommunityEvent: CommunityEventDto;
  let mockAnotherCommunityEvent: CommunityEventDto;
  let mockUserCache: DiscordParticipantDto;
  let keys: string[];

  const getKeys = (): string[] => ['123'];

  const getMockOldVoiceState = (): VoiceState | any => ({
    channelId: '123',
    deaf: false,
    serverMute: false,
    member: {
      id: '123',
      user: {
        tag: 'test',
      },
      guild: {
        id: '123',
      },
    },
  });

  const getMockNewVoiceState = (): VoiceState | any => ({
    channelId: '123',
    deaf: false,
    serverMute: false,
    member: {
      id: '123',
      user: {
        tag: 'test',
      },
      guild: {
        id: '123',
      },
    },
  });

  const getMockCommunityEvent = (): CommunityEventDto => ({
    eventId: '64e90a7a0eed9208a77e9b15',
    eventName: 'Test event',
    organizerId: '159014522542096384',
    voiceChannelId: '850840267082563600',
    guildId: '850840267082563596',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().getTime() + 1000 * 60 * 60).toISOString(),
  });

  const getAnotherMockCommunityEvent = (): CommunityEventDto => ({
    eventId: '74e90a7a0eed9208a87e9b15',
    eventName: 'Another event',
    organizerId: '1592343244',
    voiceChannelId: '23423435235',
    guildId: '324244353645',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().getTime() + 1000 * 60 * 60).toISOString(),
  });

  const getMockUserCache = (): DiscordParticipantDto => ({
    eventId: '64e90a7a0eed9208a77e9b15',
    userId: '123',
    userTag: 'test',
    startDate: new Date().toISOString(),
    durationInMinutes: 0,
  });

  const getMockDbUser = (): DiscordParticipant => ({
    communityEvent: new mongoose.Types.ObjectId('64e90a7a0eed9208a77e9b15'),
    userId: '123',
    userTag: 'testTag',
    startDate: new Date(),
    durationInMinutes: 0,
  });

  const mockDiscordParticipantModel = {
    exists: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
  };

  const mockCacheManager = {
    del: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTrackingService,
        Logger,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        {
          provide: getModelToken(DiscordParticipant.name),
          useValue: mockDiscordParticipantModel,
        },
      ],
    }).compile();

    service = module.get<EventTrackingService>(EventTrackingService);
    mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState = getMockOldVoiceState();
    mockCommunityEvent = getMockCommunityEvent();
    mockAnotherCommunityEvent = getAnotherMockCommunityEvent();
    mockUserCache = getMockUserCache();
    keys = getKeys();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should pull null for non-active event', async () => {
    mockNewVoiceState.channelId = '111';
    const spy = jest.spyOn(mockCacheManager, 'get');
    spy.mockReturnValue(null);
    await service.handleParticipantTracking(
      mockOldVoiceState,
      mockNewVoiceState,
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.results[0].value).toBe(null);
  });

  it('should ignore server mute user', async () => {
    mockNewVoiceState.serverMute = true;
    const spy = jest.spyOn(mockCacheManager, 'get');

    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('should ignore new channel and deaf', async () => {
    mockNewVoiceState.channelId = '111';
    mockNewVoiceState.deaf = true;
    mockOldVoiceState.deaf = true;
    const spy = jest.spyOn(mockCacheManager, 'get');
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('should ignore for same channel and deaf', async () => {
    mockNewVoiceState.deaf = true;
    mockOldVoiceState.deaf = true;
    const spy = jest.spyOn(mockCacheManager, 'get');
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('should ignore for deaf on old and new', async () => {
    mockNewVoiceState.deaf = true;
    mockOldVoiceState.deaf = true;
    const spy = jest.spyOn(mockCacheManager, 'get');
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('should ignore for deaf on old and new and old and new channel', async () => {
    mockNewVoiceState.deaf = true;
    mockOldVoiceState.deaf = true;
    mockNewVoiceState.channelId = '111';
    mockOldVoiceState.channelId = '111';
    const spy = jest.spyOn(mockCacheManager, 'get');
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('should ignore new user joining unrelated channel', async () => {
    mockNewVoiceState.channelId = '5739439857';
    const spy = jest.spyOn(mockCacheManager, 'get');
    spy.mockReturnValue(Promise.resolve(mockCommunityEvent));
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
  });

  it('should ignore new user leaving unrelated channel', async () => {
    mockOldVoiceState.channelId = '5739439857';
    const spy = jest.spyOn(mockCacheManager, 'get');
    spy.mockReturnValue(Promise.resolve(mockCommunityEvent));
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
  });

  it('should track new user has joined voice channel', async () => {
    mockNewVoiceState.channelId = '850840267082563600';
    delete mockOldVoiceState.channelId;
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(null);
      }
      if (
        key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:keys'
      ) {
        return Promise.resolve(keys);
      }
      return Promise.resolve(null);
    });

    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(null);
    expect(setCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should track user has re-joined voice channel', async () => {
    mockNewVoiceState.channelId = '850840267082563600';
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(mockUserCache);
      }
      return Promise.resolve(null);
    });
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(3);
    await expect(spy.mock.results[0].value).resolves.toEqual(null);
    await expect(spy.mock.results[1].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[2].value).resolves.toEqual(mockUserCache);
    expect(setCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should track user deafening during event', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.deaf = true;
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(mockUserCache);
      }
      return Promise.resolve(null);
    });
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(mockUserCache);
    expect(setCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should track user leaving', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    delete mockNewVoiceState.channelId;
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(mockUserCache);
      }
      return Promise.resolve(null);
    });
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(mockUserCache);
    expect(setCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should track user leaving and not found in cache and throw mongoose error', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    delete mockNewVoiceState.channelId;
    const spy = jest.spyOn(mockCacheManager, 'get');
    const dbSpy = jest.spyOn(mockDiscordParticipantModel, 'findOne');
    dbSpy.mockReturnValue({
      exec: () => {
        return Promise.reject(new MongooseError('constraint error'));
      },
    });
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    await service
      .handleParticipantTracking(
        mockOldVoiceState as VoiceState,
        mockNewVoiceState as VoiceState,
      )
      .catch((e) => {
        expect(e).toBeInstanceOf(ProcessorException);
      });
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
  });

  it('should track user leaving and not found in cache or db', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    delete mockNewVoiceState.channelId;
    const spy = jest.spyOn(mockCacheManager, 'get');
    const dbSpy = jest.spyOn(mockDiscordParticipantModel, 'findOne');
    dbSpy.mockReturnValue({
      exec: () => {
        return Promise.resolve(null);
      },
    });
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    await service
      .handleParticipantTracking(
        mockOldVoiceState as VoiceState,
        mockNewVoiceState as VoiceState,
      )
      .catch((e) => {
        expect(e).toBeInstanceOf(ProcessorException);
      });
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(null);
  });

  it('should track user leaving and not found in cache', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    delete mockNewVoiceState.channelId;
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    const dbSpy = jest.spyOn(mockDiscordParticipantModel, 'findOne');
    dbSpy.mockReturnValue({
      exec: () => {
        return Promise.resolve(getMockDbUser());
      },
    });
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(2);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(null);
    expect(setCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should track user hopping voice channels', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = '123';
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(mockUserCache);
      }
      return Promise.resolve(null);
    });
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(3);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(null);
    await expect(spy.mock.results[2].value).resolves.toEqual(mockUserCache);
    expect(setCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('should track user hopping active events', async () => {
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = '23423435235';
    const spy = jest.spyOn(mockCacheManager, 'get');
    const setCacheSpy = jest.spyOn(mockCacheManager, 'set');
    spy.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:active:voiceChannelId:23423435235') {
        return Promise.resolve(mockAnotherCommunityEvent);
      }
      if (key === 'tracking:events:64e90a7a0eed9208a77e9b15:participants:123') {
        return Promise.resolve(mockUserCache);
      }
      if (key === 'tracking:events:74e90a7a0eed9208a87e9b15:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    await service.handleParticipantTracking(
      mockOldVoiceState as VoiceState,
      mockNewVoiceState as VoiceState,
    );
    expect(spy).toBeCalledTimes(4);
    await expect(spy.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spy.mock.results[1].value).resolves.toEqual(
      mockAnotherCommunityEvent,
    );
    await expect(spy.mock.results[2].value).resolves.toEqual(null);
    await expect(spy.mock.results[3].value).resolves.toEqual(mockUserCache);
    expect(setCacheSpy).toHaveBeenCalledTimes(2);
  });
});
