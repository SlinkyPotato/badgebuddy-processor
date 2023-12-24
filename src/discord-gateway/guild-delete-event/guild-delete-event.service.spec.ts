import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { GuildDeleteEventService } from './guild-delete-event.service';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('GuildDeleteEventService', () => {
  let service: GuildDeleteEventService;

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        GuildDeleteEventService,
        { provide: Logger, useValue: mockLogger },
        { provide: HttpService, useValue: jest.fn() },
        { provide: ConfigService, useValue: jest.fn() },
      ],
    }).compile();

    service = testModule.get(GuildDeleteEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
