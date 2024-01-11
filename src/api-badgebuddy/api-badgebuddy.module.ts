import { Module } from '@nestjs/common';
import { AuthApiModule } from './auth-api/auth-api.module';

@Module({
  imports: [AuthApiModule],
})
export class ApiBadgebuddyModule {}
