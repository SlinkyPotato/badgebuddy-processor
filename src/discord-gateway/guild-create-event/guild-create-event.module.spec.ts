import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { GuildCreateEventModule } from './guild-create-event.module';

jest.mock('./guild-create-event.service');
jest.mock('@discord-nestjs/core', () => {
  const actual = jest.requireActual('@discord-nestjs/core') as object;

  return {
    __esModule: true,
    ...actual,
    DiscordModule: {
      forFeature: jest.fn().mockReturnValue(
        Test.createTestingModule({
          providers: [],
        }),
      ),
    },
  };
});

describe('GuildCreateModule', () => {
  let module: TestingModule;
  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GuildCreateEventModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
