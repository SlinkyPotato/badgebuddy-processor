import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Job } from 'bull';
import {
  describe,
  expect,
  jest,
  it,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { Collection } from 'discord.js';
import { CommunityEventsProcessorService } from './community-events-queue.service';
import { CommunityEventDiscordEntity, CommunityParticipantDiscordEntity, DiscordParticipantRedisDto } from '@badgebuddy/common';
import { ProcessorException } from './exceptions/processor.exception';

describe('CommunityEventsProcessorService', () => {
  let service: CommunityEventsProcessorService;
  let spyCommunityEventModel: jest.Spied<any>;
  let spyDiscordParticipantModel: jest.Spied<any>;
  let spyDiscordClient: jest.Spied<any>;
  let spyCacheManagerSet: jest.Spied<any>;
  let spyLogger: jest.Spied<any>;

  const mockStartDate = new Date();
  const mockEndDate = new Date(mockStartDate.getTime() + 1000 * 60 * 60);

  const getMockCommunityEvent = () => ({
    communityEvent: {
      id: '3ba04333-622c-425d-89e0-0e6btest7d60',
      title: 'test name',
      startDate: mockStartDate,
      endDate: mockEndDate,
    },
    organizer: {
      userSId: '123',
      id: '52ad6553-0801-4b86-a9cc-1a17test6cdb',
      username: 'test-username',
    },
    voiceChannelSId: '123',
    botSettings: {
      id: '5db6156c-b889-49a4-be9c-6133testfb30',
      guildSId: '123',
      name: 'test name',
      privateChannelSId: '123',
      poapManagerRoleSId: '123',
      ownerSid: '123',
    }
  } as CommunityEventDiscordEntity);

  const getMockVoiceChannel = () => ({
    name: 'test name',
    members: new Collection([
      ['1', { id: '1', voice: { deaf: false }, user: { tag: 'userTag' } }],
    ]),
  });

  const getMockDiscordParticipantDto = (): DiscordParticipantRedisDto => ({
    communityEventId: '64f881577e3a7efbf87b2ec2',
    discordUserSId: '123',
    startDate: mockStartDate.toISOString(),
    endDate: mockEndDate.toISOString(),
    durationInSeconds: 0,
  });

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
  };

  const mockDiscordCommunityEventsRepo = {
    findOneOrFaile: jest.fn().mockReturnThis(),
  };

  const mockDiscordParticipantRepo = {
    save: jest.fn(),
  };

  const mockCacheManager = {
    del: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    store: {
      keys: jest.fn().mockReturnThis(),
    },
  };

  const mockBullQueue = {
    add: jest.fn().mockReturnThis(),
  };

  const mockClient = {
    channels: {
      fetch: jest.fn().mockReturnThis(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityEventsProcessorService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'BullQueue_events', useValue: mockBullQueue },
        { provide: '__inject_discord_client__', useValue: mockClient },
        { provide: Logger, useValue: mockLogger },
        { provide: 'CommunityEventDiscordEntityRepository', useValue: mockDiscordCommunityEventsRepo },
        { provide: 'CommunityParticipantDiscordEntityRepository', useValue: mockDiscordParticipantRepo },
      ],
    }).compile();

    service = module.get<CommunityEventsProcessorService>(CommunityEventsProcessorService);

    // spyCommunityEventModel.mockReturnValue(
    //   Promise.resolve(getMockCommunityEvent()),
    // );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('EventsProcessorService.start', () => {
    beforeEach(() => {
      // spyDiscordParticipantModel = jest.spyOn(
      //   mockDiscordParticipantRepo,
      //   'insertMany',
      // );
      spyDiscordParticipantModel.mockReturnValue(Promise.resolve([]));

      spyDiscordClient = jest.spyOn(mockClient.channels, 'fetch');
      spyDiscordClient.mockReturnValue(Promise.resolve(getMockVoiceChannel()));

      spyCacheManagerSet = jest.spyOn(mockCacheManager, 'set');
      spyCacheManagerSet.mockReturnValue(Promise.resolve());
    });

    const mockJob = {
      data: {
        eventId: '123',
      },
    } as Job<{ eventId: string }>;

    it('job start should be defined', () => {
      expect(service.startEvent).toBeDefined();
    });

    it('should pull community event from db', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      try {
        await service.startEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);
    });

    it('should throw not finding community event in db', async () => {
      spyCommunityEventModel.mockReturnValue(Promise.resolve(null));

      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(null);
    });

    it('should fetch voice channel from discord', async () => {
      const mockVoiceChannel = getMockVoiceChannel();
      try {
        await service.startEvent(mockJob);
      } catch (e) {}
      expect(spyDiscordClient).toHaveBeenCalled();

      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
    });

    it('should not find voice channel', async () => {
      spyDiscordClient.mockReturnValue(Promise.resolve(null));
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        null,
      );
    });

    it('should throw error finding voice channel', async () => {
      spyDiscordClient.mockReturnValue(
        Promise.reject(new Error('mock discordClient fetch error')),
      );
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).rejects.toThrowError(
        Error,
      );
    });

    it('should skip deaf participant and track 0 participants', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      const mockVoiceChannel = getMockVoiceChannel();
      (mockVoiceChannel.members.get('1') as any).voice.deaf = true;
      spyDiscordClient.mockReturnValue(Promise.resolve(mockVoiceChannel));

      try {
        await service.startEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyDiscordParticipantModel).not.toHaveBeenCalled();
      expect(spyCacheManagerSet).not.toHaveBeenCalled();
    });

    it('should track participant', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      const mockVoiceChannel = getMockVoiceChannel();

      try {
        await service.startEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyDiscordParticipantModel).toHaveBeenCalled();
    });

    it('should throw on setting cache', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      const mockVoiceChannel = getMockVoiceChannel();

      spyCacheManagerSet.mockReturnValue(
        Promise.reject(new Error('mock cacheManager set error')),
      );

      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
    });

    it('should throw on inserting in db', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      const mockVoiceChannel = getMockVoiceChannel();

      spyDiscordParticipantModel.mockReturnValue(
        Promise.reject(
          new Error('mock discordParticipantModel insertMany error'),
        ),
      );

      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyDiscordParticipantModel).toHaveBeenCalled();
    });

    it('should throw getting community from db', async () => {
      const mockError = new Error('mock communityEventModel findOne error');

      spyCommunityEventModel.mockReturnValue(Promise.reject(mockError));

      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).rejects.toEqual(mockError);
      expect(spyCacheManagerSet).not.toHaveBeenCalled();
      expect(spyDiscordParticipantModel).not.toHaveBeenCalled();
    });
  });

  describe('EventsProcessorService.end', () => {
    let spyCacheManagerGet: jest.Spied<any>;
    let spyCacheManagerDel: jest.Spied<any>;
    let spyCacheManagerKeys: jest.Spied<any>;

    const mockJob = {
      data: {
        eventId: '123',
      },
    } as Job<{ eventId: string }>;

    const mockCacheKeys = ['tracking:events:123:participants:123'];

    beforeEach(() => {
      spyCacheManagerKeys = jest.spyOn(mockCacheManager.store, 'keys');
      spyCacheManagerKeys.mockReturnValue(Promise.resolve(mockCacheKeys));

      spyCacheManagerGet = jest.spyOn(mockCacheManager, 'get');
      spyCacheManagerGet.mockReturnValue(
        Promise.resolve(getMockDiscordParticipantDto()),
      );

      spyCacheManagerDel = jest.spyOn(mockCacheManager, 'del');
      spyCacheManagerDel.mockReturnValue(Promise.resolve());

      // spyDiscordParticipantModel = jest.spyOn(
      //   mockDiscordParticipantRepo,
      //   'bulkWrite',
      // );
      spyDiscordParticipantModel.mockReturnValue(Promise.resolve([]));
    });

    it('job start should be defined', () => {
      expect(service.endEvent).toBeDefined();
    });

    it('should pull Community Event from db', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      try {
        await service.endEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);
    });

    it('should get keys from cache', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      const mockCacheKeys = ['tracking:events:123:participants:123'];
      spyCacheManagerKeys.mockReturnValue(Promise.resolve(mockCacheKeys));

      try {
        await service.endEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        mockCacheKeys,
      );
    });

    it('should get null keys from cache', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      spyCacheManagerKeys.mockReturnValue(Promise.resolve(null));

      try {
        await service.endEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        null,
      );
    });

    it('should get empty keys from cache', async () => {
      const mockCommunityEvent = getMockCommunityEvent();
      spyCacheManagerKeys.mockReturnValue(Promise.resolve([]));

      try {
        await service.endEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        [],
      );
    });

    it('should throw getting undefined participant from cache', async () => {
      const mockCommunityEvent = getMockCommunityEvent();

      spyCacheManagerGet.mockReturnValue(Promise.resolve(undefined));

      try {
        await service.endEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        mockCacheKeys,
      );
      await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
        undefined,
      );
    });

    it('should throw getting null participant from cache', async () => {
      const mockCommunityEvent = getMockCommunityEvent();

      spyCacheManagerGet.mockReturnValue(Promise.resolve(null));

      try {
        await service.endEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        mockCacheKeys,
      );
      await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
        null,
      );
    });

    it('should prepare db schema object for participant', async () => {
      const mockCommunityEvent = getMockCommunityEvent();

      try {
        await service.endEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        mockCacheKeys,
      );
      expect(spyCacheManagerDel).toHaveBeenCalled();
      expect(spyDiscordParticipantModel).toHaveBeenCalled();
    });

    it('should throw and continue during bulkWrite execution', async () => {
      const mockCommunityEvent = getMockCommunityEvent();

      spyDiscordParticipantModel.mockReturnValue(
        Promise.reject(
          new Error('mock discordParticipantModel bulkWrite error'),
        ),
      );

      try {
        await service.endEvent(mockJob);
      } catch (e) {}
      expect(spyCommunityEventModel).toHaveBeenCalled();
      await expect(
        spyCommunityEventModel.mock.results[0].value,
      ).resolves.toEqual(mockCommunityEvent);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        mockCacheKeys,
      );
      expect(spyCacheManagerDel).toHaveBeenCalled();
      expect(spyDiscordParticipantModel).toHaveBeenCalled();
    });
  });

  describe('EventsProcessorService.onQueueFailed', () => {
    it('should be defined', () => {
      expect(service.onQueueFailed).toBeDefined();
    });

    it('should log error', () => {
      const mockJob = {
        id: '123',
      } as Job;
      const mockError = new Error('mock error');
      spyLogger = jest.spyOn(mockLogger, 'error');
      service.onQueueFailed(mockJob, mockError);
      expect(spyLogger).toHaveBeenCalled();
      expect((spyLogger.mock.calls[0][0] as any).message).toMatch(
        /mock error, jobId: 123/,
      );
    });
  });
});
