"use client";

import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePermissionStore } from "@/store/permissionStore";
import styles from "./PermissionBanner.module.scss";

export default function PermissionBanner(): React.ReactElement | null {
  const detectionPreferences = useOnboardingStore(
    (state) => state.detectionPreferences
  );
  const cameraPermission = usePermissionStore(
    (state) => state.cameraPermission
  );
  const checkCameraPermission = usePermissionStore(
    (state) => state.checkCameraPermission
  );
  const [dismissed, setDismissed] = useState(false);

  const needsCamera =
    detectionPreferences.posture || detectionPreferences.facialExpression;
  const needsPermission = needsCamera && cameraPermission !== "granted";
  const showBanner =
    needsPermission && !dismissed && cameraPermission !== "unavailable";

  useEffect(() => {
    if (cameraPermission === "granted") {
      setDismissed(false);
    }
  }, [cameraPermission]);

  if (!showBanner) {
    return null;
  }

  const handleRequestPermission = async (): Promise<void> => {
    try {
      if (
        typeof navigator !== "undefined" &&
        "mediaDevices" in navigator &&
        "getUserMedia" in navigator.mediaDevices
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        await checkCameraPermission();
      }
    } catch (err) {
      const error = err as DOMException;
      if (error.name === "NotAllowedError") {
        // Permission denied - user needs to enable in browser settings
        console.warn("Camera permission denied");
      }
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
  };

  const getMessage = (): string => {
    if (detectionPreferences.posture && detectionPreferences.facialExpression) {
      return "Camera access is needed for posture and facial expression detection.";
    }
    if (detectionPreferences.posture) {
      return "Camera access is needed for posture detection.";
    }
    return "Camera access is needed for facial expression detection.";
  };

  return (
    <div className={styles.banner}>
      <div className={styles.messageContainer}>
        <p className={styles.text}>{getMessage()}</p>
        {cameraPermission === "denied" && (
          <p className={styles.hint}>
            Please enable camera access in your browser settings.
          </p>
        )}
      </div>
      <div className={styles.actions}>
        {cameraPermission !== "denied" && (
          <button
            className={styles.enableButton}
            onClick={() => void handleRequestPermission()}
            type="button"
          >
            Enable Camera
          </button>
        )}
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
