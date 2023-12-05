import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { GuildDeleteEvent } from './guild-delete.event';
import { Test } from '@nestjs/testing';
import { DiscordGuildsService } from '../../discord-guilds/discord-guilds.service';
import { Logger } from '@nestjs/common';
import { Guild } from 'discord.js';

describe('GuildDeleteEvent', () => {
  let service: GuildDeleteEvent;

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
  };

  const mockGuildsService = {
    remove: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        GuildDeleteEvent,
        { provide: Logger, useValue: mockLogger },
        { provide: DiscordGuildsService, useValue: mockGuildsService },
      ],
    }).compile();

    service = testModule.get(GuildDeleteEvent);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delete guild successfully', () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'mockGuild',
    } as Guild;

    mockGuildsService.remove.mockReturnValue(Promise.resolve(mockGuild));

    service.onGuild(mockGuild);

    expect(mockLogger.log).toBeCalledWith(
      `guild left, guildId: ${mockGuild.id}, name: ${mockGuild.name}`,
    );
    expect(mockGuildsService.remove).toBeCalledWith(mockGuild.id);
  });

  it('should throw guild delete error', () => {
    const mockGuild = {
      id: '850840267082563596',
      name: 'mockGuild',
    } as Guild;

    const mockError = new Error('mockError');

    mockGuildsService.remove.mockReturnValue({
      catch: jest.fn().mockImplementation((cb: any) => cb(mockError)),
    });

    service.onGuild(mockGuild);

    expect(mockLogger.log).toBeCalledWith(
      `guild left, guildId: ${mockGuild.id}, name: ${mockGuild.name}`,
    );
    expect(mockGuildsService.remove).toBeCalledWith(mockGuild.id);
    expect(mockLogger.error).toBeCalledWith(mockError);
  });
});
