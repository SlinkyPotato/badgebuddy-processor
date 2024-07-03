# Processor Queue Notes

This document describes some information regarding the processor queue.

## Queue
1. events

## Redis Indexes
1. /events/active?voiceChannelId=
    - active events - GET endpoint
2. tracking:events:active:voiceChannelId:{id}
    - active event in cache
    - this is used during ongoing event to check if event is active for voice channel
    - if found, then event is active
    - if not found, then do nothing (caching should only be used during discord events)
    - voiceChannelId is unique for each event
3. tracking:events:{id}:participants:{id}
    - participants in event
4. tracking:events:{id}:participants:*
    - redis supported .keys() invocation to get all keys using string pattern
