---
title: "Designing for the Cache Window, Not the Clock"
description: "Why an agentic workflow's polling and scheduling decisions should be driven by prompt-cache economics, not round numbers. Generalized from cutting real query scan volume by ~85%."
publishDate: 2026-02-02
---

## The habit worth breaking

A common default when an agentic workflow needs to check back on something (a long-running job, a background task, a "come back in a bit") is to reach for a round number: wait five minutes, poll every minute, check back hourly. It reads as a reasonable default because it is one for a human calendar. It's the wrong default for a system whose actual cost structure runs on a completely different clock.

## The clock that actually matters

Most LLM-backed agent sessions rely on prompt caching to stay fast and cheap: a session's context gets cached for a fixed window, often just a few minutes, and any request inside that window reads from cache almost for free, while a request that lands *after* the window expires pays full price to reprocess the entire context from scratch. That cache TTL is a hard edge, not a gradient. A wait of 250 seconds and a wait of 320 seconds look almost identical on a calendar; against a 300-second cache window, one is free and the other is a full cache miss.

Round-number scheduling ignores this edge entirely. "Check back in 5 minutes" against a 300-second cache TTL is close enough to the boundary that it can land on either side of it by accident, and worse, doing that repeatedly (polling every 5 minutes for an hour) pays the full reprocessing cost on almost every single check, because each wait straddles the cache boundary instead of respecting it.

## The reframe

The fix isn't a smarter round number, it's changing what the number is measuring. Instead of asking "how long should I wait," the right question is "am I still inside this cache window, or am I committing to leave it." That collapses scheduling into two real options:

- **Stay inside the window**: short polls, comfortably under the cache TTL, so every check-in is a cheap cache hit.
- **Commit to leaving it**: a long wait, well past the TTL, chosen because there's nothing useful to check sooner, accepting the one-time reprocessing cost deliberately instead of paying it accidentally on every poll.

What's explicitly wrong is the middle: waiting *just past* the cache window on a hunch that "5 minutes felt right," paying full reprocessing cost for no benefit over either a shorter poll or a longer, more deliberate wait.

## Where this generalizes

The same principle showed up in a completely different form in query-scope design for observability tooling: the expensive move wasn't the query itself, it was how much scope got pulled in before filtering happened. Widening a log query's time window "just in case" and filtering client-side afterward looks harmless on a whiteboard, but it multiplies scan volume linearly with a window most requests didn't need, the same shape of mistake as polling past a cache boundary "just in case" something is ready. In both cases, bounding scope *before* the expensive operation (narrowing the query window up front, or timing a check-in relative to a real cost boundary instead of a round number) turned an unbounded default into a deliberate one. That query-scope discipline alone cut scan volume roughly 85% by eliminating exactly this kind of unexamined "just in case" padding.

## The takeaway

Treat any recurring cost boundary, whether a cache TTL, a rate limit window, or a batch cutoff, as a real edge to design scheduling around, not a soft suggestion to round near. The question is never "how long is reasonable to wait," it's "which side of the boundary does this wait put me on, and did I mean to be there."
