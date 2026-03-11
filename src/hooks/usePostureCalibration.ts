"use client";

import { useState, useRef, useCallback } from "react";
import type { PostureBaseline } from "@/types";
import type { PoseLandmarker, NormalizedLandmark } from "@/types/mediapipe";
import { createPoseLandmarker } from "@/utils/mediapipeConfig";
import {
  extractPostureMetrics,
  calculatePostureBaseline,
} from "@/utils/postureDetection";

interface UsePostureCalibrationReturn {
  isCalibrating: boolean;
  isInitializing: boolean;
  progress: number;
  error: string | null;
  startCalibration: () => void;
  stopCalibration: () => void;
  getBaseline: () => PostureBaseline | null;
}

const CALIBRATION_DURATION = 8000;
const TARGET_FPS = 3;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const TARGET_FRAMES = Math.floor((CALIBRATION_DURATION / 1000) * TARGET_FPS);

export function usePostureCalibration(
  videoElement: HTMLVideoElement | null
): UsePostureCalibrationReturn {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(videoElement);
  const isInitializingRef = useRef(false);
  const metricsRef = useRef<
    Array<{
      shoulderY: number;
      noseY: number;
      leanAngle: number;
      spineAngle: number;
      shoulderAlignment: number;
      landmarkPositions: number[][];
    }>
  >([]);
  const startTimeRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  const frameRequestRef = useRef<number | null>(null);
  const isCalibratingRef = useRef(false);

  if (videoElementRef.current !== videoElement) {
    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.close();
      poseLandmarkerRef.current = null;
    }
    videoElementRef.current = videoElement;
  }

  const stopCalibration = useCallback(() => {
    setIsCalibrating(false);
    isCalibratingRef.current = false;
    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }
  }, []);

  const beginCalibration = useCallback(() => {
    const landmarker = poseLandmarkerRef.current;
    const video = videoElementRef.current;

    if (!landmarker || !video) {
      return;
    }

    setIsCalibrating(true);
    isCalibratingRef.current = true;
    setProgress(0);
    setError(null);
    metricsRef.current = [];
    frameCountRef.current = 0;
    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = 0;

    const processFrame = () => {
      if (!isCalibratingRef.current) {
        frameRequestRef.current = null;
        return;
      }
      const currentLandmarker = poseLandmarkerRef.current;
      const currentVideo = videoElementRef.current;
      if (!currentLandmarker || !currentVideo) {
        frameRequestRef.current = null;
        return;
      }

      // Check if video element is ready and has valid dimensions
      if (
        currentVideo.readyState < 2 ||
        currentVideo.videoWidth === 0 ||
        currentVideo.videoHeight === 0
      ) {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      let result;
      try {
        result = currentLandmarker.detectForVideo(
          currentVideo,
          performance.now()
        );
      } catch (error) {
        // Silently handle errors and continue processing
        console.warn("Pose detection error:", error);
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const firstLandmark = result.landmarks[0];
      if (!firstLandmark) {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      if (now - lastFrameTimeRef.current < FRAME_INTERVAL) {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      lastFrameTimeRef.current = now;
      frameCountRef.current++;

      const landmarks: NormalizedLandmark[] = firstLandmark;
      const metrics = extractPostureMetrics(landmarks);

      metricsRef.current.push({
        ...metrics,
        landmarkPositions: landmarks.map((lm: NormalizedLandmark) => [
          lm.x,
          lm.y,
          lm.z,
        ]),
      });

      const elapsed = now - (startTimeRef.current || now);
      const newProgress = Math.min((elapsed / CALIBRATION_DURATION) * 100, 100);
      setProgress(newProgress);

      if (
        elapsed >= CALIBRATION_DURATION ||
        frameCountRef.current >= TARGET_FRAMES
      ) {
        stopCalibration();
      } else {
        frameRequestRef.current = requestAnimationFrame(processFrame);
      }
    };

    frameRequestRef.current = requestAnimationFrame(processFrame);
  }, [stopCalibration]);

  const startCalibration = useCallback(() => {
    const currentVideo = videoElementRef.current;

    if (!currentVideo) {
      setError("Video element not initialized");
      return;
    }

    if (!poseLandmarkerRef.current && !isInitializingRef.current) {
      isInitializingRef.current = true;
      setIsInitializing(true);
      createPoseLandmarker()
        .then((poseLandmarker) => {
          if (videoElementRef.current !== currentVideo) {
            poseLandmarker.close();
            isInitializingRef.current = false;
            setIsInitializing(false);
            return;
          }
          poseLandmarkerRef.current = poseLandmarker;
          isInitializingRef.current = false;
          setIsInitializing(false);
          if (!isCalibratingRef.current) {
            beginCalibration();
          }
        })
        .catch((err: unknown) => {
          isInitializingRef.current = false;
          setIsInitializing(false);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize PoseLandmarker"
          );
        });
      return;
    }

    if (!poseLandmarkerRef.current) {
      if (isInitializingRef.current) {
        setError("PoseLandmarker is initializing, please wait");
      } else {
        setError("PoseLandmarker not initialized");
      }
      return;
    }

    beginCalibration();
  }, [beginCalibration]);

  const getBaseline = useCallback((): PostureBaseline | null => {
    if (metricsRef.current.length < 3) {
      return null;
    }

    try {
      return calculatePostureBaseline(metricsRef.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to calculate baseline"
      );
      return null;
    }
  }, []);

  return {
    isCalibrating,
    isInitializing,
    progress,
    error,
    startCalibration,
    stopCalibration,
    getBaseline,
  };
}
