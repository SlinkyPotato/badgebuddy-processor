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
import { ChannelType, Collection } from 'discord.js';
import { CommunityEventsProcessorService } from './community-events-queue.service';
import {
  CommunityEventDiscordEntity,
  DISCORD_COMMUNITY_EVENTS_END_JOB,
  DISCORD_COMMUNITY_EVENTS_START_JOB,
  DiscordParticipantRedisDto,
} from '@badgebuddy/common';
import { DataSource, InsertResult, UpdateResult } from 'typeorm';
import { ProcessorException } from '@/exceptions/processor.exception';
import { CronJobsService } from '@/cron-jobs/cron-jobs.service';

describe('CommunityEventsProcessorService', () => {
  let service: CommunityEventsProcessorService;

  let spyDiscordClient: jest.Spied<any>;
  let spyCacheManagerSet: jest.Spied<any>;
  let spyDataSourceGetRepository: jest.Spied<any>;
  let spyDataSourceCreateQueryBuilder: jest.Spied<any>;
  let spyDataSourceTransaction: jest.Spied<any>;

  let spyLoggerLog: jest.Spied<any>;
  let spyLoggerVerbose: jest.Spied<any>;
  let spyLoggerWarn: jest.Spied<any>;
  let spyLoggerError: jest.Spied<any>;

  const mockStartDate = new Date();
  const mockEndDate = new Date(mockStartDate.getTime() + 1000 * 60 * 60);

  const mockDiscordCommunityEvent = {
    communityEventId: '8846c42c-477b-48f1-a959-10cd25d110ad',
    organizerId: 'ea088187-6e92-4811-95d6-24b5268efee5',
    botSettingsId: 'a11fc19f-2937-4789-ac51-a93ac4df5487',
    voiceChannelSId: '850840267082563600',
    communityEvent: {
      id: '8846c42c-477b-48f1-a959-10cd25d110ad',
      title: 'test title',
      description: 'test description',
      startDate: mockStartDate,
      endDate: mockEndDate,
    },
  } as CommunityEventDiscordEntity;

  const mockVoiceChannel = {
    name: 'test name',
    members: new Collection([
      ['1', { id: '1', voice: { deaf: false }, user: { tag: 'userTag' } }],
    ]),
    type: ChannelType.GuildVoice,
  };

  const mockDiscordParticipantRedisDto: DiscordParticipantRedisDto = {
    communityEventId: '64f881577e3a7efbf87b2ec2',
    discordUserSId: '123',
    startDate: mockStartDate.toISOString(),
    endDate: mockEndDate.toISOString(),
    durationInSeconds: 0,
  };

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    verbose: jest.fn().mockReturnThis(),
  };

  const mockCacheManager = {
    del: jest.fn(),
    get: jest
      .fn()
      .mockReturnValue(Promise.resolve(mockDiscordParticipantRedisDto)),
    set: jest.fn(),
    store: {
      keys: jest.fn().mockReturnThis(),
    },
  };

  const mockClient = {
    channels: {
      fetch: jest.fn().mockReturnValue(Promise.resolve(mockVoiceChannel)),
    },
  };

  const mockDataSource = {
    getRepository: jest.fn(),
    createQueryBuilder: jest.fn(),
    transaction: jest.fn(),
  };

  const mockJob = {
    data: {
      eventId: mockDiscordCommunityEvent.communityEventId,
    },
  } as Job<{ eventId: string }>;

  const mockCronJobsService = {
    addCronTimeoutToDisbandEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityEventsProcessorService,
        { provide: Logger, useValue: mockLogger },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: '__inject_discord_client__', useValue: mockClient },
        { provide: DataSource, useValue: mockDataSource },
        { provide: CronJobsService, useValue: mockCronJobsService },
      ],
    }).compile();

    service = module.get<CommunityEventsProcessorService>(
      CommunityEventsProcessorService,
    );

    spyDiscordClient = jest.spyOn(mockClient.channels, 'fetch');
    spyDiscordClient.mockReturnValue(Promise.resolve(mockVoiceChannel));

    spyLoggerVerbose = jest.spyOn(mockLogger, 'verbose');
    spyLoggerLog = jest.spyOn(mockLogger, 'log');
    spyLoggerWarn = jest.spyOn(mockLogger, 'warn');
    spyLoggerError = jest.spyOn(mockLogger, 'error');

    spyDataSourceGetRepository = jest.spyOn(mockDataSource, 'getRepository');
    spyDataSourceGetRepository.mockReturnValue({
      update: jest.fn().mockReturnValue(
        Promise.resolve({
          affected: 1,
        } as UpdateResult),
      ),
      findOneBy: jest
        .fn()
        .mockReturnValue(Promise.resolve(mockDiscordCommunityEvent)),
    });

    spyDataSourceCreateQueryBuilder = jest.spyOn(
      mockDataSource,
      'createQueryBuilder',
    );
    spyDataSourceCreateQueryBuilder.mockReturnValue({
      insert: () => ({
        into: () => ({
          values: () => ({
            execute: jest.fn().mockReturnValue(
              Promise.resolve({
                identifiers: [{ id: '1' }],
                generatedMaps: [{ id: '1' }],
                raw: { affectedRows: 1 },
              } as InsertResult),
            ),
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            execute: jest.fn().mockReturnValue(
              Promise.resolve({
                affected: 1,
              } as UpdateResult),
            ),
          }),
        }),
      }),
    });

    spyDataSourceTransaction = jest.spyOn(mockDataSource, 'transaction');
    spyDataSourceTransaction.mockReturnValue(Promise.resolve());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe(DISCORD_COMMUNITY_EVENTS_START_JOB, () => {
    beforeEach(() => {
      spyCacheManagerSet = jest.spyOn(mockCacheManager, 'set');
      spyCacheManagerSet.mockReturnValue(Promise.resolve());
    });

    it('should be defined for start event', () => {
      expect(service.startEvent.name).toBeDefined();
    });

    it('should throw finding Discord Community Event from DB', async () => {
      spyDataSourceGetRepository.mockReturnValue({
        findOneBy: jest.fn().mockReturnValue(Promise.reject(new Error('test'))),
      });
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDataSourceGetRepository).toHaveBeenCalled();
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should not find Discord Community Event from DB', async () => {
      spyDataSourceGetRepository.mockReturnValue({
        findOneBy: jest.fn().mockReturnValue(Promise.resolve(null)),
      });
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDataSourceGetRepository).toHaveBeenCalled();

      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      await expect(
        spyDataSourceGetRepository.mock.results[0].value.findOneBy(),
      ).resolves.toEqual(null);
      /* eslint-enable */
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should throw when finding voice channel', async () => {
      spyDiscordClient.mockReturnValue(Promise.reject(new Error('test')));
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
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
      expect(spyCacheManagerSet).not.toHaveBeenCalled();
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should skip deaf participant and track 0 participants', async () => {
      const mockVoiceChannel = Promise.resolve({
        name: 'test name',
        members: new Collection([
          ['1', { id: '1', voice: { deaf: true }, user: { tag: 'userTag' } }],
        ]),
        type: ChannelType.GuildVoice,
      });
      spyDiscordClient.mockReturnValue(mockVoiceChannel);
      await service.startEvent(mockJob);
      expect(spyDiscordClient).toHaveBeenCalled();
      expect(spyCacheManagerSet).not.toHaveBeenCalled();
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
      expect(spyLoggerWarn).toHaveBeenCalledTimes(2);
    });

    it('should proceed on error inserting participant in cache', async () => {
      const mockError = new Error('mock cacheManager set error');
      spyCacheManagerSet.mockReturnValue(Promise.reject(mockError));

      await service.startEvent(mockJob);

      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual(
        'stored 1 participants in cache',
      );
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
      expect(
        mockCronJobsService.addCronTimeoutToDisbandEvent,
      ).toHaveBeenCalled();
    });

    it('should throw on inserting in db', async () => {
      const mockError = new Error(
        'mock discordParticipantModel bulkWrite error',
      );
      spyDataSourceCreateQueryBuilder.mockReturnValue({
        insert: () => ({
          into: () => ({
            values: () => ({
              execute: jest.fn().mockReturnValue(Promise.reject(mockError)),
            }),
          }),
        }),
      });
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual(
        'stored 1 participants in cache',
      );
      expect(spyLoggerVerbose.mock.calls[6][0]).toEqual(
        'attempting to insert 1 participants into db',
      );
      expect(spyDataSourceCreateQueryBuilder).toHaveBeenCalled();
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      await expect(
        spyDataSourceCreateQueryBuilder.mock.results[0].value
          .insert()
          .into()
          .values()
          .execute(),
      ).rejects.toEqual(mockError);
      /* eslint-enable */
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should throw on inserting in db for missed insert', async () => {
      spyDataSourceCreateQueryBuilder.mockReturnValue({
        insert: () => ({
          into: () => ({
            values: () => ({
              execute: jest.fn().mockReturnValue(
                Promise.resolve({
                  identifiers: [],
                  generatedMaps: [],
                  raw: { affectedRows: 0 },
                } as InsertResult),
              ),
            }),
          }),
        }),
      });
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual(
        'stored 1 participants in cache',
      );
      expect(spyLoggerVerbose.mock.calls[6][0]).toEqual(
        'attempting to insert 1 participants into db',
      );
      expect(spyDataSourceCreateQueryBuilder).toHaveBeenCalled();
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      /* eslint-disable */
      const result: InsertResult =
        await spyDataSourceCreateQueryBuilder.mock.results[0].value
          .insert()
          .into()
          .values()
          .execute();
      /* eslint-enable */
      expect(result.identifiers.length).toEqual(0);
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should track participant', async () => {
      await service.startEvent(mockJob);
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual(
        'stored 1 participants in cache',
      );
      expect(spyLoggerVerbose.mock.calls[6][0]).toEqual(
        'attempting to insert 1 participants into db',
      );
      expect(spyDataSourceCreateQueryBuilder).toHaveBeenCalled();
      expect(spyDataSourceGetRepository).toHaveBeenCalled();
      /* eslint-disable */
      const result: InsertResult =
        await spyDataSourceCreateQueryBuilder.mock.results[0].value
          .insert()
          .into()
          .values()
          .execute();
      /* eslint-enable */
      expect(result.identifiers.length).toEqual(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
    });
  });

  describe(DISCORD_COMMUNITY_EVENTS_END_JOB, () => {
    let spyCacheManagerKeys: jest.Spied<any>;
    let spyCacheManagerGet: jest.Spied<any>;

    beforeEach(() => {
      spyCacheManagerKeys = jest.spyOn(mockCacheManager.store, 'keys');
      spyCacheManagerKeys.mockReturnValue(Promise.resolve(['1']));

      spyCacheManagerGet = jest.spyOn(mockCacheManager, 'get');
      spyCacheManagerGet.mockReturnValue(
        Promise.resolve(mockDiscordParticipantRedisDto),
      );
    });

    it('should be defined for endEvent', () => {
      expect(service.disbandEvent.name).toBeDefined();
    });

    it('should throw finding Discord Community Event from DB', async () => {
      spyDataSourceGetRepository.mockReturnValue({
        findOneBy: jest.fn().mockReturnValue(Promise.reject(new Error('test'))),
      });
      try {
        await service.disbandEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDataSourceGetRepository).toHaveBeenCalled();
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should not find Discord Community Event from DB', async () => {
      spyDataSourceGetRepository.mockReturnValue({
        findOneBy: jest.fn().mockReturnValue(Promise.resolve(null)),
      });
      try {
        await service.disbandEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDataSourceGetRepository).toHaveBeenCalled();

      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      await expect(
        spyDataSourceGetRepository.mock.results[0].value.findOneBy(),
      ).resolves.toEqual(null);
      /* eslint-enable */
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should throw for keys from cache', async () => {
      spyCacheManagerKeys.mockReturnValue(Promise.reject(new Error('test')));

      try {
        await service.disbandEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyCacheManagerKeys).toHaveBeenCalled();
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(1);
    });

    it('should get null for keys from cache', async () => {
      spyCacheManagerKeys.mockReturnValue(Promise.resolve(null));

      try {
        await service.disbandEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        null,
      );
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
      expect(spyLoggerWarn).toHaveBeenCalledTimes(1);
    });

    it('should get [] for keys from cache', async () => {
      spyCacheManagerKeys.mockReturnValue(Promise.resolve([]));

      try {
        await service.disbandEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
        [],
      );
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
      expect(spyLoggerWarn).toHaveBeenCalledTimes(1);
    });

    it('should throw for fetching participant from cache', async () => {
      const mockError = new Error('mock cacheManager get error');
      spyCacheManagerGet.mockReturnValue(Promise.reject(mockError));
      await service.disbandEvent(mockJob);
      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerGet.mock.results[0].value).rejects.toEqual(
        mockError,
      );
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
      expect(spyLoggerWarn).toHaveBeenCalledTimes(2);
      expect(spyLoggerError).toHaveBeenCalledTimes(1);
    });

    it('should throw getting undefined participant from cache', async () => {
      spyCacheManagerGet.mockReturnValue(Promise.resolve(undefined));
      await service.disbandEvent(mockJob);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
        undefined,
      );
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
      expect(spyLoggerWarn).toHaveBeenCalledTimes(2);
      expect(spyLoggerError).toHaveBeenCalledTimes(1);
    });

    it('should throw end tracking in db', async () => {
      const mockError = new Error('mock discordParticipantModel bulkWrite');
      spyDataSourceCreateQueryBuilder.mockReturnValue({
        update: () => ({
          set: () => ({
            where: () => ({
              execute: jest.fn().mockReturnValue(Promise.reject(mockError)),
            }),
          }),
        }),
      });

      await service.disbandEvent(mockJob);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      // await expect(
      //   spyDataSourceGetRepository.mock.results[0].value
      //     .insert()
      //     .into()
      //     .values()
      //     .execute(),
      // ).rejects.toEqual(mockError);
      /* eslint-enable */
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
    });

    it('should throw end tracking in db for no updates', async () => {
      const mockInsertResult = {
        identifiers: [],
        generatedMaps: [],
        raw: { affectedRows: 0 },
      } as InsertResult;
      spyDataSourceCreateQueryBuilder.mockReturnValue({
        update: () => ({
          set: () => ({
            where: () => ({
              execute: jest
                .fn()
                .mockReturnValue(Promise.resolve(mockInsertResult)),
            }),
          }),
        }),
      });

      await service.disbandEvent(mockJob);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      // expect(spyDataSourceCreateQueryBuilder).toBeCalledTimes(1);
      // /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      // await expect(
      //   spyDataSourceCreateQueryBuilder.mock.results[0].value
      //     .insert()
      //     .into()
      //     .values()
      //     .execute(),
      // ).resolves.toEqual(mockInsertResult);
      // /* eslint-enable */
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
    });

    it('should end tracking for participant in cache', async () => {
      await service.disbandEvent(mockJob);

      expect(spyCacheManagerKeys).toHaveBeenCalled();
      await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
        mockDiscordParticipantRedisDto,
      );
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyDataSourceGetRepository).toBeCalledTimes(1);
      expect(spyDataSourceTransaction).toBeCalledTimes(1);
      expect(spyLoggerLog).toHaveBeenCalledTimes(2);
    });
  });

  describe('OnQueueFailed', () => {
    it('should be defined', () => {
      expect(service.onQueueFailed.name).toBeDefined();
    });

    it('should log error', () => {
      const mockJob = {
        id: '123',
      } as Job;
      const mockError = new Error('mock error');

      service.onQueueFailed(mockJob, mockError);

      expect(spyLoggerWarn).toHaveBeenCalled();
      expect(spyLoggerError).toHaveBeenCalled();
    });
  });
});
