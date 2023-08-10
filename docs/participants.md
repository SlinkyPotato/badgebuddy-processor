# Participant Tracking Notes

This document describes the logic for tracking participants in a voice channel event. The important this is to 
calculate the participant duration. This is done by capturing the start and end date for each participant.

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
- all present users are checked
- audio checked
- startDate captured
- duration of 0 is captured
- all participants inserted into db (should be single db call)

### ongoing event

#### new user joins (or un-deafens)
- audio is checked
- cache is checked for user exists
- db is checked for user exists
- capture startDate
- duration of zero is captured
- insert user into db

### user leaves (or is deafened)
- audio is checked
- cache is checked for user exists
- if cache is empty, db is checked for user exists
- capture endDate
- duration is calculated and set
- update user in db

### user rejoins (or un-deafens)
- audio is checked
- cache is checked for user exists
- if cache is empty, db is checked for user exists
- reset startDate
- remove endDate

### end of event
- all present users are checked
- audio checked
- endDate captured
- duration is calculated and set
- all participants updated in db (should be single db call)
