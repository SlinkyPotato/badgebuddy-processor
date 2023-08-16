import { registerAs } from '@nestjs/config';
import ConfigUtil, { JoiConfig } from './config.util';
import Joi from 'joi';
import { NodeEnvs } from '@solidchain/badge-buddy-common';

export type SystemEnv = {
  nodeEnv: NodeEnvs;
};
export default registerAs('system', (): SystemEnv => {
  const values: JoiConfig<SystemEnv> = {
    nodeEnv: {
      value: process.env.NODE_ENV,
      joi: Joi.string()
        .required()
        .valid(...Object.values(NodeEnvs)),
    },
  };

  return ConfigUtil.validate(values);
});
