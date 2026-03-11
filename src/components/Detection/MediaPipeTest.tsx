"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import type {
  FaceLandmarker,
  PoseLandmarker,
  NormalizedLandmark,
} from "@/types/mediapipe";
import {
  createFaceLandmarker,
  createPoseLandmarker,
} from "@/utils/mediapipeConfig";
import { useFacialDetection } from "@/hooks/useFacialDetection";
import { usePostureDetection } from "@/hooks/usePostureDetection";
import {
  drawFaceLandmarks,
  drawPoseLandmarks,
  clearCanvas,
} from "@/utils/mediapipeDrawing";
import styles from "./MediaPipeTest.module.scss";

export default function MediaPipeTest(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [postureDetectionEnabled, setPostureDetectionEnabled] = useState(true);
  const [faceLandmarks, setFaceLandmarks] = useState<
    NormalizedLandmark[] | null
  >(null);
  const [poseLandmarks, setPoseLandmarks] = useState<
    NormalizedLandmark[] | null
  >(null);
  const [faceCount, setFaceCount] = useState(0);
  const [poseCount, setPoseCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState({
    face: false,
    pose: false,
  });

  const lastFpsTime = useRef<number>(0);
  const frameCount = useRef<number>(0);

  // Use existing hooks for metrics
  const facialDetection = useFacialDetection(
    videoRef.current,
    faceDetectionEnabled,
    "granted"
  );
  const postureDetection = usePostureDetection(
    videoRef.current,
    postureDetectionEnabled,
    "granted"
  );

  // Initialize landmarkers
  useEffect(() => {
    let isMounted = true;

    const initializeLandmarkers = async () => {
      try {
        setModelLoading({ face: true, pose: true });
        const [faceLandmarker, poseLandmarker] = await Promise.all([
          createFaceLandmarker(),
          createPoseLandmarker(),
        ]);

        if (!isMounted) {
          faceLandmarker.close();
          poseLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;
        poseLandmarkerRef.current = poseLandmarker;
        setModelLoading({ face: false, pose: false });
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to initialize MediaPipe models";
        setError(errorMessage);
        setModelLoading({ face: false, pose: false });
      }
    };

    void initializeLandmarkers();

    return () => {
      isMounted = false;
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle webcam ready
  useEffect(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
      setCameraReady(true);
    }
  }, []);

  // Drawing loop
  const drawLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    const poseLandmarker = poseLandmarkerRef.current;

    if (!video || !canvas || (!faceLandmarker && !poseLandmarker)) {
      animationFrameRef.current = requestAnimationFrame(drawLoop);
      return;
    }

    // Check video readiness
    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      animationFrameRef.current = requestAnimationFrame(drawLoop);
      return;
    }

    // Clear canvas
    clearCanvas(canvas);

    // Face detection
    if (faceDetectionEnabled && faceLandmarker) {
      try {
        const result = faceLandmarker.detectForVideo(video, performance.now());
        const faceCount = result.faceLandmarks.length;
        setFaceCount(faceCount);

        if (faceCount > 0 && result.faceLandmarks[0]) {
          const landmarks = result.faceLandmarks[0];
          setFaceLandmarks(landmarks);
          drawFaceLandmarks(
            canvas,
            landmarks,
            video.videoWidth,
            video.videoHeight
          );
        } else {
          setFaceLandmarks(null);
        }
      } catch (err) {
        console.warn("Face detection error:", err);
      }
    } else {
      setFaceCount(0);
      setFaceLandmarks(null);
    }

    // Pose detection
    if (postureDetectionEnabled && poseLandmarker) {
      try {
        const result = poseLandmarker.detectForVideo(video, performance.now());
        const poseCount = result.landmarks.length;
        setPoseCount(poseCount);

        if (poseCount > 0 && result.landmarks[0]) {
          const landmarks = result.landmarks[0];
          setPoseLandmarks(landmarks);
          drawPoseLandmarks(
            canvas,
            landmarks,
            video.videoWidth,
            video.videoHeight
          );
        } else {
          setPoseLandmarks(null);
        }
      } catch (err) {
        console.warn("Pose detection error:", err);
      }
    } else {
      setPoseCount(0);
      setPoseLandmarks(null);
    }

    // Calculate FPS
    frameCount.current += 1;
    const now = performance.now();
    if (now - lastFpsTime.current >= 1000) {
      setFps(frameCount.current);
      frameCount.current = 0;
      lastFpsTime.current = now;
    }

    animationFrameRef.current = requestAnimationFrame(drawLoop);
  }, [faceDetectionEnabled, postureDetectionEnabled]);

  // Start drawing loop when ready
  useEffect(() => {
    if (cameraReady && !modelLoading.face && !modelLoading.pose) {
      drawLoop();
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cameraReady, modelLoading, drawLoop]);

  const handleUserMedia = useCallback(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
      setCameraReady(true);
    }
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    let message = "Failed to access webcam.";
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        message = "Camera access denied. Please grant permission.";
      } else if (error.name === "NotFoundError") {
        message = "No camera found.";
      } else if (error.name === "NotReadableError") {
        message = "Camera is already in use.";
      }
    }
    setError(message);
    setCameraReady(false);
  }, []);

  const videoInfo = videoRef.current
    ? {
        readyState: videoRef.current.readyState,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      }
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>MediaPipe Detection Test</h1>
        <p className={styles.subtitle}>
          Test face and posture detection with live visualization
        </p>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <div className={styles.videoContainer}>
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user",
              }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className={styles.webcam}
            />
            <canvas ref={canvasRef} className={styles.canvas} />
            {!cameraReady && (
              <div className={styles.overlayMessage}>
                <p>Waiting for camera...</p>
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              onClick={() => {
                setFaceDetectionEnabled(!faceDetectionEnabled);
              }}
              className={`${styles.toggleButton} ${
                faceDetectionEnabled ? styles.active : styles.inactive
              }`}
            >
              {faceDetectionEnabled
                ? "Face Detection Enabled"
                : "Face Detection"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPostureDetectionEnabled(!postureDetectionEnabled);
              }}
              className={`${styles.toggleButton} ${
                postureDetectionEnabled ? styles.active : styles.inactive
              }`}
            >
              {postureDetectionEnabled
                ? "Posture Detection Enabled"
                : "Posture Detection"}
            </button>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.statusPanel}>
            <h2>Status</h2>
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
                <span className={styles.label}>Face Model:</span>
                <span
                  className={
                    modelLoading.face
                      ? styles.statusLoading
                      : faceLandmarkerRef.current
                      ? styles.statusActive
                      : styles.statusInactive
                  }
                >
                  {modelLoading.face
                    ? "Loading..."
                    : faceLandmarkerRef.current
                    ? "Loaded"
                    : "Not Loaded"}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Pose Model:</span>
                <span
                  className={
                    modelLoading.pose
                      ? styles.statusLoading
                      : poseLandmarkerRef.current
                      ? styles.statusActive
                      : styles.statusInactive
                  }
                >
                  {modelLoading.pose
                    ? "Loading..."
                    : poseLandmarkerRef.current
                    ? "Loaded"
                    : "Not Loaded"}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>FPS:</span>
                <span className={styles.statusValue}>{fps}</span>
              </div>
            </div>
          </div>

          <div className={styles.detectionPanel}>
            <h2>Detection Results</h2>
            <div className={styles.detectionGrid}>
              <div className={styles.detectionItem}>
                <span className={styles.label}>Faces Detected:</span>
                <span
                  className={
                    faceCount > 0 ? styles.detected : styles.notDetected
                  }
                >
                  {faceCount}
                </span>
              </div>
              <div className={styles.detectionItem}>
                <span className={styles.label}>Poses Detected:</span>
                <span
                  className={
                    poseCount > 0 ? styles.detected : styles.notDetected
                  }
                >
                  {poseCount}
                </span>
              </div>
              <div className={styles.detectionItem}>
                <span className={styles.label}>Face Landmarks:</span>
                <span className={styles.statusValue}>
                  {faceLandmarks ? faceLandmarks.length : 0}
                </span>
              </div>
              <div className={styles.detectionItem}>
                <span className={styles.label}>Pose Landmarks:</span>
                <span className={styles.statusValue}>
                  {poseLandmarks ? poseLandmarks.length : 0}
                </span>
              </div>
            </div>
          </div>

          {videoInfo && (
            <div className={styles.debugPanel}>
              <h2>Video Debug Info</h2>
              <div className={styles.debugGrid}>
                <div className={styles.debugItem}>
                  <span className={styles.label}>Ready State:</span>
                  <span className={styles.statusValue}>
                    {videoInfo.readyState}
                  </span>
                </div>
                <div className={styles.debugItem}>
                  <span className={styles.label}>Dimensions:</span>
                  <span className={styles.statusValue}>
                    {videoInfo.width} × {videoInfo.height}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorPanel}>
              <h2>Error</h2>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          {facialDetection.error && (
            <div className={styles.errorPanel}>
              <h2>Face Detection Error</h2>
              <p className={styles.errorMessage}>{facialDetection.error}</p>
            </div>
          )}

          {postureDetection.error && (
            <div className={styles.errorPanel}>
              <h2>Posture Detection Error</h2>
              <p className={styles.errorMessage}>{postureDetection.error}</p>
            </div>
          )}

          {facialDetection.currentMetrics && (
            <div className={styles.metricsPanel}>
              <h2>Facial Metrics</h2>
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Eye Aspect Ratio:</span>
                  <span className={styles.metricValue}>
                    {facialDetection.currentMetrics.eyeAspectRatio.toFixed(3)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>
                    Mouth Aspect Ratio:
                  </span>
                  <span className={styles.metricValue}>
                    {facialDetection.currentMetrics.mouthAspectRatio.toFixed(3)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Brow Position:</span>
                  <span className={styles.metricValue}>
                    {facialDetection.currentMetrics.browPosition.toFixed(3)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Head Yaw:</span>
                  <span className={styles.metricValue}>
                    {facialDetection.currentMetrics.headPose.yaw.toFixed(1)}°
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Head Pitch:</span>
                  <span className={styles.metricValue}>
                    {facialDetection.currentMetrics.headPose.pitch.toFixed(1)}°
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Head Roll:</span>
                  <span className={styles.metricValue}>
                    {facialDetection.currentMetrics.headPose.roll.toFixed(1)}°
                  </span>
                </div>
              </div>
            </div>
          )}

          {postureDetection.currentMetrics && (
            <div className={styles.metricsPanel}>
              <h2>Posture Metrics</h2>
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Lean Angle:</span>
                  <span className={styles.metricValue}>
                    {postureDetection.currentMetrics.leanAngle.toFixed(2)}°
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Shoulder Tension:</span>
                  <span className={styles.metricValue}>
                    {postureDetection.currentMetrics.shoulderTension.toFixed(3)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Head Drop:</span>
                  <span className={styles.metricValue}>
                    {postureDetection.currentMetrics.headDrop.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
