import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ReadyEventModule } from './ready.module';

jest.mock('./ready-event.service');
jest.mock('@discord-nestjs/core', () => {
  const actual = jest.requireActual('@discord-nestjs/core');

  return {
    __esModule: true,
    ...actual as object,
    DiscordModule: {
      forFeature: jest.fn().mockReturnValue(
        Test.createTestingModule({
          providers: [],
        }),
      ),
    },
  };
});

describe('ReadyEventModule', () => {
  let module: TestingModule;
  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ReadyEventModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
