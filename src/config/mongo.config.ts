import { registerAs } from '@nestjs/config';
import ConfigUtil, { JoiConfig } from './config.util';
import Joi from 'joi';

export type MongoEnv = {
  uri: string;
};

export default registerAs('mongo', (): MongoEnv => {
  const mongoEnvs: JoiConfig<MongoEnv> = {
    uri: {
      value: process.env.MONGODB_URI,
      joi: Joi.string().required(),
    },
  };

  return ConfigUtil.validate(mongoEnvs);
});
