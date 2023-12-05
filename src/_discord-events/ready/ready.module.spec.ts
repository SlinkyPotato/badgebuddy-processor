import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ReadyModule } from './ready.module';

jest.mock('./ready.event');
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

describe('ReadyModule', () => {
  let module: TestingModule;
  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ReadyModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
