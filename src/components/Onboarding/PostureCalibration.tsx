"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import type { PostureBaseline } from "@/types";
import { usePostureCalibration } from "@/hooks/usePostureCalibration";
import styles from "./PostureCalibration.module.scss";
import Image from "next/image";

interface PostureCalibrationProps {
  onComplete: (baseline: PostureBaseline) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
}

const videoConstraints = {
  width: 1024,
  height: 1024,
  facingMode: "user",
};

export default function PostureCalibration({
  onComplete,
  onSkip,
}: PostureCalibrationProps): React.ReactElement {
  const [isEnabled, setIsEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [baseline, setBaseline] = useState<PostureBaseline | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const webcamRef = useRef<Webcam>(null);

  const {
    isCalibrating,
    isInitializing,
    progress,
    error: calibrationError,
    startCalibration,
    stopCalibration,
    getBaseline,
  } = usePostureCalibration(videoElement);

  const displayError = errorMessage || calibrationError;

  const handleWebcamError = (err: string | DOMException): void => {
    let message =
      "Failed to access webcam. Please ensure it's connected and you've granted permission.";
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        message =
          "Camera access denied. Please grant permission in your browser settings.";
      } else if (err.name === "NotFoundError") {
        message = "No camera found on your device.";
      } else if (err.name === "NotReadableError") {
        message = "Camera is already in use by another application or device.";
      } else if (err.name === "OverconstrainedError") {
        message =
          "Camera constraints could not be satisfied. Try different settings.";
      }
    }
    setErrorMessage(message);
    setIsEnabled(false);
  };

  const handleUserMedia = (): void => {
    setIsEnabled(true);
    setErrorMessage(null);
    if (webcamRef.current?.video) {
      setVideoElement(webcamRef.current.video);
    }
  };

  const handleStartCalibration = useCallback((): void => {
    if (!videoElement) return;
    startCalibration();
  }, [startCalibration, videoElement]);

  const handleStopCalibration = useCallback((): void => {
    stopCalibration();
    const calculatedBaseline = getBaseline();
    if (calculatedBaseline) {
      const imageSrc = webcamRef.current?.getScreenshot();
      setCapturedImage(imageSrc || null);
      setBaseline(calculatedBaseline);
      setShowPreview(true);
    } else {
      setErrorMessage("Failed to calculate baseline. Please try again.");
    }
  }, [stopCalibration, getBaseline]);

  useEffect(() => {
    if (!isCalibrating && progress >= 100 && progress > 0) {
      handleStopCalibration();
    }
  }, [isCalibrating, progress, handleStopCalibration]);

  useEffect(() => {
    async function checkCameraPermission() {
      try {
        const permission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        if (permission.state === "granted") {
          setIsEnabled(true);
        }
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          setIsEnabled(true);
        } catch {
          // Camera access not available
        }
      }
    }
    void checkCameraPermission();
  }, []);

  const handleRetake = (): void => {
    setCapturedImage(null);
    setShowPreview(false);
    setBaseline(null);
  };

  const handleProceed = async (): Promise<void> => {
    if (baseline) {
      try {
        await onComplete(baseline);
      } catch (error) {
        console.error("Error completing posture calibration:", error);
      }
    }
  };

  const handleSkip = async (): Promise<void> => {
    try {
      await onSkip();
    } catch (error) {
      console.error("Error skipping posture calibration:", error);
    }
  };

  if (showPreview && capturedImage && baseline) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Review Your Posture Baseline</h1>
        <p className={styles.instructionText}>
          Review your captured posture image and baseline measurements below.
          You can retake the photo if needed.
        </p>
        <div className={styles.previewContainer}>
          <Image
            width={400}
            height={400}
            src={capturedImage}
            alt="Captured posture"
            className={styles.previewImage}
            style={{ height: "auto" }}
          />
        </div>
        <div className={styles.baselineInfo}>
          <div className={styles.baselineItem}>
            <span className={styles.baselineLabel}>Shoulder Position:</span>
            <span className={styles.baselineValue}>
              {(baseline.shoulderY * 100).toFixed(1)}%
            </span>
          </div>
          <div className={styles.baselineItem}>
            <span className={styles.baselineLabel}>Nose Position:</span>
            <span className={styles.baselineValue}>
              {(baseline.noseY * 100).toFixed(1)}%
            </span>
          </div>
          <div className={styles.baselineItem}>
            <span className={styles.baselineLabel}>Lean Angle:</span>
            <span className={styles.baselineValue}>
              {baseline.leanAngle.toFixed(1)}°
            </span>
          </div>
          <div className={styles.baselineItem}>
            <span className={styles.baselineLabel}>Spine Angle:</span>
            <span className={styles.baselineValue}>
              {baseline.spineAngle.toFixed(1)}°
            </span>
          </div>
          <div className={styles.baselineItem}>
            <span className={styles.baselineLabel}>Shoulder Alignment:</span>
            <span className={styles.baselineValue}>
              {baseline.shoulderAlignment.toFixed(3)}
            </span>
          </div>
        </div>
        <p className={styles.hintText}>
          These values represent your baseline posture. Lilt will use them to
          detect changes in your posture during work.
        </p>
        <div className={styles.buttonsContainer}>
          <button
            type="button"
            onClick={handleRetake}
            className={styles.secondaryButton}
          >
            Retake Photo
          </button>
          <button
            type="button"
            onClick={() => void handleProceed()}
            className={styles.button}
          >
            Proceed
          </button>
          <button
            type="button"
            onClick={() => void handleSkip()}
            className={styles.skipLink}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Calibration (Posture)</h1>
      <p className={styles.instructionText}>
        To help Lilt understand your posture, sit in your normal working
        position for 5-8 seconds. Click &quot;Start Calibration&quot; when
        you&apos;re ready.
      </p>
      {/* <div className={styles.hintsContainer}>
        <p className={styles.hintText}>
          <strong>Tips for best results:</strong>
        </p>
        <ul className={styles.hintsList}>
          <li>Sit in your normal working position</li>
          <li>Ensure good lighting so your face and shoulders are visible</li>
          <li>Align the upper half of your body within the frame</li>
          <li>Look straight ahead, maintaining your natural posture</li>
        </ul>
      </div> */}
      {displayError && <p className={styles.errorMessage}>{displayError}</p>}
      {!isEnabled ? (
        <>
          <div className={styles.placeholder}>
            <div className={styles.placeholderBox} />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEnabled(true);
            }}
            className={styles.enableButton}
          >
            Enable Camera
          </button>
        </>
      ) : (
        <>
          <div className={styles.videoContainer}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              onUserMedia={handleUserMedia}
              onUserMediaError={handleWebcamError}
              videoConstraints={videoConstraints}
              height={400}
              className={styles.video}
              onError={() => {
                handleWebcamError("");
              }}
            />
          </div>
          {isInitializing && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Initializing calibration...</p>
            </div>
          )}
          {isCalibrating && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={styles.progressText}>
                Calibrating... {Math.round(progress)}%
              </p>
            </div>
          )}
          {!isInitializing && (
            <p className={styles.alignText}>
              {isCalibrating
                ? "Maintain your normal working position while calibration is in progress."
                : 'Align the upper half of your body within the frame. Click "Start Calibration" when ready.'}
            </p>
          )}
          <div className={styles.buttonsContainer}>
            {!isCalibrating && !isInitializing ? (
              <button
                type="button"
                onClick={handleStartCalibration}
                className={styles.button}
              >
                Start Calibration
              </button>
            ) : isCalibrating ? (
              <button
                type="button"
                onClick={handleStopCalibration}
                className={styles.secondaryButton}
              >
                Stop Calibration
              </button>
            ) : (
              <button type="button" disabled className={styles.button}>
                Loading...
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSkip()}
              className={styles.skipLink}
            >
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
