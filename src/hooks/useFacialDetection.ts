"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FaceLandmarker, NormalizedLandmark } from "@/types/mediapipe";
import { createFaceLandmarker } from "@/utils/mediapipeConfig";
import { extractFacialMetrics } from "@/utils/facialDetection";
import { useStressStore } from "@/store/stressStore";

interface UseFacialDetectionReturn {
  isDetecting: boolean;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
  currentMetrics: {
    eyeAspectRatio: number;
    mouthAspectRatio: number;
    browPosition: number;
    headPose: { yaw: number; pitch: number; roll: number };
  } | null;
}

function getMonitoringFps(stressLevel: number): number {
  return stressLevel >= 2 ? 10 : stressLevel === 1 ? 5 : 2;
}

export function useFacialDetection(
  videoElement: HTMLVideoElement | null,
  enabled: boolean = true,
  permissionStatus: "granted" | "denied" | "prompt" | "unavailable" = "prompt"
): UseFacialDetectionReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] =
    useState<UseFacialDetectionReturn["currentMetrics"]>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(videoElement);
  const enabledRef = useRef<boolean>(enabled);
  const stressLevelRef = useRef<number>(useStressStore.getState().currentLevel);
  const lastFrameTimeRef = useRef<number>(0);
  const isDetectingRef = useRef(false);
  const frameRequestRef = useRef<number | null>(null);
  const prevMetricsRef =
    useRef<UseFacialDetectionReturn["currentMetrics"]>(null);
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
      const landmarker = faceLandmarkerRef.current;
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
        console.log("[useFacialDetection] Video not ready");
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      let result;
      try {
        const timestamp = performance.now();
        result = landmarker.detectForVideo(video, timestamp);
      } catch {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const firstLandmark = result.faceLandmarks[0];
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

      let metrics;
      try {
        metrics = extractFacialMetrics(landmarks);
      } catch {
        frameRequestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Only update state if metrics have actually changed to prevent infinite loops
      const prevMetrics = prevMetricsRef.current;
      const hasChanged =
        !prevMetrics ||
        prevMetrics.eyeAspectRatio !== metrics.eyeAspectRatio ||
        prevMetrics.mouthAspectRatio !== metrics.mouthAspectRatio ||
        prevMetrics.browPosition !== metrics.browPosition ||
        prevMetrics.headPose.yaw !== metrics.headPose.yaw ||
        prevMetrics.headPose.pitch !== metrics.headPose.pitch ||
        prevMetrics.headPose.roll !== metrics.headPose.roll;

      if (hasChanged) {
        setCurrentMetrics(metrics);
        setDetectionInputs({ facial: metrics });
        prevMetricsRef.current = metrics;
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
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
      return;
    }

    let isMounted = true;

    if (!faceLandmarkerRef.current) {
      createFaceLandmarker()
        .then((faceLandmarker) => {
          if (!isMounted || !videoElementRef.current || !enabledRef.current) {
            faceLandmarker.close();
            return;
          }
          faceLandmarkerRef.current = faceLandmarker;
          startDetectionLoop();
        })
        .catch((err: unknown) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to initialize FaceLandmarker";
          setError(errorMessage);
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
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
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
      faceLandmarkerRef.current
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
