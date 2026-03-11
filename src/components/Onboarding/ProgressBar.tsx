"use client";

import { motion } from "framer-motion";
import styles from "./ProgressBar.module.scss";

interface ProgressBarProps {
  progress: number;
  totalSteps: number;
  currentStep: number;
}

export default function ProgressBar({
  progress,
}: ProgressBarProps): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.barContainer}>
        <motion.div
          className={styles.bar}
          initial={{ width: 0 }}
          animate={{ width: `${String(Math.round(progress))}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
