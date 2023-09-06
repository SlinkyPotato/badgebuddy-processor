# Participant Tracking Notes

This document describes the logic for tracking participants in a voice channel event. Tracking is temporary and 
stored in cache. The cache is cleared when the event is stopped. Later the badges are distributed to eligible 
participants.

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
- all participants inserted into cache (message queue)

### ongoing event

#### new user joins (or un-deafens)
- check event is active for voice channel
- audio is checked
- cache is checked for user exists
- capture startDate
- duration of zero is captured
- insert into cache
  - add user key to keys
  - store startDate for user
  - store duration for user

### user leaves (or is deafened)
- check event is active for voice channel
- audio is checked
- cache is checked for user exists
- capture endDate
- duration is calculated
- update cache
  - store endDate for user
  - store duration for user

### user rejoins (or un-deafens)
- check event is active for voice channel
- audio is checked
- cache is checked for user exists
- reset startDate
- remove endDate
- update cache
  - store new startDate for user
  - remove endDate for user

### end of event
- endDate captured
- retrieve all users from cache (check size of object and revisit this)
    - store new endDate for all users missing endDate
- duration is calculated
- all participants updated in db (should be single db call, replace if exists)
- clear cache

### on redis startup recovery
- all present users are checked from channel
- audio checked
- store users from channel and db into cache
- retrieve all users from db and compare with channel
  - if user exists in db with endDate and present in channel, execute rejoin flow (3)
    - reset startDate
    - remove endDate
    - insert into cache
  - if user exists in db without endDate and present in channel, skip
  - if user does not exist in db and present in channel, execute join flow (3)
    - capture startDate
    - duration of zero is captured
    - insert into cache

### on redis server shutdown (graceful)
- store all users from cache into db
  - get all active events from db
  - pull all users from cache for each active event
  - store all users from cache into db

### on processor failure
- try to store all users from cache into db

# Open questions
1. What happens if processor is down, event is marked as active, and +5 minutes has passed?
    - there shouldn't be any change in data
    - optimally transfer cache into db
2. Can the app execute graceful shutdown scenario?
