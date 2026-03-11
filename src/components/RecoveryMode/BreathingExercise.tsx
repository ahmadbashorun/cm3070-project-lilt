"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { breathingCircleVariants } from "@/utils/animations";
import styles from "./BreathingExercise.module.scss";

interface BreathingExerciseProps {
  onComplete: () => void;
}

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

export default function BreathingExercise({
  onComplete,
}: BreathingExerciseProps): React.ReactElement {
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [cycle, setCycle] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const phases: { phase: BreathingPhase; duration: number }[] = [
      { phase: "inhale", duration: 4000 },
      { phase: "hold", duration: 7000 },
      { phase: "exhale", duration: 8000 },
      { phase: "rest", duration: 2000 },
    ];

    const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
    const totalExerciseDuration = totalDuration * 3;
    const intervalMs = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += intervalMs;

      if (elapsed >= totalExerciseDuration) {
        setCycle(3);
        setOverallProgress(1);
        clearInterval(interval);
        return;
      }

      const overallProgressValue = elapsed / totalExerciseDuration;
      setOverallProgress(Math.min(1, overallProgressValue));

      const cycleNumber = Math.floor(elapsed / totalDuration);
      const cycleElapsed = elapsed % totalDuration;
      setCycle(Math.min(cycleNumber, 2));

      let phaseStart = 0;
      let currentPhaseIndex = 0;
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        if (!phase) continue;
        if (cycleElapsed < phaseStart + phase.duration) {
          currentPhaseIndex = i;
          break;
        }
        phaseStart += phase.duration;
      }

      const currentPhase = phases[currentPhaseIndex];
      if (currentPhase) {
        setPhase(currentPhase.phase);
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const currentVariant =
    phase === "inhale" ? "inhale" : phase === "hold" ? "hold" : "exhale";

  const handleComplete = (): void => {
    onComplete();
  };

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${overallProgress * 100}%` }}
        />
      </div>

      <div className={styles.content}>
        <motion.div
          className={styles.circle}
          variants={breathingCircleVariants}
          animate={currentVariant}
          initial="exhale"
        />

        <p className={styles.instruction}>
          Nothing requires your attention right now, just take deep breathes.
        </p>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          App adapted to manage critical stress
        </p>
        {cycle >= 3 ? (
          <button className={styles.completeButton} onClick={handleComplete}>
            Complete
          </button>
        ) : (
          <button className={styles.completeButton} onClick={handleComplete}>
            Restore default
          </button>
        )}
      </div>
    </div>
  );
}
