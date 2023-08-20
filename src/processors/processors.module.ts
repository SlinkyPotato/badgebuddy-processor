import { ProcessorsService } from './processors.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [ProcessorsService],
})
export class ProcessorsModule {}
