"use client";

import { useEffect, useState } from "react";
import { useStressStore } from "@/store/stressStore";
import styles from "./CameraFallback.module.scss";

export default function CameraFallback(): React.ReactElement | null {
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const setCameraAvailableStore = useStressStore(
    (state) => state.setCameraAvailable
  );

  useEffect(() => {
    async function checkCamera() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(
          (device) => device.kind === "videoinput"
        );
        setCameraAvailable(hasCamera);
        setCameraAvailableStore(hasCamera);
      } catch (error) {
        console.error("Error checking camera:", error);
        setCameraAvailable(false);
        setCameraAvailableStore(false);
      }
    }

    void checkCamera();
  }, [setCameraAvailableStore]);

  if (cameraAvailable === null) {
    return null;
  }

  if (cameraAvailable) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.warning}>
        <span className={styles.icon}>⚠️</span>
        <div className={styles.content}>
          <h3 className={styles.title}>Camera Unavailable</h3>
          <p className={styles.message}>
            Your camera is not available. Lilt will continue monitoring using
            keyboard and mouse patterns only. Stress detection accuracy may be
            reduced.
          </p>
        </div>
      </div>
    </div>
  );
}
