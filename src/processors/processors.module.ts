import { Module } from '@nestjs/common';
import { ProcessorsService } from './processors.service';

@Module({
  providers: [ProcessorsService],
})
export class ProcessorsModule {}
