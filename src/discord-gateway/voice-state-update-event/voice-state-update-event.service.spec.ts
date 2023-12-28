import { Test, TestingModule } from '@nestjs/testing';
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
import { Guild, VoiceState } from 'discord.js';
import {
  CommunityParticipantDiscordEntity,
  DiscordActiveCommunityEventDto,
  DiscordParticipantRedisDto,
} from '@badgebuddy/common';
import { VoiceStateUpdateEventService } from './voice-state-update-event.service';
import { DataSource, InsertResult } from 'typeorm';
import { ProcessorException } from '@/exceptions/processor.exception';

describe('VoiceStateUpdateService', () => {
  let service: VoiceStateUpdateEventService;

  let spyCacheManagerSet: jest.Spied<any>;
  let spyCacheManagerGet: jest.Spied<any>;
  let spyDataSource: jest.Spied<any>;

  let spyLoggerLog: jest.Spied<any>;
  let spyLoggerVerbose: jest.Spied<any>;
  let spyLoggerWarn: jest.Spied<any>;
  let spyLoggerError: jest.Spied<any>;

  const mockLogger = {
    log: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const getMockOldVoiceState = (): VoiceState =>
    ({
      channelId: '123',
      deaf: false,
      serverMute: false,
      member: {
        id: '123',
        user: {
          tag: 'test',
          id: '123',
        },
        guild: {
          id: '123',
        } as Guild,
      },
    }) as VoiceState;

  const getMockNewVoiceState = (): VoiceState =>
    ({
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
    }) as VoiceState;

  const mockStartDate = new Date();
  const mockEndDate = new Date(mockStartDate.getTime() + 1000 * 60 * 60);

  const mockCommunityEvent: DiscordActiveCommunityEventDto = {
    communityEventId: 'test-event-id-1',
    voiceChannelSId: '850840267082563600',
    description: 'test',
    startDate: mockStartDate,
    endDate: mockEndDate,
    guildSId: 'test-guildSId-1',
    organizerSId: 'test-organizerSId-1',
    title: 'test title',
    availablePOAPs: 0,
  };

  const mockCommunityEvent2: DiscordActiveCommunityEventDto = {
    communityEventId: 'test-event-id-2',
    voiceChannelSId: '950840267482563600',
    description: 'Another event',
    startDate: mockStartDate,
    endDate: mockEndDate,
    guildSId: 'test-guildSId-2',
    organizerSId: 'test-organizerSId-2',
    title: 'test title 2',
    availablePOAPs: 0,
  };

  const mockUserParticipantCache: DiscordParticipantRedisDto = {
    communityEventId: mockCommunityEvent.communityEventId,
    discordUserSId: '123',
    startDate: new Date().toISOString(),
    durationInSeconds: 0,
  };

  const mockDiscordParticipantEntity: CommunityParticipantDiscordEntity = {
    communityEventId: mockCommunityEvent.communityEventId,
    discordUserSId: '123',
    startDate: new Date(),
    participationLength: 0,
  };

  const mockCacheManager = {
    del: jest.fn().mockReturnValue(Promise.resolve()),
    get: jest.fn().mockReturnValue(Promise.resolve(mockCommunityEvent)),
    set: jest.fn().mockReturnValue(Promise.resolve()),
  };

  const genMockDataSource = (
    mockSelectParticipant: Promise<CommunityParticipantDiscordEntity | null>,
    mockInsertResult: Promise<InsertResult>,
  ) => ({
    createQueryBuilder: () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            andWhere: () => ({
              getOne: jest.fn().mockReturnValue(mockSelectParticipant),
            }),
          }),
        }),
      }),
      insert: () => ({
        into: () => ({
          values: () => ({
            execute: jest.fn().mockReturnValue(mockInsertResult),
          }),
        }),
      }),
    }),
  });

  const mockDataSource = genMockDataSource(
    Promise.resolve(mockDiscordParticipantEntity),
    Promise.resolve({
      identifiers: [{ id: '1' }],
      generatedMaps: [{ id: '1' }],
      raw: { affectedRows: 1 },
    } as InsertResult),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceStateUpdateEventService,
        { provide: Logger, useValue: mockLogger },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<VoiceStateUpdateEventService>(
      VoiceStateUpdateEventService,
    );

    spyLoggerLog = jest.spyOn(mockLogger, 'log');
    spyLoggerVerbose = jest.spyOn(mockLogger, 'verbose');
    spyLoggerWarn = jest.spyOn(mockLogger, 'warn');
    spyLoggerError = jest.spyOn(mockLogger, 'error');

    spyCacheManagerSet = jest.spyOn(mockCacheManager, 'set');
    spyCacheManagerGet = jest.spyOn(mockCacheManager, 'get');
    spyCacheManagerGet.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelSId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:active:voiceChannelSId:950840267482563600') {
        return Promise.resolve(mockCommunityEvent2);
      }
      if (key === 'tracking:events:test-event-id-1:participants:123') {
        return Promise.resolve(mockUserParticipantCache);
      }
      if (key === 'tracking:events:test-event-id-2:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    spyDataSource = jest.spyOn(mockDataSource, 'createQueryBuilder');
    spyDataSource.mockReturnValue(
      genMockDataSource(
        Promise.resolve(mockDiscordParticipantEntity),
        Promise.resolve({
          identifiers: [{ id: '1' }],
          generatedMaps: [{ id: '1' }],
          raw: { affectedRows: 1 },
        } as InsertResult),
      ).createQueryBuilder(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should pull null for non-active event', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockNewVoiceState.channelId = '111';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toHaveBeenCalledTimes(2);
    expect(spyDataSource).not.toBeCalled();
    expect(spyLoggerLog).not.toBeCalled();
    expect(spyLoggerVerbose).not.toBeCalled();
    expect(spyLoggerWarn).not.toBeCalled();
    expect(spyLoggerError).not.toBeCalled();
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      null,
    );
  });

  it('should ignore server mute user', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockNewVoiceState.serverMute = true;

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).not.toHaveBeenCalled();
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should ignore new channel and deaf', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockNewVoiceState.channelId = '111';
    // @ts-expect-error mock testing
    mockNewVoiceState.deaf = true;
    // @ts-expect-error mock testing
    mockOldVoiceState.deaf = true;

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).not.toHaveBeenCalled();
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should ignore for same channel and deaf', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    // @ts-expect-error mock testing
    mockNewVoiceState.deaf = true;
    // @ts-expect-error mock testing
    mockOldVoiceState.deaf = true;

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).not.toHaveBeenCalled();
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should ignore for deaf on old and new', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    // @ts-expect-error mock testing
    mockNewVoiceState.deaf = true;
    // @ts-expect-error mock testing
    mockOldVoiceState.deaf = true;

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).not.toHaveBeenCalled();
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should ignore for deaf on old and new and old and new channel', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    // @ts-expect-error mock testing
    mockNewVoiceState.deaf = true;
    // @ts-expect-error mock testing
    mockOldVoiceState.deaf = true;
    mockNewVoiceState.channelId = '111';
    mockOldVoiceState.channelId = '111';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).not.toHaveBeenCalled();
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should ignore new user joining unrelated channel', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockNewVoiceState.channelId = '5739439857';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      null,
    );
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should ignore new user leaving unrelated channel', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '5739439857';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      null,
    );
    expect(spyDataSource).not.toHaveBeenCalled();
    expect(spyLoggerLog).not.toHaveBeenCalled();
    expect(spyLoggerVerbose).not.toHaveBeenCalled();
    expect(spyLoggerWarn).not.toHaveBeenCalled();
    expect(spyLoggerError).not.toHaveBeenCalled();
  });

  it('should track new user has joined voice channel', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockNewVoiceState.channelId = mockCommunityEvent.voiceChannelSId;
    mockOldVoiceState.channelId = null;
    // @ts-expect-error mock testing
    mockNewVoiceState.member!.id = 'new-id-123';
    // @ts-expect-error mock testing
    mockOldVoiceState.member!.id = 'new-id-123';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);
    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      null,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(1);
    expect(spyDataSource).toHaveBeenCalledTimes(1);
  });

  it('should track user has re-joined voice channel', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockNewVoiceState.channelId = '850840267082563600';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toBeCalledTimes(3);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      null,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[2].value).resolves.toEqual(
      mockUserParticipantCache,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(1);
    expect(spyDataSource).not.toHaveBeenCalled();
  });

  it('should track user deafening during event', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = '850840267082563600';
    // @ts-expect-error mock testing
    mockNewVoiceState.deaf = true;

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      mockUserParticipantCache,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(1);
  });

  it('should track user leaving', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = null;

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      mockUserParticipantCache,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(1);
  });

  it('should throw for user leaving and db error', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();

    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = null;

    spyCacheManagerGet.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelSId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:active:voiceChannelSId:950840267482563600') {
        return Promise.resolve(mockCommunityEvent2);
      }
      if (key === 'tracking:events:test-event-id-1:participants:123') {
        return Promise.resolve(null);
      }
      if (key === 'tracking:events:test-event-id-2:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    try {
      spyDataSource.mockReturnValue(
        genMockDataSource(
          Promise.reject(new Error('test')),
          Promise.resolve({
            identifiers: [{ id: '1' }],
            generatedMaps: [{ id: '1' }],
            raw: { affectedRows: 1 },
          } as InsertResult),
        ).createQueryBuilder(),
      );
      await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(spyCacheManagerGet).toBeCalledTimes(2);
      await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
        mockCommunityEvent,
      );
      return;
    }
    // should be unreachable
    expect(true).toBe(false);
  });

  it('should throw for user leaving and not found in cache or db', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = null;
    spyDataSource.mockReturnValue(
      genMockDataSource(
        Promise.resolve(null),
        Promise.resolve({
          identifiers: [{ id: '1' }],
          generatedMaps: [{ id: '1' }],
          raw: { affectedRows: 1 },
        } as InsertResult),
      ).createQueryBuilder(),
    );

    spyCacheManagerGet.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelSId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:active:voiceChannelSId:950840267482563600') {
        return Promise.resolve(mockCommunityEvent2);
      }
      if (key === 'tracking:events:test-event-id-1:participants:123') {
        return Promise.resolve(null);
      }
      if (key === 'tracking:events:test-event-id-2:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    try {
      await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);
    } catch (e) {
      expect(e).toBeInstanceOf(ProcessorException);
    }
    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      null,
    );
  });

  it('should track user leaving and not found in cache', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = null;

    spyCacheManagerGet.mockImplementation((key) => {
      if (key === 'tracking:events:active:voiceChannelSId:850840267082563600') {
        return Promise.resolve(mockCommunityEvent);
      }
      if (key === 'tracking:events:active:voiceChannelSId:950840267482563600') {
        return Promise.resolve(mockCommunityEvent2);
      }
      if (key === 'tracking:events:test-event-id-1:participants:123') {
        return Promise.resolve(null);
      }
      if (key === 'tracking:events:test-event-id-2:participants:123') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    try {
      await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);
    } catch (e) {
      expect(e).toBeInstanceOf(ProcessorException);
    }
    expect(spyCacheManagerGet).toBeCalledTimes(2);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      null,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(1);
  });

  it('should track user hopping voice channels', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = '123';
    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);
    expect(spyCacheManagerGet).toBeCalledTimes(3);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      null,
    );
    await expect(spyCacheManagerGet.mock.results[2].value).resolves.toEqual(
      mockUserParticipantCache,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(1);
  });

  it('should track user hopping active events', async () => {
    const mockOldVoiceState = getMockOldVoiceState();
    const mockNewVoiceState = getMockNewVoiceState();
    mockOldVoiceState.channelId = '850840267082563600';
    mockNewVoiceState.channelId = '950840267482563600';

    await service.onVoiceStateUpdate(mockOldVoiceState, mockNewVoiceState);

    expect(spyCacheManagerGet).toBeCalledTimes(4);
    await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
      mockCommunityEvent,
    );
    await expect(spyCacheManagerGet.mock.results[1].value).resolves.toEqual(
      mockCommunityEvent2,
    );
    await expect(spyCacheManagerGet.mock.results[2].value).resolves.toEqual(
      mockUserParticipantCache,
    );
    await expect(spyCacheManagerGet.mock.results[3].value).resolves.toEqual(
      null,
    );
    expect(spyCacheManagerSet).toHaveBeenCalledTimes(2);
  });
});
