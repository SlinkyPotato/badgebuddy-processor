import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { CommunityEventEntity } from '@badgebuddy/common';
import { Queue } from 'bull';
import {
  DISCORD_COMMUNITY_EVENTS_END_JOB,
  DISCORD_COMMUNITY_EVENTS_QUEUE,
} from '@badgebuddy/common/dist/redis-bull-config/redis-bull.constants';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class CronJobsService implements OnModuleInit {
  CRON_TIMEOUT_DISBAND_FOR_ID = 'CRON_TIMEOUT_DISBAND_FOR_ID_%s' as const;

  constructor(
    private readonly logger: Logger,
    private readonly dataSource: DataSource,
    @InjectQueue(DISCORD_COMMUNITY_EVENTS_QUEUE)
    private readonly communityEventQueue: Queue,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    this.logger.log('CronJobsService initialized');
    let events: CommunityEventEntity[] = [];
    try {
      events = await this.fetchCommunityEventsNotDisbanded();
    } catch (err) {
      this.logger.error('error fetching community events', err);
      return;
    }
    for (const event of events) {
      if (event.endDate < new Date()) {
        // send to queue to disband
        this.logger.log(
          `event ${event.id} has ended, sending to queue: ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
        );
        try {
          await this.communityEventQueue.add(DISCORD_COMMUNITY_EVENTS_END_JOB, {
            eventId: event.id,
          });
        } catch (err) {
          this.logger.error(
            `error adding event ${event.id} to queue: ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
            err,
          );
        }
      } else {
        this.logger.log(`event ${event.id} has not ended`);
        // create a cron job to disband at the end date
        this.addCronTimeoutToDisbandEvent(event.id, event.endDate);
      }
    }
  }

  private async fetchCommunityEventsNotDisbanded() {
    this.logger.verbose('fetching community events not disbanded');
    const events = await this.dataSource
      .createQueryBuilder()
      .select('ce')
      .from(CommunityEventEntity, 'ce')
      .where('ce.disbanded_date IS NULL')
      .getMany();
    this.logger.verbose(
      `found ${events.length} events to check for disbanding`,
    );
    return events;
  }

  addCronTimeoutToDisbandEvent(communityEventId: string, endDate: Date): void {
    this.logger.verbose(`adding cron timeout for event ${communityEventId}`);
    const disbandTimeoutName = this.CRON_TIMEOUT_DISBAND_FOR_ID.replace(
      '%s',
      communityEventId,
    );
    const disbandTimeout = setTimeout(() => {
      this.communityEventQueue
        .add(DISCORD_COMMUNITY_EVENTS_END_JOB, {
          eventId: communityEventId,
        })
        .catch((err) => {
          this.logger.error(
            `error adding event ${communityEventId} to queue: ${DISCORD_COMMUNITY_EVENTS_END_JOB}`,
            err,
          );
        });
    }, endDate.getTime() - new Date().getTime());
    this.schedulerRegistry.addTimeout(disbandTimeoutName, disbandTimeout);
    this.logger.verbose(`added cron timeout ${disbandTimeoutName}`);
  }
}
