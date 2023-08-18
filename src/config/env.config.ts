import Joi from 'joi';

export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  LOGTAIL_TOKEN: process.env.LOGTAIL_TOKEN,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_BOT_APPLICATION_ID: process.env.DISCORD_BOT_APPLICATION_ID,
  DISCORD_BOT_PUBLIC_KEY: process.env.DISCORD_BOT_PUBLIC_KEY,
  DISCORD_OWNER_ID: process.env.DISCORD_OWNER_ID,
});

export const validationSchema = () => {
  return Joi.object({
    NODE_ENV: Joi.string().required(),
    REDIS_HOST: Joi.string().optional(),
    REDIS_PORT: Joi.number().optional(),
    MONGODB_URI: Joi.string().required(),
    LOGTAIL_TOKEN: Joi.string().optional(),
    DISCORD_BOT_TOKEN: Joi.string().required(),
    DISCORD_BOT_APPLICATION_ID: Joi.string().required(),
    DISCORD_BOT_PUBLIC_KEY: Joi.string().required(),
    DISCORD_OWNER_ID: Joi.string().required(),
  });
};
