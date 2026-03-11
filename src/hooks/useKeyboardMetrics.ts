"use client";

import { useState, useEffect, useRef } from "react";
import { useStressStore } from "@/store/stressStore";
import type { KeyboardMetrics, KeyboardBaseline } from "@/types";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

function calculateMetrics(
  timestamps: number[],
  keys: string[],
  baseline: KeyboardBaseline | null
): KeyboardMetrics {
  if (timestamps.length < 2 || keys.length === 0) {
    return {
      typingSpeed: baseline ? 100 : 0,
      errorRate: 0,
      pauseFrequency: 0,
      rhythmVariance: 0,
    };
  }

  const intervals = timestamps.slice(1).map((t, i) => {
    const prev = timestamps[i];
    if (prev === undefined) return 0;
    return t - prev;
  });
  const intervalVariance = standardDeviation(intervals);

  const lastTimestamp = timestamps[timestamps.length - 1];
  const firstTimestamp = timestamps[0];
  if (lastTimestamp === undefined || firstTimestamp === undefined) {
    return {
      typingSpeed: baseline ? 100 : 0,
      errorRate: 0,
      pauseFrequency: 0,
      rhythmVariance: 0,
    };
  }
  const totalTime = lastTimestamp - firstTimestamp;
  const charCount = keys.filter((k) => k !== "BACKSPACE").length;

  let wpm = 0;
  if (totalTime > 0 && charCount > 0) {
    wpm = charCount / 5 / (totalTime / 60000);
  }

  const backspaces = keys.filter((k) => k === "BACKSPACE").length;
  const errorRate = charCount > 0 ? (backspaces / charCount) * 100 : 0;

  const pauses = intervals.filter((i) => i > 2000).length;
  const pauseFrequency = totalTime > 0 ? pauses / (totalTime / 60000) : 0;

  return {
    typingSpeed:
      baseline && baseline.avgWPM > 0 ? (wpm / baseline.avgWPM) * 100 : wpm,
    errorRate,
    pauseFrequency,
    rhythmVariance: intervalVariance,
  };
}

interface UseKeyboardMetricsReturn {
  metrics: KeyboardMetrics;
  setBaseline: (baseline: KeyboardBaseline | null) => void;
  isCalibrated: boolean;
}

const initialMetrics: KeyboardMetrics = {
  typingSpeed: 0,
  errorRate: 0,
  pauseFrequency: 0,
  rhythmVariance: 0,
};

function isValidKeyboardBaseline(value: unknown): value is KeyboardBaseline {
  return (
    typeof value === "object" &&
    value !== null &&
    "avgWPM" in value &&
    "avgInterKeyInterval" in value &&
    "rhythmVariance" in value &&
    "errorRate" in value &&
    typeof (value as KeyboardBaseline).avgWPM === "number" &&
    typeof (value as KeyboardBaseline).avgInterKeyInterval === "number" &&
    typeof (value as KeyboardBaseline).rhythmVariance === "number" &&
    typeof (value as KeyboardBaseline).errorRate === "number"
  );
}

export function useKeyboardMetrics(
  enabled: boolean = true
): UseKeyboardMetricsReturn {
  const [metrics, setMetrics] = useState<KeyboardMetrics>(initialMetrics);
  const [baseline, setBaselineState] = useState<KeyboardBaseline | null>(null);
  const keyTimestamps = useRef<number[]>([]);
  const keyBuffer = useRef<string[]>([]);
  const setDetectionInputs = useStressStore(
    (state) => state.setDetectionInputs
  );

  useEffect(() => {
    let previousBaseline: KeyboardBaseline | null = null;

    const checkBaseline = () => {
      try {
        const state = useStressStore.getState();
        const baselineValue: unknown = state.keyboardBaseline;
        if (
          isValidKeyboardBaseline(baselineValue) &&
          baselineValue !== previousBaseline
        ) {
          previousBaseline = baselineValue;
          setBaselineState(baselineValue);
        } else if (!isValidKeyboardBaseline(baselineValue)) {
          previousBaseline = null;
        }
      } catch {
        // Ignore errors from store access
      }
    };

    checkBaseline();

    const unsubscribe = useStressStore.subscribe((state) => {
      const baselineValue: unknown = state.keyboardBaseline;
      if (
        isValidKeyboardBaseline(baselineValue) &&
        baselineValue !== previousBaseline
      ) {
        previousBaseline = baselineValue;
        setBaselineState(baselineValue);
      } else if (!isValidKeyboardBaseline(baselineValue)) {
        previousBaseline = null;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const now = Date.now();
      keyTimestamps.current.push(now);

      if (e.key === "Backspace") {
        keyBuffer.current.push("BACKSPACE");
      } else if (e.key.length === 1) {
        keyBuffer.current.push(e.key);
      }

      if (keyBuffer.current.length >= 30) {
        const newMetrics = calculateMetrics(
          keyTimestamps.current,
          keyBuffer.current,
          baseline
        );
        setMetrics(newMetrics);
        setDetectionInputs({ keyboard: newMetrics });

        keyTimestamps.current = keyTimestamps.current.slice(-10);
        keyBuffer.current = keyBuffer.current.slice(-10);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, baseline, setDetectionInputs]);

  const setBaseline = (newBaseline: KeyboardBaseline | null) => {
    setBaselineState(newBaseline);
  };

  return {
    metrics,
    setBaseline,
    isCalibrated: baseline !== null,
  };
}
