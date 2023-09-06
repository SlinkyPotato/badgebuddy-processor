import { Module } from '@nestjs/common';
import { EventsProcessorModule } from './events/events-processor.module';

@Module({
  imports: [EventsProcessorModule],
  providers: [],
})
export class ProcessorsModule {}
