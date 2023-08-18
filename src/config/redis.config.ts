import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import { CacheManagerOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { NodeEnvs } from '@solidchain/badge-buddy-common';

export const configureCache = (configService: ConfigService) => {
  const config: CacheManagerOptions & RedisClientOptions = {
    store: redisStore,
  };
  switch (configService.get<string>('NODE_ENV')) {
    case NodeEnvs.PRODUCTION.toString():
      config.socket = {
        path: '/app/redis/redis.sock',
      };
      config.database = 0;
      config.ttl = 1000 * 60 * 60 * 24; // 1 day
      break;
    case NodeEnvs.STAGING.toString():
      config.socket = {
        path: '/app/redis/redis.sock',
      };
      config.database = 1;
      config.ttl = 1000 * 60 * 60; // 1 hour
      break;
    default:
      config.socket = {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      };
      config.ttl = 1000 * 60; // 1 minute
  }
  return config;
};
