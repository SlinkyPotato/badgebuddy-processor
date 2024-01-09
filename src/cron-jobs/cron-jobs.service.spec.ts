import { Test, TestingModule } from '@nestjs/testing';
import { CronJobsService } from './cron-jobs.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('CronJobsService', () => {
  let service: CronJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobsService,
        { provide: DataSource, useValue: jest.fn() },
        { provide: Logger, useValue: jest.fn() },
        { provide: SchedulerRegistry, useValue: jest.fn() },
        {
          provide: 'BullQueue_DISCORD_COMMUNITY_EVENTS_QUEUE',
          useValue: jest.fn(),
        },
      ],
    }).compile();

    service = module.get<CronJobsService>(CronJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
