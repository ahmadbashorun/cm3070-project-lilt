"use client";

import { useStressStore } from "@/store/stressStore";
import styles from "./StressMonitoringToggle.module.scss";
import { HiOutlineChartBarSquare } from "react-icons/hi2";

interface StressMonitoringToggleProps {
  onClick: () => void;
}

export default function StressMonitoringToggle({
  onClick,
}: StressMonitoringToggleProps): React.ReactElement {
  const currentLevel = useStressStore((state) => state.currentLevel);

  return (
    <button
      className={`${styles.toggle} ${styles[`level${currentLevel}`]}`}
      onClick={onClick}
      aria-label="Open stress monitoring chart"
      type="button"
    >
      <HiOutlineChartBarSquare />
    </button>
  );
}
