"use client";

import styles from "./TaskGuidancePanel.module.scss";

interface TaskGuidancePanelProps {
  remainingTasksCount: number;
  onTakeBreak: () => void;
  onGuidedBreak: () => void;
}

export default function TaskGuidancePanel({
  remainingTasksCount,
  onTakeBreak,
  onGuidedBreak,
}: TaskGuidancePanelProps): React.ReactElement {
  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <p className={styles.guidanceText}>
          {remainingTasksCount > 0 ? (
            <>
              Two more urgent tasks left to attend to and you can take a{" "}
              <button
                className={styles.linkButton}
                onClick={onTakeBreak}
                type="button"
              >
                well deserved break
              </button>{" "}
              or you can take a{" "}
              <button
                className={styles.linkButton}
                onClick={onGuidedBreak}
                type="button"
              >
                short guided break now
              </button>
              .
            </>
          ) : (
            <>
              All urgent tasks are handled. You can take a{" "}
              <button
                className={styles.linkButton}
                onClick={onTakeBreak}
                type="button"
              >
                well deserved break
              </button>
              .
            </>
          )}
        </p>
      </div>
      <div className={styles.navigation}>
        <button className={styles.navButton} type="button">
          Prev
        </button>
        <button className={styles.navButton} type="button">
          Next
        </button>
      </div>
    </div>
  );
}
