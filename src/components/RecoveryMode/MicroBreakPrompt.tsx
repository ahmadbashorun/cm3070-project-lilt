"use client";

import { useState, useEffect } from "react";
import { useStressStore } from "@/store/stressStore";
import styles from "./MicroBreakPrompt.module.scss";

interface MicroBreakPromptProps {
  onTakeBreak: () => void;
}

export default function MicroBreakPrompt({
  onTakeBreak,
}: MicroBreakPromptProps): React.ReactElement | null {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const [show, setShow] = useState(false);
  const [_timeInStress, setTimeInStress] = useState(0);

  useEffect(() => {
    if (currentLevel >= 2 && currentLevel <= 3) {
      const interval = setInterval(() => {
        setTimeInStress((prev) => {
          const newTime = prev + 1;
          if (newTime >= 1200 && !show) {
            setShow(true);
          }
          return newTime;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setTimeInStress(0);
      setShow(false);
      return undefined;
    }
  }, [currentLevel, show]);

  const handleDismiss = (): void => {
    setShow(false);
    setTimeInStress(0);
  };

  if (!show || currentLevel < 2) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.prompt}>
        <h3 className={styles.title}>Take a moment</h3>
        <p className={styles.message}>
          You&apos;ve been working under stress. Consider taking a brief break:
        </p>
        <ul className={styles.suggestions}>
          <li>💧 Hydrate - Drink some water</li>
          <li>🏃 Stretch - Move around for a minute</li>
          <li>😌 Breathe - Take a few deep breaths</li>
        </ul>
        <div className={styles.actions}>
          <button
            className={styles.breakButton}
            onClick={onTakeBreak}
            type="button"
          >
            Take break now
          </button>
          <button
            className={styles.dismissButton}
            onClick={handleDismiss}
            type="button"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
