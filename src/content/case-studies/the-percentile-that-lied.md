---
title: "The Percentile That Lied"
description: "A latency alert where P50 and average looked perfectly healthy while P99 had already spiked, and why averages are the wrong lens for user-facing latency."
publishDate: 2026-01-15
---

## The page

A latency alert fired on an inbound-transfer processing path for a fintech payments platform: p99 response time had crossed its threshold and stayed there for several minutes. The on-call engineer's first move, reasonably, was to check the service's main dashboard; average response time and P50 both sat comfortably inside normal range. Throughput was normal. Error rate was flat at zero. By every dashboard that loaded first, nothing was wrong.

That mismatch, a firing alert against a dashboard that says everything's fine, is exactly the moment worth slowing down for, not dismissing.

## Why averages hide this

Average and P50 answer "what does a typical request look like." They're dominated by the bulk of traffic, which for a healthy service is, definitionally, still healthy even while something is actively degrading. A P99 regression can be entirely invisible in those numbers because it only takes 1% of requests behaving badly to blow through a P99 threshold while contributing almost nothing to the mean.

The instinct to check "the dashboard" first is usually right, but it matters *which* dashboard. For a page that alerted on P99, the average is the wrong first read: it can only tell you the alert is wrong, never why it's right.

## Following the tail instead

Filtering the same time window down to just the slowest 1% of requests told a different story: those requests weren't evenly distributed across customers or transaction types. They clustered tightly around a narrow set of accounts, and within that cluster, every one of them shared a downstream dependency, a secondary lookup call that only executes for a specific account configuration, not the default path most traffic takes.

That's the structural reason a P99-only regression can hide from average-based monitoring indefinitely: it wasn't a general slowdown, it was a specific code path, exercised by a specific minority of traffic, running slow. Averaging across all traffic dilutes a real, isolated problem into statistical noise.

## Root cause and fix

The secondary lookup was making a synchronous call to a dependency that had, independently, started returning slowly for that account configuration, a downstream issue that had no reason to appear on this service's own health dashboards, because from this service's perspective, request volume and error rate were both normal. Only latency, and only for the affected minority, moved.

The fix was two-fold: make the lookup asynchronous where the product allowed it, and, more durably, add a P99-segmented-by-code-path view to the dashboard so a future regression like this wouldn't require someone to manually filter and eyeball the slow tail before spotting the pattern.

## The takeaway

When an alert and a dashboard disagree, don't trust the dashboard by default just because it's the one you looked at first; check whether it's even measuring the same thing the alert measured. P50/average and P99 are different lenses on the same traffic, and a real regression can be completely real in one and completely invisible in the other. Alert on percentiles, but also build the tooling to *investigate* by percentile, not just by aggregate.
