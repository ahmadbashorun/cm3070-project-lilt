"use client";

import { useEffect, useMemo, useState } from "react";
import { useStressStore } from "@/store/stressStore";
import {
  calculateFacialStress,
  calculatePosturalStress,
  calculateBehavioralStress,
  calculateContextualLoad,
  calculateTemporalFactor,
} from "@/utils/stressFusion";
import StressChart from "./StressChart";
import styles from "./StressMonitoringPanel.module.scss";
import { IoCloseCircleOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";

interface StressMonitoringPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoricalDataPoint {
  timestamp: number;
  facial: number;
  postural: number;
  behavioral: number;
  contextual: number;
  temporal: number;
  overall: number;
}

export default function StressMonitoringPanel({
  isOpen,
  onClose,
}: StressMonitoringPanelProps): React.ReactElement | null {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const stressResult = useStressStore((state) => state.stressResult);
  const detectionInputs = useStressStore((state) => state.detectionInputs);
  const stressHistory = useStressStore((state) => state.stressHistory);
  const facialBaseline = useStressStore((state) => state.facialBaseline);
  const postureBaseline = useStressStore((state) => state.postureBaseline);
  const keyboardBaseline = useStressStore((state) => state.keyboardBaseline);

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    []
  );

  // Calculate current stress indicators
  const currentIndicators = useMemo(() => {
    // For facial and postural stress, if baseline is missing but we have current metrics,
    // we can still show some indication (e.g., based on raw values or a default calculation)
    let facial: number = calculateFacialStress(
      detectionInputs.facial,
      facialBaseline
    );
    let postural: number = calculatePosturalStress(
      detectionInputs.posture,
      postureBaseline
    );

    // If baseline is missing but we have current metrics, show a placeholder value
    // This indicates detection is working but calibration is needed
    if (facial === 0 && detectionInputs.facial && !facialBaseline) {
      // Show a small non-zero value to indicate detection is active but not calibrated
      facial = 1;
    }
    if (postural === 0 && detectionInputs.posture && !postureBaseline) {
      // Show a small non-zero value to indicate detection is active but not calibrated
      postural = 1;
    }

    const behavioral: number = calculateBehavioralStress(
      detectionInputs.keyboard,
      detectionInputs.mouse,
      keyboardBaseline
    );
    const contextual: number = calculateContextualLoad(detectionInputs.context);
    const temporal: number = calculateTemporalFactor(detectionInputs.context);
    const overall: number = stressResult?.score ?? 0;

    return {
      facial,
      postural,
      behavioral,
      contextual,
      temporal,
      overall,
    };
  }, [
    detectionInputs,
    facialBaseline,
    postureBaseline,
    keyboardBaseline,
    stressResult,
  ]);

  // Update historical data periodically while panel is open
  useEffect(() => {
    if (!isOpen) return;

    const updateData = (): void => {
      const now = Date.now();
      // Read fresh values from store on each update to avoid stale closures
      const storeState = useStressStore.getState();
      const indicators = {
        facial: calculateFacialStress(
          storeState.detectionInputs.facial,
          storeState.facialBaseline
        ),
        postural: calculatePosturalStress(
          storeState.detectionInputs.posture,
          storeState.postureBaseline
        ),
        behavioral: calculateBehavioralStress(
          storeState.detectionInputs.keyboard,
          storeState.detectionInputs.mouse,
          storeState.keyboardBaseline
        ),
        contextual: calculateContextualLoad(storeState.detectionInputs.context),
        temporal: calculateTemporalFactor(storeState.detectionInputs.context),
        overall: storeState.stressResult?.score ?? 0,
      };

      setHistoricalData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: now,
            ...indicators,
          },
        ];

        // Keep only last 30 minutes of data (reduced for smaller panel)
        const cutoff = now - 30 * 60 * 1000;
        return newData.filter((point) => point.timestamp > cutoff);
      });
    };

    // Initial update
    updateData();

    // Update every 5 seconds while panel is open
    const interval = setInterval(updateData, 5000);

    return () => {
      clearInterval(interval);
    };
    // Only depend on isOpen - read other values from store inside updateData to avoid infinite loops
  }, [isOpen]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const now = Date.now();
    const timeWindow = 30 * 60 * 1000; // 30 minutes (reduced from 60)
    const cutoff = now - timeWindow;

    // Filter historical data to time window
    const recentHistorical = historicalData.filter(
      (point) => point.timestamp > cutoff
    );

    // Add current data point
    const allDataPoints = [
      ...recentHistorical,
      {
        timestamp: now,
        ...currentIndicators,
      },
    ];

    // Convert to chart format
    return {
      facial: allDataPoints.map((p): { timestamp: number; value: number } => ({
        timestamp: p.timestamp,
        value: p.facial,
      })),
      postural: allDataPoints.map(
        (p): { timestamp: number; value: number } => ({
          timestamp: p.timestamp,
          value: p.postural,
        })
      ),
      behavioral: allDataPoints.map(
        (p): { timestamp: number; value: number } => ({
          timestamp: p.timestamp,
          value: p.behavioral,
        })
      ),
      contextual: allDataPoints.map(
        (p): { timestamp: number; value: number } => ({
          timestamp: p.timestamp,
          value: p.contextual,
        })
      ),
      temporal: allDataPoints.map(
        (p): { timestamp: number; value: number } => ({
          timestamp: p.timestamp,
          value: p.temporal,
        })
      ),
      overall: allDataPoints.map((p): { timestamp: number; value: number } => ({
        timestamp: p.timestamp,
        value: p.overall,
      })),
      stressLevel: stressHistory
        .filter((entry) => entry.timestamp > cutoff)
        .map((entry): { timestamp: number; value: number } => ({
          timestamp: entry.timestamp,
          value: entry.level * 20, // Scale 0-4 to 0-80 for visualization
        })),
    };
  }, [historicalData, currentIndicators, stressHistory]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`${styles.panel} ${styles[`level${currentLevel}`]}`}
      role="region"
      aria-label="Stress monitoring panel"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Stress Monitoring</h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          type="button"
          aria-label="Close panel"
        >
          <IoCloseCircleOutline />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.chartWrapper}>
          <StressChart data={chartData} width={400} height={200} />
        </div>

        <div className={styles.currentMetrics}>
          <div className={styles.metricsRow}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Overall</span>
              <span className={styles.metricValue}>
                {currentIndicators.overall.toFixed(0)}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Facial</span>
              <span className={styles.metricValue}>
                {currentIndicators.facial.toFixed(0)}
                {detectionInputs.facial && !facialBaseline && (
                  <span className={styles.warningBadge} title="Needs baseline">
                    <CiWarning size={16} />
                  </span>
                )}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Posture</span>
              <span className={styles.metricValue}>
                {currentIndicators.postural.toFixed(0)}
                {detectionInputs.posture && !postureBaseline && (
                  <span className={styles.warningBadge} title="Needs baseline">
                    <CiWarning size={16} />
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className={styles.metricsRow}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Behavior</span>
              <span className={styles.metricValue}>
                {currentIndicators.behavioral.toFixed(0)}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Context</span>
              <span className={styles.metricValue}>
                {currentIndicators.contextual.toFixed(0)}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Temporal</span>
              <span className={styles.metricValue}>
                {currentIndicators.temporal.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
