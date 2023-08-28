import { ProcessorsService } from './processors.service';
import { Module } from '@nestjs/common';
import { EventsProcessorModule } from './events/events-processor.module';

@Module({
  imports: [EventsProcessorModule],
  providers: [ProcessorsService],
})
export class ProcessorsModule {}
