import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { GuildCreateModule } from './guild-create/guild-create.module';
import { GuildDeleteModule } from './guild-delete/guild-delete.module';
import { ReadyModule } from './ready/ready.module';

jest.mock('./ready/ready.module', () => ({
  ReadyModule: jest.fn().mockReturnValue(Test.createTestingModule({})),
}));
jest.mock('./guild-create/guild-create.module', () => ({
  GuildCreateModule: jest.fn().mockReturnValue(Test.createTestingModule({})),
}));
jest.mock('./guild-delete/guild-delete.module', () => ({
  GuildDeleteModule: jest.fn().mockReturnValue(Test.createTestingModule({})),
}));

describe('DiscordEventsModule', () => {
  let module: TestingModule;

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ReadyModule, GuildCreateModule, GuildDeleteModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
