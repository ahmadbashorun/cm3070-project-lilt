"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useFacialDetection } from "@/hooks/useFacialDetection";
import { usePostureDetection } from "@/hooks/usePostureDetection";
import { useStressCalculation } from "@/hooks/useStressCalculation";
import { useStressStore } from "@/store/stressStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import styles from "./StressMonitoringExample.module.scss";

export function StressMonitoringExample() {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);

  const { setBaselines } = useStressStore();
  const { calibration } = useOnboardingStore();
  const stressResult = useStressStore((state) => state.stressResult);
  const currentLevel = useStressStore((state) => state.currentLevel);
  const facialMetrics = useStressStore((state) => state.detectionInputs.facial);
  const postureMetrics = useStressStore(
    (state) => state.detectionInputs.posture
  );

  useEffect(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
      setCameraReady(true);
    }
  }, []);

  useEffect(() => {
    if (calibration.facial && calibration.posture) {
      setBaselines({
        facial: calibration.facial,
        posture: calibration.posture,
      });
    }
  }, [calibration, setBaselines]);

  const facialDetection = useFacialDetection(
    videoRef.current,
    monitoringEnabled && cameraReady
  );

  const postureDetection = usePostureDetection(
    videoRef.current,
    monitoringEnabled && cameraReady
  );

  useStressCalculation(monitoringEnabled);

  const getStressColor = (level: number): string => {
    if (level >= 3) return "#ef4444";
    if (level >= 2) return "#f59e0b";
    if (level >= 1) return "#eab308";
    return "#10b981";
  };

  return (
    <div className={styles.container}>
      <div className={styles.webcamContainer}>
        <Webcam
          ref={webcamRef}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
          onUserMedia={() => {
            setCameraReady(true);
          }}
          onUserMediaError={(error) => {
            console.error("Camera error:", error);
            setCameraReady(false);
          }}
          className={styles.webcam}
        />
      </div>

      <div className={styles.statusPanel}>
        <h2>Monitoring Status</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Camera:</span>
            <span
              className={
                cameraReady ? styles.statusActive : styles.statusInactive
              }
            >
              {cameraReady ? "Ready" : "Not Ready"}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Facial Detection:</span>
            <span
              className={
                facialDetection.isDetecting
                  ? styles.statusActive
                  : styles.statusInactive
              }
            >
              {facialDetection.isDetecting ? "Active" : "Inactive"}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Posture Detection:</span>
            <span
              className={
                postureDetection.isDetecting
                  ? styles.statusActive
                  : styles.statusInactive
              }
            >
              {postureDetection.isDetecting ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {facialDetection.error && (
          <div className={styles.error}>
            Facial Error: {facialDetection.error}
          </div>
        )}
        {postureDetection.error && (
          <div className={styles.error}>
            Posture Error: {postureDetection.error}
          </div>
        )}
      </div>

      {stressResult && (
        <div className={styles.stressPanel}>
          <h2>Stress Analysis</h2>
          <div
            className={styles.stressLevel}
            style={{ backgroundColor: getStressColor(currentLevel) }}
          >
            Level {currentLevel}
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Score:</span>
              <span className={styles.metricValue}>
                {stressResult.score.toFixed(2)}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Type:</span>
              <span className={styles.metricValue}>{stressResult.type}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Confidence:</span>
              <span className={styles.metricValue}>
                {(stressResult.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          {stressResult.signals.length > 0 && (
            <div className={styles.signals}>
              <span className={styles.signalsLabel}>Signals:</span>
              <div className={styles.signalsList}>
                {stressResult.signals.map((signal) => (
                  <span key={signal} className={styles.signal}>
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {facialMetrics && (
        <div className={styles.metricsPanel}>
          <h3>Facial Metrics</h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span>Eye Aspect Ratio:</span>
              <span>{facialMetrics.eyeAspectRatio.toFixed(3)}</span>
            </div>
            <div className={styles.metric}>
              <span>Mouth Aspect Ratio:</span>
              <span>{facialMetrics.mouthAspectRatio.toFixed(3)}</span>
            </div>
            <div className={styles.metric}>
              <span>Brow Position:</span>
              <span>{facialMetrics.browPosition.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {postureMetrics && (
        <div className={styles.metricsPanel}>
          <h3>Posture Metrics</h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span>Lean Angle:</span>
              <span>{postureMetrics.leanAngle.toFixed(2)}°</span>
            </div>
            <div className={styles.metric}>
              <span>Shoulder Tension:</span>
              <span>{postureMetrics.shoulderTension.toFixed(3)}</span>
            </div>
            <div className={styles.metric}>
              <span>Head Drop:</span>
              <span>{postureMetrics.headDrop.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <button
          onClick={() => {
            setMonitoringEnabled(!monitoringEnabled);
          }}
          className={styles.toggleButton}
        >
          {monitoringEnabled ? "Stop Monitoring" : "Start Monitoring"}
        </button>
      </div>
    </div>
  );
}
