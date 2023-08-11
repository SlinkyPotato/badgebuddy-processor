import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import { CacheManagerOptions } from '@nestjs/cache-manager';
import { ConfigService, registerAs } from '@nestjs/config';
import ConfigUtil, { JoiConfig } from './config.util';
import Joi from 'joi';
import NodeEnvs from './enums/node-envs.enum';

type RedisEnv = {
  host: string;
  port: number;
};

export default registerAs('redis', (): RedisEnv => {
  const redisEnvs: JoiConfig<RedisEnv> = {
    host: {
      value: process.env.REDIS_HOST,
      joi: Joi.string().default('localhost'),
    },
    port: {
      value: process.env.REDIS_PORT,
      joi: Joi.number().default(6379),
    },
  };

  return ConfigUtil.validate(redisEnvs);
});

export const configureCache = (configService: ConfigService<any, true>) => {
  const config: CacheManagerOptions & RedisClientOptions = {
    store: redisStore,
  };
  switch (configService.get('system.nodeEnv')) {
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
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
      };
      config.ttl = 1000 * 60; // 1 minute
  }
  return config;
};
