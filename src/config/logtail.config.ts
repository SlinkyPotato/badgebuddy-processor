import { registerAs } from '@nestjs/config';
import ConfigUtil, { JoiConfig } from './config.util';
import Joi from 'joi';

export type LogTailEnv = {
  token: string;
};

export default registerAs('logtail', () => {
  const logtailEnvs: JoiConfig<LogTailEnv> = {
    token: {
      value: process.env.LOGTAIL_TOKEN,
      joi: Joi.string().required(),
    },
  };
  return ConfigUtil.validate(logtailEnvs);
});
