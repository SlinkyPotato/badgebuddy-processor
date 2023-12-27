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
  CommunityEventEntity,
  DISCORD_COMMUNITY_EVENTS_END_JOB,
  DISCORD_COMMUNITY_EVENTS_START_JOB,
  DiscordParticipantRedisDto,
} from '@badgebuddy/common';
import { ProcessorException } from './exceptions/processor.exception';
import { DataSource, InsertResult } from 'typeorm';

describe('CommunityEventsProcessorService', () => {
  let service: CommunityEventsProcessorService;
  let spyDiscordClient: jest.Spied<any>;
  let spyCacheManagerSet: jest.Spied<any>;
  let spyDataSource: jest.Spied<any>;
  let spyLoggerWarn: jest.Spied<any>;
  let spyLoggerError: jest.Spied<any>;
  let spyLoggerLog: jest.Spied<any>;
  let spyLoggerVerbose: jest.Spied<any>;

  const mockStartDate = new Date();
  const mockEndDate = new Date(mockStartDate.getTime() + 1000 * 60 * 60);

  const mockCommunityEvent = {
    id: '8846c42c-477b-48f1-a959-10cd25d110ad',
    title: 'test title',
    description: 'test description',
    startDate: mockStartDate,
    endDate: mockEndDate,
  } as CommunityEventEntity;

  const mockDiscordCommunityEvent = {
    communityEventId: '8846c42c-477b-48f1-a959-10cd25d110ad',
    organizerId: 'ea088187-6e92-4811-95d6-24b5268efee5',
    botSettingsId: 'a11fc19f-2937-4789-ac51-a93ac4df5487',
    voiceChannelSId: '850840267082563600',
    communityEvent: mockCommunityEvent,
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

  // const mockBullQueue = {
  //   add: jest.fn().mockReturnThis(),
  // };

  const mockClient = {
    channels: {
      fetch: jest.fn().mockReturnValue(Promise.resolve(mockVoiceChannel)),
    },
  };

  const getMockDataSource = (
    mockDiscordCommunityEvent: Promise<CommunityEventDiscordEntity>,
    mockInsertResult: Promise<InsertResult>,
  ) => ({
    createQueryBuilder: () => ({
      select: () => ({
        from: () => ({
          leftJoinAndSelect: () => ({
            where: () => ({
              getOne: jest.fn().mockReturnValue(mockDiscordCommunityEvent),
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

  const mockDataSource = getMockDataSource(
    Promise.resolve(mockDiscordCommunityEvent),
    Promise.resolve({
      identifiers: [{ id: '1' }],
      generatedMaps: [{ id: '1' }],
      raw: { affectedRows: 1 },
    } as InsertResult),
  );

  const mockJob = {
    data: {
      eventId: mockCommunityEvent.id,
    },
  } as Job<{ eventId: string }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityEventsProcessorService,
        { provide: Logger, useValue: mockLogger },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: '__inject_discord_client__', useValue: mockClient },
        { provide: DataSource, useValue: mockDataSource },
        // { provide: 'BullQueue_events', useValue: mockBullQueue },
      ],
    }).compile();

    service = module.get<CommunityEventsProcessorService>(
      CommunityEventsProcessorService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe(DISCORD_COMMUNITY_EVENTS_START_JOB, () => {
    beforeEach(() => {
      spyDiscordClient = jest.spyOn(mockClient.channels, 'fetch');
      spyCacheManagerSet = jest.spyOn(mockCacheManager, 'set');
      spyDataSource = jest.spyOn(mockDataSource, 'createQueryBuilder');

      spyLoggerWarn = jest.spyOn(mockLogger, 'warn');
      spyLoggerError = jest.spyOn(mockLogger, 'error');
      spyLoggerLog = jest.spyOn(mockLogger, 'log');
      spyLoggerVerbose = jest.spyOn(mockLogger, 'verbose');

      spyDiscordClient.mockReturnValue(Promise.resolve(mockVoiceChannel));
      spyCacheManagerSet.mockReturnValue(Promise.resolve());
      spyDataSource.mockReturnValue(
        getMockDataSource(
          Promise.resolve(mockDiscordCommunityEvent),
          Promise.resolve({
            identifiers: [{ id: '1' }],
            generatedMaps: [{ id: '1' }],
            raw: { affectedRows: 1 },
          } as InsertResult),
        ).createQueryBuilder(),
      );
    });

    
    it('should be defined for start event', () => {
      expect(service.startEvent.name).toBeDefined();
    });


    it('should throw finding Discord Community Event from DB', async () => {
      spyDataSource.mockReturnValue({
        select: () => ({
          from: () => ({
            leftJoinAndSelect: () => ({
              where: () => ({
                getOne: jest
                  .fn()
                  .mockReturnValue(Promise.reject(new Error('test'))),
              }),
            }),
          }),
        }),
      });
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDataSource).toHaveBeenCalled();
    });

    it('should not find Discord Community Event from DB', async () => {
      spyDataSource.mockReturnValue({
        select: () => ({
          from: () => ({
            leftJoinAndSelect: () => ({
              where: () => ({ getOne: jest.fn().mockReturnValue(null) }),
            }),
          }),
        }),
      });
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDataSource).toHaveBeenCalled();

      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      expect(
        spyDataSource.mock.results[0].value
          .select()
          .from()
          .leftJoinAndSelect()
          .where()
          .getOne(),
      ).toEqual(null);
      /* eslint-enable */
    });

    it('should throw when finding voice channel', async () => {
      spyDiscordClient.mockReturnValue(Promise.reject(new Error('test')));
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
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
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual('found 1 participants');
    });

    it('should throw on inserting in db', async () => {
      const mockError = new Error(
        'mock discordParticipantModel bulkWrite error',
      );
      spyDataSource.mockReturnValue(
        getMockDataSource(
          Promise.resolve(mockDiscordCommunityEvent),
          Promise.reject(mockError),
        ).createQueryBuilder(),
      );
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        console.log(e);
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual('found 1 participants');
      expect(spyLoggerVerbose.mock.calls[6][0]).toEqual(
        'attempting to insert 1 participants into db',
      );
      expect(spyDataSource).toHaveBeenCalled();
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      await expect(
        spyDataSource.mock.results[1].value.insert().into().values().execute(),
      ).rejects.toEqual(mockError);
      /* eslint-enable */
    });

    it('should throw on inserting in db for missed insert', async () => {
      spyDataSource.mockReturnValue(
        getMockDataSource(
          Promise.resolve(mockDiscordCommunityEvent),
          Promise.resolve({
            identifiers: [],
            generatedMaps: [],
            raw: { affectedRows: 0 },
          } as InsertResult),
        ).createQueryBuilder(),
      );
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        console.log(e);
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual('found 1 participants');
      expect(spyLoggerVerbose.mock.calls[6][0]).toEqual(
        'attempting to insert 1 participants into db',
      );
      expect(spyDataSource).toHaveBeenCalled();
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
      /* eslint-disable */
      const result: InsertResult = await spyDataSource.mock.results[1].value
        .insert()
        .into()
        .values()
        .execute();
      /* eslint-enable */
      expect(result.identifiers.length).toEqual(0);
    });

    it('should track participant', async () => {
      await service.startEvent(mockJob);
      expect(spyDiscordClient).toHaveBeenCalled();
      await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
        mockVoiceChannel,
      );
      expect(spyCacheManagerSet).toHaveBeenCalled();
      expect(spyLoggerVerbose).toBeCalled();
      expect(spyLoggerVerbose.mock.calls[5][0]).toEqual('found 1 participants');
      expect(spyLoggerVerbose.mock.calls[6][0]).toEqual(
        'attempting to insert 1 participants into db',
      );
      expect(spyDataSource).toHaveBeenCalled();
      /* eslint-disable */
      const result: InsertResult = await spyDataSource.mock.results[1].value
        .insert()
        .into()
        .values()
        .execute();
      /* eslint-enable */
      expect(result.identifiers.length).toEqual(1);
    });
  });

  describe(DISCORD_COMMUNITY_EVENTS_END_JOB, () => {
    beforeEach(() => {
      spyDiscordClient = jest.spyOn(mockClient.channels, 'fetch');
      spyCacheManagerSet = jest.spyOn(mockCacheManager, 'set');
      spyDataSource = jest.spyOn(mockDataSource, 'createQueryBuilder');

      spyLoggerWarn = jest.spyOn(mockLogger, 'warn');
      spyLoggerError = jest.spyOn(mockLogger, 'error');
      spyLoggerLog = jest.spyOn(mockLogger, 'log');
      spyLoggerVerbose = jest.spyOn(mockLogger, 'verbose');

      spyDiscordClient.mockReturnValue(Promise.resolve(mockVoiceChannel));
      spyCacheManagerSet.mockReturnValue(Promise.resolve());
      spyDataSource.mockReturnValue(
        getMockDataSource(
          Promise.resolve(mockDiscordCommunityEvent),
          Promise.resolve({
            identifiers: [{ id: '1' }],
            generatedMaps: [{ id: '1' }],
            raw: { affectedRows: 1 },
          } as InsertResult),
        ).createQueryBuilder(),
      );
    });

    it('should be defined for endEvent', () => {
      expect(service.endEvent.name).toBeDefined();
    });

  });
});



//     it('should pull Community Event from db', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);
//     });

//     it('should get keys from cache', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       const mockCacheKeys = ['tracking:events:123:participants:123'];
//       spyCacheManagerKeys.mockReturnValue(Promise.resolve(mockCacheKeys));

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         mockCacheKeys,
//       );
//     });

//     it('should get null keys from cache', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       spyCacheManagerKeys.mockReturnValue(Promise.resolve(null));

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         null,
//       );
//     });

//     it('should get empty keys from cache', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       spyCacheManagerKeys.mockReturnValue(Promise.resolve([]));

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         [],
//       );
//     });

//     it('should throw getting undefined participant from cache', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();

//       spyCacheManagerGet.mockReturnValue(Promise.resolve(undefined));

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {
//         expect(e).toBeInstanceOf(ProcessorException);
//       }
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         mockCacheKeys,
//       );
//       await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
//         undefined,
//       );
//     });

//     it('should throw getting null participant from cache', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();

//       spyCacheManagerGet.mockReturnValue(Promise.resolve(null));

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {
//         expect(e).toBeInstanceOf(ProcessorException);
//       }
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         mockCacheKeys,
//       );
//       await expect(spyCacheManagerGet.mock.results[0].value).resolves.toEqual(
//         null,
//       );
//     });

//     it('should prepare db schema object for participant', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         mockCacheKeys,
//       );
//       expect(spyCacheManagerDel).toHaveBeenCalled();
//       expect(spyDiscordParticipantModel).toHaveBeenCalled();
//     });

//     it('should throw and continue during bulkWrite execution', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();

//       spyDiscordParticipantModel.mockReturnValue(
//         Promise.reject(
//           new Error('mock discordParticipantModel bulkWrite error'),
//         ),
//       );

//       try {
//         await service.endEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);

//       expect(spyCacheManagerKeys).toHaveBeenCalled();
//       await expect(spyCacheManagerKeys.mock.results[0].value).resolves.toEqual(
//         mockCacheKeys,
//       );
//       expect(spyCacheManagerDel).toHaveBeenCalled();
//       expect(spyDiscordParticipantModel).toHaveBeenCalled();
//     });
//   });

//   describe('EventsProcessorService.onQueueFailed', () => {
//     it('should be defined', () => {
//       expect(service.onQueueFailed).toBeDefined();
//     });

//     it('should log error', () => {
//       const mockJob = {
//         id: '123',
//       } as Job;
//       const mockError = new Error('mock error');
//       spyLogger = jest.spyOn(mockLogger, 'error');
//       service.onQueueFailed(mockJob, mockError);
//       expect(spyLogger).toHaveBeenCalled();
//       expect((spyLogger.mock.calls[0][0] as any).message).toMatch(
//         /mock error, jobId: 123/,
//       );
//     });
//   });
// });
