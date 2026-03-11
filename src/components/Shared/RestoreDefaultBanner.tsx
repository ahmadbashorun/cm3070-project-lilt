"use client";

import { useStressStore } from "@/store/stressStore";
import styles from "./RestoreDefaultBanner.module.scss";

const stressMessages: Record<number, string> = {
  0: "",
  1: "We've detected mild stress. The interface has been subtly adjusted to help you stay calm and focused.",
  2: "Moderate stress detected. We're simplifying your view to show only what needs attention right now.",
  3: "High stress detected. We're focusing on a single task to help you manage the pressure.",
  4: "Critical stress level. Take a moment to breathe. We've simplified everything to help you recover.",
};

const stressGuidance: Record<number, string> = {
  0: "",
  1: "Consider taking a short break. Your work will be here when you return.",
  2: "Focus on one task at a time. You've got this.",
  3: "Take a deep breath. Let's focus on what's most important right now.",
  4: "It's okay to pause. Your wellbeing matters more than any task.",
};

export default function RestoreDefaultBanner(): React.ReactElement | null {
  const currentLevel = useStressStore((state) => state.currentLevel);

  if (currentLevel === 0) {
    return null;
  }

  const handleRestore = (): void => {
    useStressStore.setState({ currentLevel: 0 });
  };

  return (
    <div className={styles.banner}>
      <div className={styles.messageContainer}>
        <p className={styles.text}>{stressMessages[currentLevel]}</p>
        {stressGuidance[currentLevel] && (
          <p className={styles.guidance}>{stressGuidance[currentLevel]}</p>
        )}
      </div>
      <button
        className={styles.restoreLink}
        onClick={handleRestore}
        type="button"
      >
        Restore default
      </button>
    </div>
  );
}
