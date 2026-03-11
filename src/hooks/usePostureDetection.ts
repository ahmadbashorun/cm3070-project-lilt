"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { PostureMetrics } from "@/types";
import type { PoseLandmarker, NormalizedLandmark } from "@/types/mediapipe";
import { createPoseLandmarker } from "@/utils/mediapipeConfig";
import { extractPostureMetrics } from "@/utils/postureDetection";
import { useStressStore } from "@/store/stressStore";

interface UsePostureDetectionReturn {
  isDetecting: boolean;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
  currentMetrics: PostureMetrics | null;
}

function getMonitoringFps(stressLevel: number): number {
  return stressLevel >= 2 ? 10 : stressLevel === 1 ? 5 : 2;
}

export function usePostureDetection(
  videoElement: HTMLVideoElement | null,
  enabled: boolean = true,
  permissionStatus: "granted" | "denied" | "prompt" | "unavailable" = "prompt"
): UsePostureDetectionReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<PostureMetrics | null>(
    null
  );
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(videoElement);
  const enabledRef = useRef<boolean>(enabled);
  const stressLevelRef = useRef<number>(useStressStore.getState().currentLevel);
  const lastFrameTimeRef = useRef<number>(0);
  const isDetectingRef = useRef(false);
  const frameRequestRef = useRef<number | null>(null);
  const prevMetricsRef = useRef<PostureMetrics | null>(null);
  const setDetectionInputs = useStressStore(
    (state) => state.setDetectionInputs
  );

  videoElementRef.current = videoElement;
  enabledRef.current = enabled;
  stressLevelRef.current = useStressStore.getState().currentLevel;

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    isDetectingRef.current = false;
    setCurrentMetrics(null);
    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }
  }, []);

  const startDetectionLoop = useCallback(() => {
    setIsDetecting(true);
    isDetectingRef.current = true;
    setError(null);
    lastFrameTimeRef.current = 0;

    const processFrame = () => {
      if (!isDetectingRef.current) {
        frameRequestRef.current = null;
        return;
      }
      const landmarker = poseLandmarkerRef.current;
      const video = videoElementRef.current;
      if (!landmarker || !video) {
        frameRequestRef.current = null;
        return;
      }

      // Check if video element is ready and has valid dimensions
      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      let result;
      try {
        result = landmarker.detectForVideo(video, performance.now());
      } catch (error) {
        // Silently handle errors and continue processing
        console.warn("Pose detection error:", error);
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const firstLandmark = result.landmarks[0];
      if (!firstLandmark) {
        setCurrentMetrics(null);
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      const fps = getMonitoringFps(stressLevelRef.current);
      const frameInterval = 1000 / fps;

      if (now - lastFrameTimeRef.current < frameInterval) {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      lastFrameTimeRef.current = now;

      const landmarks: NormalizedLandmark[] = firstLandmark;
      const metrics = extractPostureMetrics(landmarks);

      const postureMetrics = {
        leanAngle: metrics.leanAngle,
        shoulderTension: metrics.shoulderAlignment,
        headDrop: metrics.noseY - metrics.shoulderY,
        movementLevel: 0,
      };

      // Only update state if metrics have actually changed to prevent infinite loops
      const prevMetrics = prevMetricsRef.current;
      const hasChanged =
        !prevMetrics ||
        prevMetrics.leanAngle !== postureMetrics.leanAngle ||
        prevMetrics.shoulderTension !== postureMetrics.shoulderTension ||
        prevMetrics.headDrop !== postureMetrics.headDrop ||
        prevMetrics.movementLevel !== postureMetrics.movementLevel;

      if (hasChanged) {
        setCurrentMetrics(postureMetrics);
        setDetectionInputs({ posture: postureMetrics });
        prevMetricsRef.current = postureMetrics;
      }

      frameRequestRef.current = requestAnimationFrame(processFrame);
    };

    frameRequestRef.current = requestAnimationFrame(processFrame);
  }, [setDetectionInputs]);

  useEffect(() => {
    const currentVideo = videoElementRef.current;
    const currentEnabled = enabledRef.current;

    if (!currentVideo || !currentEnabled || permissionStatus !== "granted") {
      stopDetection();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
      return;
    }

    let isMounted = true;

    if (!poseLandmarkerRef.current) {
      createPoseLandmarker()
        .then((poseLandmarker) => {
          if (!isMounted || !videoElementRef.current || !enabledRef.current) {
            poseLandmarker.close();
            return;
          }
          poseLandmarkerRef.current = poseLandmarker;
          startDetectionLoop();
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize PoseLandmarker"
          );
        });
      return () => {
        isMounted = false;
      };
    } else if (enabledRef.current && videoElementRef.current) {
      startDetectionLoop();
    }

    return () => {
      isMounted = false;
      stopDetection();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, [
    videoElement,
    enabled,
    permissionStatus,
    stopDetection,
    startDetectionLoop,
  ]);

  const startDetection = useCallback(() => {
    if (
      enabledRef.current &&
      videoElementRef.current &&
      poseLandmarkerRef.current
    ) {
      startDetectionLoop();
    }
  }, [startDetectionLoop]);

  const stopDetectionManual = useCallback(() => {
    stopDetection();
  }, [stopDetection]);

  return {
    isDetecting,
    error,
    startDetection,
    stopDetection: stopDetectionManual,
    currentMetrics,
  };
}
