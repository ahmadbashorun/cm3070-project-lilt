"use client";

import { useEffect, useRef } from "react";
import { useStressStore } from "@/store/stressStore";
import { calculateStress } from "@/utils/stressFusion";
import type { StressLevel } from "@/types";

function getCalculationInterval(stressLevel: StressLevel): number {
  return stressLevel >= 2 ? 2000 : stressLevel === 1 ? 3000 : 5000;
}

function shouldTransition(
  newLevel: StressLevel,
  currentLevel: StressLevel,
  newScore: number,
  previousScore: number,
  stressHistory: Array<{ level: StressLevel; timestamp: number }>
): boolean {
  if (newLevel === currentLevel) return false;

  const now = Date.now();
  const STABILITY_DURATION = 30000;
  const RECOVERY_THRESHOLD = 20;

  const recentHistory = stressHistory.filter(
    (entry) => now - entry.timestamp < STABILITY_DURATION
  );

  const hasBeenStable = recentHistory.every(
    (entry) => entry.level === currentLevel
  );

  if (!hasBeenStable && recentHistory.length > 0) {
    return false;
  }

  if (newLevel < currentLevel) {
    const scoreDecrease = previousScore - newScore;
    if (scoreDecrease < RECOVERY_THRESHOLD) {
      return false;
    }
  }

  return true;
}

export function useStressCalculation(enabled: boolean = true) {
  const enabledRef = useRef<boolean>(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousScoreRef = useRef<number>(0);

  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabledRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const calculate = () => {
      if (!enabledRef.current) return;

      const store = useStressStore.getState();
      if (store.isManualOverride) return;

      const result = calculateStress(store.detectionInputs, {
        facial: store.facialBaseline,
        posture: store.postureBaseline,
        keyboard: store.keyboardBaseline,
      });

      const shouldUpdate = shouldTransition(
        result.level,
        store.currentLevel,
        result.score,
        previousScoreRef.current,
        store.stressHistory
      );

      if (shouldUpdate || result.level === store.currentLevel) {
        previousScoreRef.current = result.score;
        store.setStressResult(result, false);
      }
    };

    calculate();

    const storeState = useStressStore.getState();
    const interval = getCalculationInterval(storeState.currentLevel);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      calculate();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return {
    calculate: () => {
      if (!enabledRef.current) return;
      const store = useStressStore.getState();
      if (store.isManualOverride) return;
      const result = calculateStress(store.detectionInputs, {
        facial: store.facialBaseline,
        posture: store.postureBaseline,
        keyboard: store.keyboardBaseline,
      });
      store.setStressResult(result, false);
    },
  };
}
