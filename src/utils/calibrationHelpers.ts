import type { KeyboardBaseline } from "@/types";

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  isError: boolean;
}

export function calculateKeyboardBaseline(
  events: KeystrokeEvent[]
): KeyboardBaseline {
  if (events.length === 0) {
    return {
      avgWPM: 0,
      avgInterKeyInterval: 0,
      rhythmVariance: 0,
      errorRate: 0,
    };
  }

  const intervals: number[] = [];
  let errorCount = 0;
  let validKeyCount = 0;
  let intervalSum = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) continue;

    if (event.isError) {
      errorCount++;
    } else if (event.key.length === 1) {
      validKeyCount++;
    }

    if (i > 0) {
      const previous = events[i - 1];
      if (previous) {
        const interval = event.timestamp - previous.timestamp;
        if (interval > 0 && interval < 2000) {
          intervals.push(interval);
          intervalSum += interval;
        }
      }
    }
  }

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const totalTime =
    firstEvent && lastEvent ? lastEvent.timestamp - firstEvent.timestamp : 0;
  const wpm = totalTime > 0 ? validKeyCount / 5 / (totalTime / 60000) : 0;
  const intervalCount = intervals.length;
  const avgInterval = intervalCount > 0 ? intervalSum / intervalCount : 0;

  let varianceSum = 0;
  if (intervalCount > 0 && avgInterval > 0) {
    for (const interval of intervals) {
      const diff = interval - avgInterval;
      varianceSum += diff * diff;
    }
  }
  const variance = intervalCount > 0 ? varianceSum / intervalCount : 0;
  const errorRate = events.length > 0 ? (errorCount / events.length) * 100 : 0;

  return {
    avgWPM: Math.round(wpm),
    avgInterKeyInterval: Math.round(avgInterval),
    rhythmVariance: Math.round(variance),
    errorRate: Math.round(errorRate * 100) / 100,
  };
}
