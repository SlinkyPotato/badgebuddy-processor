# Participant Tracking Notes

This document describes the logic for tracking participants in a voice channel event. Tracking is temporary and 
stored in cache. The cache is cleared when the event is stopped. Later the badges are distributed to eligible 
participants.

## Redis Indexes
- active events cache - GET /events/active?guildId=&voiceChannelId= (endpoint)
- participant in event - processor_/events/:id/participants/:id (processor only)

### Notes
- post start marks event as active
- put stop marks event as inactive
- between start and stop, voice channel events are active

## Event Scenarios
A user entry in db MUST exist if they enter the voice channel during an active event.

### start of event
- all present users are checked from channel
- audio checked
- startDate captured
- duration of 0 is captured
- all participants inserted into db (should be single db call)
- all participants inserted into cache

### ongoing event

#### new user joins (or un-deafens)
- audio is checked
- cache is checked for user exists
- capture startDate
- duration of zero is captured
- insert into cache

### user leaves (or is deafened)
- audio is checked
- cache is checked for user exists
- capture endDate
- duration is calculated
- update cache
  - store endDate for user
  - store duration for user

### user rejoins (or un-deafens)
- audio is checked
- cache is checked for user exists
- reset startDate
- remove endDate
- update cache
  - store new startDate for user
  - remove endDate for user

### on processor startup
- all present users are checked from channel
- audio checked
- retrieve all users from cache
  - if user exists in cache with endDate and present in channel, execute rejoin flow (3)
  - if user exists in cache without endDate and present in channel, skip
  - if user does not exist in cache and present in channel, execute join flow (3)

### on processor shutdown (graceful)
... 

### end of event
- all present users are checked from channel
- audio checked
- endDate captured
- retrieve all users from cache (check size of object and revisit this)
  - store new endDate for all users missing endDate
  - store new endDate for all users that exist in channel (they should not have an endDate)
- duration is calculated
- all participants updated in db (should be single db call, replace if exists)
- clear cache

# Open questions
1. What happens if processor is down, event is marked as active, and +5 minutes has passed?
2. Can the app execute graceful shutdown scenario?