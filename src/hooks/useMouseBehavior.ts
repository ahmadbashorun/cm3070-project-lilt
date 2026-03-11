"use client";

import { useState, useEffect, useRef } from "react";
import { useStressStore } from "@/store/stressStore";
import type { MouseMetrics } from "@/types";

interface MousePosition {
  x: number;
  y: number;
  t: number;
}

function calculateJitter(positions: MousePosition[]): number {
  if (positions.length < 3) return 0;

  let directionChanges = 0;
  let totalDistance = 0;

  for (let i = 2; i < positions.length; i++) {
    const prev = positions[i - 2];
    const curr = positions[i - 1];
    const next = positions[i];

    if (prev === undefined || curr === undefined || next === undefined) {
      continue;
    }

    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

    if (mag1 > 0 && mag2 > 0) {
      const angle = Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2))));
      if (angle > Math.PI / 6) directionChanges++;
      totalDistance += mag1;
    }
  }

  return totalDistance > 0 ? (directionChanges / totalDistance) * 100 : 0;
}

function calculateMouseMetrics(
  positions: MousePosition[],
  clicks: number[]
): MouseMetrics {
  const now = Date.now();

  let avgVelocity = 0;
  if (positions.length >= 2) {
    const velocities: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      if (prev === undefined || curr === undefined) {
        continue;
      }
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const time = (curr.t - prev.t) / 1000;
      if (time > 0) {
        velocities.push(distance / time);
      }
    }
    if (velocities.length > 0) {
      avgVelocity =
        velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    }
  }

  const jitterIndex = calculateJitter(positions);

  const recentClicks = clicks.filter((t) => now - t < 60000);
  const clickFrequency = recentClicks.length;

  const hoverHesitation = 0;

  return {
    avgVelocity,
    jitterIndex,
    clickFrequency,
    hoverHesitation,
    scrollIntensity: 0,
  };
}

const initialMetrics: MouseMetrics = {
  avgVelocity: 0,
  jitterIndex: 0,
  clickFrequency: 0,
  hoverHesitation: 0,
  scrollIntensity: 0,
};

export function useMouseBehavior(enabled: boolean = true): MouseMetrics {
  const [metrics, setMetrics] = useState<MouseMetrics>(initialMetrics);
  const positions = useRef<MousePosition[]>([]);
  const clicks = useRef<number[]>([]);
  const setDetectionInputs = useStressStore(
    (state) => state.setDetectionInputs
  );

  useEffect(() => {
    if (!enabled) return;

    let lastUpdate = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      positions.current.push({ x: e.clientX, y: e.clientY, t: now });

      const cutoff = now - 2000;
      positions.current = positions.current.filter((p) => p.t > cutoff);

      if (now - lastUpdate > 500) {
        const newMetrics = calculateMouseMetrics(
          positions.current,
          clicks.current
        );
        setMetrics(newMetrics);
        setDetectionInputs({ mouse: newMetrics });
        lastUpdate = now;
      }
    };

    const handleClick = () => {
      const now = Date.now();
      clicks.current.push(now);
      const cutoff = now - 60000;
      clicks.current = clicks.current.filter((t) => t > cutoff);
    };

    const handleScroll = () => {
      const now = Date.now();
      const recentScrolls = clicks.current.filter((t) => now - t < 60000);
      const scrollIntensity = recentScrolls.length;

      // Avoid calling setDetectionInputs inside a React state updater callback
      // to prevent React warnings about updating another component during render.
      const updated = { ...metrics, scrollIntensity };
      setMetrics(updated);
      setDetectionInputs({ mouse: updated });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enabled, setDetectionInputs, metrics]);

  return metrics;
}
