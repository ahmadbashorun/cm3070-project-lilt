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
import styles from "./StressMonitoringModal.module.scss";
import { IoCloseCircleOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";

interface StressMonitoringModalProps {
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

export default function StressMonitoringModal({
  isOpen,
  onClose,
}: StressMonitoringModalProps): React.ReactElement | null {
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

  // Update historical data periodically while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const updateData = (): void => {
      const now = Date.now();
      setHistoricalData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: now,
            ...currentIndicators,
          },
        ];

        // Keep only last 60 minutes of data
        const cutoff = now - 60 * 60 * 1000;
        return newData.filter((point) => point.timestamp > cutoff);
      });
    };

    // Initial update
    updateData();

    // Update every 5 seconds while modal is open
    const interval = setInterval(updateData, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, currentIndicators]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const now = Date.now();
    const timeWindow = 60 * 60 * 1000; // 60 minutes
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

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={-1}
      aria-label="Close modal"
    >
      <div
        className={`${styles.modal} ${styles[`level${currentLevel}`]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stress-monitoring-title"
      >
        <div className={styles.header}>
          <h2 id="stress-monitoring-title" className={styles.title}>
            Stress Monitoring
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <IoCloseCircleOutline />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.chartWrapper}>
            <StressChart data={chartData} width={900} height={500} />
          </div>

          <div className={styles.currentMetrics}>
            <h3 className={styles.metricsTitle}>Current Values</h3>
            {(!facialBaseline || !postureBaseline) && (
              <div className={styles.calibrationWarning}>
                <span>
                  <CiWarning size={16} /> Calibration needed:{" "}
                </span>
                {!facialBaseline && detectionInputs.facial && (
                  <span>Facial baseline missing. </span>
                )}
                {!postureBaseline && detectionInputs.posture && (
                  <span>Posture baseline missing. </span>
                )}
                <span>Complete calibration for accurate stress readings.</span>
              </div>
            )}
            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Overall Score</span>
                <span className={styles.metricValue}>
                  {currentIndicators.overall.toFixed(1)}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>
                  Facial Stress
                  {detectionInputs.facial && !facialBaseline && (
                    <span
                      className={styles.warningBadge}
                      title="Calibration needed"
                    >
                      <CiWarning size={16} />
                    </span>
                  )}
                </span>
                <span className={styles.metricValue}>
                  {currentIndicators.facial.toFixed(1)}
                  {detectionInputs.facial && !facialBaseline && (
                    <span className={styles.warningText}>
                      {" "}
                      (needs baseline)
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>
                  Postural Stress
                  {detectionInputs.posture && !postureBaseline && (
                    <span
                      className={styles.warningBadge}
                      title="Calibration needed"
                    >
                      <CiWarning size={16} />
                    </span>
                  )}
                </span>
                <span className={styles.metricValue}>
                  {currentIndicators.postural.toFixed(1)}
                  {detectionInputs.posture && !postureBaseline && (
                    <span className={styles.warningText}>
                      {" "}
                      (needs baseline)
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Behavioral Stress</span>
                <span className={styles.metricValue}>
                  {currentIndicators.behavioral.toFixed(1)}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Contextual Load</span>
                <span className={styles.metricValue}>
                  {currentIndicators.contextual.toFixed(1)}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Temporal Factor</span>
                <span className={styles.metricValue}>
                  {currentIndicators.temporal.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
