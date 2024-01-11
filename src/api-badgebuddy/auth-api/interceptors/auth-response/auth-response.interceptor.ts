import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';

@Injectable()
export class AuthResponseInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(
    errorResponse: AxiosResponse & { response: { data: { message: string } } },
  ) {
    this.logger.error(
      `error response message: ${errorResponse.response.data.message}`,
    );
    return Promise.reject(errorResponse);
  }
}
