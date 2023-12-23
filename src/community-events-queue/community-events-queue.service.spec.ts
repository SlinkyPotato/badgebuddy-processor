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
} from '@jest/globals';
import { ChannelType, Collection } from 'discord.js';
import { CommunityEventsProcessorService } from './community-events-queue.service';
import { CommunityEventDiscordEntity, CommunityEventEntity, DISCORD_COMMUNITY_EVENTS_START_JOB, DiscordParticipantRedisDto } from '@badgebuddy/common';
import { ProcessorException } from './exceptions/processor.exception';
import { DataSource } from 'typeorm';

describe('CommunityEventsProcessorService', () => {
  let service: CommunityEventsProcessorService;
  let spyDiscordClient: jest.Spied<any>;
  let spyCacheManagerSet: jest.Spied<any>;
  let spyDataSource: jest.Spied<any>;

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
    del: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnValue(Promise.resolve(mockDiscordParticipantRedisDto)),
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
      fetch: jest.fn().mockReturnValue(Promise.resolve(mockVoiceChannel)),
    },
  };

  const mockDataSource = {
    createQueryBuilder: () => ({
      select: () => ({
        from: () => ({
          leftJoinAndSelect: () => ({
            where: () => ({
              getOne: jest.fn().mockReturnValue(Promise.resolve(mockDiscordCommunityEvent)),
            }),
          }),
        }),
      }),
    }),
  };

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

    service = module.get<CommunityEventsProcessorService>(CommunityEventsProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe(DISCORD_COMMUNITY_EVENTS_START_JOB, () => {
    beforeEach(() => {
      spyDiscordClient = jest.spyOn(mockClient.channels, 'fetch');
      spyCacheManagerSet = jest.spyOn(mockCacheManager, 'set');
      spyDataSource = jest.spyOn(mockDataSource, 'createQueryBuilder');
    });

    it('job start should be defined', () => {
      expect(service.startEvent).toBeDefined();
    });

    it('should throw finding Discord Community Event from DB', async () => {
      spyDataSource.mockReturnValue({ select: () => ({ from: () => ({ leftJoinAndSelect: () => ({ where: () => ({ getOne: jest.fn().mockReturnValue(Promise.reject(new Error('test'))) }) }) }) })});
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDataSource).toHaveBeenCalled();
      spyDataSource.mockRestore();
    });

    it('should not find Discord Community Event from DB', async () => {
      spyDataSource.mockReturnValue({ select: () => ({ from: () => ({ leftJoinAndSelect: () => ({ where: () => ({ getOne: jest.fn().mockReturnValue(null) }) }) }) })});
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDataSource).toHaveBeenCalled();
      expect(spyDataSource.mock.results[0].value.select().from().leftJoinAndSelect().where().getOne()).toEqual(null);
      spyDataSource.mockRestore();
    });

    it('should throw when finding voice channel', async () => {
      spyDiscordClient.mockReturnValue(Promise.reject(new Error('test')));
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      spyDiscordClient.mockRestore();
    });

    it('should not find voice channel', async () => {
      spyDiscordClient.mockReturnValue(Promise.resolve(null));
      try {
        await service.startEvent(mockJob);
      } catch (e) {
        expect(e).toBeInstanceOf(ProcessorException);
      }
      expect(spyDiscordClient).toHaveBeenCalled();
      spyDiscordClient.mockRestore();
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
      spyDiscordClient.mockRestore();
    });
  });
});

//     it('should fetch voice channel from discord', async () => {
//       const mockVoiceChannel = getMockVoiceChannel();
//       try {
//         await service.startEvent(mockJob);
//       } catch (e) {}
//       expect(spyDiscordClient).toHaveBeenCalled();

//       await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
//         mockVoiceChannel,
//       );
//     });

//     it('should track participant', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       const mockVoiceChannel = getMockVoiceChannel();

//       try {
//         await service.startEvent(mockJob);
//       } catch (e) {}
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);
//       await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
//         mockVoiceChannel,
//       );
//       expect(spyCacheManagerSet).toHaveBeenCalled();
//       expect(spyDiscordParticipantModel).toHaveBeenCalled();
//     });

//     it('should throw on setting cache', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       const mockVoiceChannel = getMockVoiceChannel();

//       spyCacheManagerSet.mockReturnValue(
//         Promise.reject(new Error('mock cacheManager set error')),
//       );

//       try {
//         await service.startEvent(mockJob);
//       } catch (e) {
//         expect(e).toBeInstanceOf(ProcessorException);
//       }
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);
//       await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
//         mockVoiceChannel,
//       );
//       expect(spyCacheManagerSet).toHaveBeenCalled();
//     });

//     it('should throw on inserting in db', async () => {
//       const mockCommunityEvent = getMockCommunityEvent();
//       const mockVoiceChannel = getMockVoiceChannel();

//       spyDiscordParticipantModel.mockReturnValue(
//         Promise.reject(
//           new Error('mock discordParticipantModel insertMany error'),
//         ),
//       );

//       try {
//         await service.startEvent(mockJob);
//       } catch (e) {
//         expect(e).toBeInstanceOf(ProcessorException);
//       }
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).resolves.toEqual(mockCommunityEvent);
//       await expect(spyDiscordClient.mock.results[0].value).resolves.toEqual(
//         mockVoiceChannel,
//       );
//       expect(spyCacheManagerSet).toHaveBeenCalled();
//       expect(spyDiscordParticipantModel).toHaveBeenCalled();
//     });

//     it('should throw getting community from db', async () => {
//       const mockError = new Error('mock communityEventModel findOne error');

//       spyCommunityEventModel.mockReturnValue(Promise.reject(mockError));

//       try {
//         await service.startEvent(mockJob);
//       } catch (e) {
//         expect(e).toBeInstanceOf(ProcessorException);
//       }
//       expect(spyCommunityEventModel).toHaveBeenCalled();
//       await expect(
//         spyCommunityEventModel.mock.results[0].value,
//       ).rejects.toEqual(mockError);
//       expect(spyCacheManagerSet).not.toHaveBeenCalled();
//       expect(spyDiscordParticipantModel).not.toHaveBeenCalled();
//     });
//   });

//   describe('EventsProcessorService.end', () => {
//     let spyCacheManagerGet: jest.Spied<any>;
//     let spyCacheManagerDel: jest.Spied<any>;
//     let spyCacheManagerKeys: jest.Spied<any>;

//     const mockJob = {
//       data: {
//         eventId: '123',
//       },
//     } as Job<{ eventId: string }>;

//     const mockCacheKeys = ['tracking:events:123:participants:123'];

//     beforeEach(() => {
//       spyCacheManagerKeys = jest.spyOn(mockCacheManager.store, 'keys');
//       spyCacheManagerKeys.mockReturnValue(Promise.resolve(mockCacheKeys));

//       spyCacheManagerGet = jest.spyOn(mockCacheManager, 'get');
//       spyCacheManagerGet.mockReturnValue(
//         Promise.resolve(getMockDiscordParticipantDto()),
//       );

//       spyCacheManagerDel = jest.spyOn(mockCacheManager, 'del');
//       spyCacheManagerDel.mockReturnValue(Promise.resolve());

//       // spyDiscordParticipantModel = jest.spyOn(
//       //   mockDiscordParticipantRepo,
//       //   'bulkWrite',
//       // );
//       spyDiscordParticipantModel.mockReturnValue(Promise.resolve([]));
//     });

//     it('job start should be defined', () => {
//       expect(service.endEvent).toBeDefined();
//     });

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
