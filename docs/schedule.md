# Schedule

## On Startup
1. Fetch all events that have not disbanded.

### For Events that have ended
1. Disband the event by processing it into queue DISCORD_COMMUNITY_EVENTS_DISBAND_JOB
2. Done

### For Events that have not ended
1. Create a dynamic cron job for the event to be disbanded at the end time.
2. Done
