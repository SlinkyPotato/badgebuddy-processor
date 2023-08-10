import Joi, { Schema, SchemaMap } from 'joi';

type ConfigProps = {
  value: unknown;
  joi: Schema;
};

export type JoiConfig<T> = Record<keyof T, ConfigProps>;

export default class ConfigUtil {
  /**
   * Validate the config values
   * @param joiConfig
   *
   * Object.assign https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
   * Object.keys https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
   */
  static validate<T>(joiConfig: JoiConfig<Record<string, any>>): T {
    const schemaObject = Object.assign(
      {},
      ...Object.keys(joiConfig).map((key) => ({
        [key]: joiConfig[key].joi,
      })),
    ) as SchemaMap<T>;
    const schema = Joi.object(schemaObject);
    const values = Object.assign(
      {},
      ...Object.keys(joiConfig).map((key) => ({
        [key]: joiConfig[key].value,
      })),
    ) as T;
    const { error } = schema.validate(values, { abortEarly: false });

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return values;
  }
}
