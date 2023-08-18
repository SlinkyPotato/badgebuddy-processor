import { registerAs } from '@nestjs/config';
import ConfigUtil, { JoiConfig } from './config.util';
import Joi from 'joi';

export interface DiscordEnv {
  token: string;
  appId: string;
  publicKey: string;
  ownerId: string;
}

export default registerAs('discord', (): DiscordEnv => {
  const discordEnvs: JoiConfig<DiscordEnv> = {
    token: {
      value: process.env.DISCORD_BOT_TOKEN,
      joi: Joi.string().required(),
    },
    appId: {
      value: process.env.DISCORD_BOT_APPLICATION_ID,
      joi: Joi.string().required(),
    },
    publicKey: {
      value: process.env.DISCORD_BOT_PUBLIC_KEY,
      joi: Joi.string().required(),
    },
    ownerId: {
      value: process.env.DISCORD_OWNER_ID,
      joi: Joi.string().required(),
    },
  };
  // discordEnvs.token.value = null;
  console.log(JSON.stringify(discordEnvs.constructor.name));
  return ConfigUtil.validate(discordEnvs);
});
