"use client";

import { useState, useRef, useCallback } from "react";
import type { FacialBaseline } from "@/types";
import type { FaceLandmarker, NormalizedLandmark } from "@/types/mediapipe";
import { createFaceLandmarker } from "@/utils/mediapipeConfig";
import {
  extractFacialMetrics,
  calculateFacialBaseline,
} from "@/utils/facialDetection";

interface UseFacialCalibrationReturn {
  isCalibrating: boolean;
  isInitializing: boolean;
  progress: number;
  error: string | null;
  startCalibration: () => void;
  stopCalibration: () => void;
  getBaseline: () => FacialBaseline | null;
}

const CALIBRATION_DURATION = 15000;
const TARGET_FPS = 6;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const TARGET_FRAMES = Math.floor((CALIBRATION_DURATION / 1000) * TARGET_FPS);

export function useFacialCalibration(
  videoElement: HTMLVideoElement | null
): UseFacialCalibrationReturn {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(videoElement);
  const isInitializingRef = useRef(false);
  const metricsRef = useRef<
    {
      eyeAspectRatio: number;
      mouthAspectRatio: number;
      browPosition: number;
      headPose: { yaw: number; pitch: number; roll: number };
      landmarkPositions: number[][];
    }[]
  >([]);
  const startTimeRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  const frameRequestRef = useRef<number | null>(null);
  const isCalibratingRef = useRef(false);

  if (videoElementRef.current !== videoElement) {
    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close();
      faceLandmarkerRef.current = null;
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
    const landmarker = faceLandmarkerRef.current;
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
      const currentLandmarker = faceLandmarkerRef.current;
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
        console.warn("Face detection error:", error);
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const firstLandmark = result.faceLandmarks[0];
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
      const metrics = extractFacialMetrics(landmarks);

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

    if (!faceLandmarkerRef.current && !isInitializingRef.current) {
      isInitializingRef.current = true;
      setIsInitializing(true);
      createFaceLandmarker()
        .then((faceLandmarker) => {
          if (videoElementRef.current !== currentVideo) {
            faceLandmarker.close();
            isInitializingRef.current = false;
            setIsInitializing(false);
            return;
          }
          faceLandmarkerRef.current = faceLandmarker;
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
              : "Failed to initialize FaceLandmarker"
          );
        });
      return;
    }

    if (!faceLandmarkerRef.current) {
      if (isInitializingRef.current) {
        setError("FaceLandmarker is initializing, please wait");
      } else {
        setError("FaceLandmarker not initialized");
      }
      return;
    }

    beginCalibration();
  }, [beginCalibration]);

  const getBaseline = useCallback((): FacialBaseline | null => {
    if (metricsRef.current.length < 10) {
      return null;
    }

    try {
      return calculateFacialBaseline(metricsRef.current);
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
