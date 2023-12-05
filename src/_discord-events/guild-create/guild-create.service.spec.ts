import {
  beforeEach,
  describe,
  it,
  expect,
  jest,
  afterEach,
} from '@jest/globals';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DiscordGuildsService } from '../../discord-guilds/discord-guilds.service';
import { ConfigService } from '@nestjs/config';
import { GuildCreateService } from './guild-create.service';
import { ChannelType } from 'discord.js';
import PostGuildResponseDto from '../../discord-guilds/dto/post/guild.response.dto';

describe('GuildCreateService', () => {
  let service: GuildCreateService;

  const mockLogger = {
    log: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    verbose: jest.fn().mockReturnThis(),
  };

  const mockGuildsApiService = {
    create: jest.fn().mockReturnThis(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      providers: [
        GuildCreateService,
        { provide: Logger, useValue: mockLogger },
        { provide: DiscordGuildsService, useValue: mockGuildsApiService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = testModule.get(GuildCreateService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should setup a guild', async () => {
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockTextChannel = {
      id: '1100470846490951790',
      name: 'test-private-channel',
      type: ChannelType.GuildText,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockNewsChannel = {
      id: '1130525131937161286',
      name: 'test-news-channel',
      type: ChannelType.GuildNews,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: ['COMMUNITY'],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockTextChannel),
    );

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockNewsChannel),
    );

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    const result = await service.setupGuild(mockGuild as any);
    expect(result).toEqual(mockGuildResponse);
    expect(mockNewsChannel.send).toHaveBeenCalled();
    expect(mockGuildsApiService.create).toHaveBeenCalledTimes(1);
    expect(mockGuild.channels.create).toHaveBeenCalledTimes(2);
  });

  it('should throw for guild unavailable', async () => {
    const mockDiscordAssignRoleError = new Error('assign role error');
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      roles: {
        create: jest
          .fn()
          .mockReturnValue(Promise.reject(mockDiscordAssignRoleError)),
      },
    };

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (err) {
      expect(err).toEqual(mockDiscordAssignRoleError);
    }
  });

  it('should throw for creating poap manager role', async () => {
    const mockDiscordAssignRoleError = new Error('assign role error');
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      roles: {
        create: jest
          .fn()
          .mockReturnValue(Promise.reject(mockDiscordAssignRoleError)),
      },
    };

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (err) {
      expect(err).toEqual(mockDiscordAssignRoleError);
    }
  });

  it('should throw for assigning role to bot', async () => {
    const mockError = new Error('assign role error');
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'Test Guild Member',
      roles: {
        add: jest.fn().mockReturnValue(Promise.reject(mockError)),
      },
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
      },
    };

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    const mockDiscordAssignRoleError = new Error(
      `failed to assign role to bot, guildId: ${mockGuild.id}, guildName: ${mockGuild.name}`,
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (err) {
      expect(err).toEqual(mockDiscordAssignRoleError);
    }
  });

  it('should setup a guild without newschannel', async () => {
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockTextChannel = {
      id: '1100470846490951790',
      name: 'test-private-channel',
      type: ChannelType.GuildText,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: [],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockTextChannel),
    );

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    const result = await service.setupGuild(mockGuild as any);
    expect(result).toEqual(mockGuildResponse);
    expect(mockTextChannel.send).toHaveBeenCalled();
    expect(mockGuildsApiService.create).toHaveBeenCalledTimes(1);
    expect(mockGuild.channels.create).toHaveBeenCalledTimes(1);
  });

  it('should throw for creating private channel', async () => {
    const mockError = new Error('create private channel error');
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: ['COMMUNITY'],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(Promise.reject(mockError));

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (e) {
      const expectedError = new Error(
        `failed to create private channel, guildId: ${mockGuild.id}, guildName: ${mockGuild.name}`,
      );
      expect(e).toEqual(expectedError);
      expect(mockGuildsApiService.create).toHaveBeenCalledTimes(0);
      expect(mockGuild.channels.create).toHaveBeenCalledTimes(1);
    }
  });

  it('should throw for creating news channel', async () => {
    const mockError = new Error('create news channel error');
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockTextChannel = {
      id: '1100470846490951790',
      name: 'test-private-channel',
      type: ChannelType.GuildText,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: ['COMMUNITY'],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockTextChannel),
    );

    mockGuild.channels.create.mockReturnValueOnce(Promise.reject(mockError));

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (e) {
      const expectedError = new Error(
        `failed to create news channel, guildId: ${mockGuild.id}, guildName: ${mockGuild.name}`,
      );
      expect(e).toEqual(expectedError);
      // expect(mockGuildsApiService.create).toHaveBeenCalledTimes(0);
    }
  });

  it('should throw sending introduction to channel', async () => {
    const mockError = new Error('send news channel error');
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockPrivateChannel = {
      id: '1100470846490951790',
      name: 'test-private-channel',
      type: ChannelType.GuildText,
      send: jest.fn().mockReturnValue(Promise.reject(mockError)),
    };
    const mockNewsChannel = {
      id: '1130525131937161286',
      name: 'test-news-channel',
      type: ChannelType.GuildNews,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: ['COMMUNITY'],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockPrivateChannel),
    );

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockNewsChannel),
    );

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (e) {
      const expectedError = new Error(
        `failed to send introduction to private channel, channelId: ${mockPrivateChannel.id}, roleId: ${mockRole.id}`,
      );
      expect(e).toEqual(expectedError);
    }
  });

  it('should throw sending news to channel', async () => {
    const mockError = new Error('send news channel error');
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockPrivateChannel = {
      id: '1100470846490951790',
      name: 'test-private-channel',
      type: ChannelType.GuildText,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockNewsChannel = {
      id: '1130525131937161286',
      name: 'test-news-channel',
      type: ChannelType.GuildNews,
      send: jest.fn().mockReturnValue(Promise.reject(mockError)),
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: ['COMMUNITY'],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockPrivateChannel),
    );

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockNewsChannel),
    );

    const mockGuildResponse: PostGuildResponseDto = {
      _id: '850840267082563596',
    };

    mockGuildsApiService.create.mockReturnValue(
      Promise.resolve(mockGuildResponse),
    );
    try {
      await service.setupGuild(mockGuild as any);
    } catch (e) {
      const expectedError = new Error(
        `failed to send news to channel, channelId: ${mockNewsChannel.id}`,
      );
      expect(e).toEqual(expectedError);
    }
  });

  it('should throw creating guild in guildsApiService', async () => {
    const mockError = new Error('create guild error');
    const mockRole = {
      id: '1130525129131167786',
      name: 'POAP Managers',
      color: 'DarkGreen',
    };
    const mockGuildMember = {
      id: '159014522542096384',
      name: 'POAP Managers',
      roles: {
        add: jest.fn().mockReturnValue(Promise.resolve(null)),
      },
    };
    const mockTextChannel = {
      id: '1100470846490951790',
      name: 'test-private-channel',
      type: ChannelType.GuildText,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockNewsChannel = {
      id: '1130525131937161286',
      name: 'test-news-channel',
      type: ChannelType.GuildNews,
      send: jest.fn().mockReturnValue(Promise.resolve(null)),
    };
    const mockGuild = {
      id: '850840267082563596',
      name: 'test-guild',
      features: ['COMMUNITY'],
      members: {
        fetch: jest.fn().mockReturnValue(Promise.resolve(mockGuildMember)),
      },
      channels: {
        create: jest.fn().mockReturnThis(),
      },
      roles: {
        create: jest.fn().mockReturnValue(Promise.resolve(mockRole)),
        everyone: jest.fn().mockReturnThis(),
      },
    };

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockTextChannel),
    );

    mockGuild.channels.create.mockReturnValueOnce(
      Promise.resolve(mockNewsChannel),
    );

    mockGuildsApiService.create.mockReturnValue(Promise.reject(mockError));
    try {
      await service.setupGuild(mockGuild as any);
    } catch (e) {
      const expectedError = new Error('create guild error');
      expect(e).toEqual(expectedError);
    }
  });
});
