"use client";

import styles from "./TaskEmptyState.module.scss";

interface TaskEmptyStateProps {
  viewName: string;
}

export default function TaskEmptyState({
  viewName,
}: TaskEmptyStateProps): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.emptyState}>
        No tasks to display {viewName ? `for ${viewName}` : ""}
      </div>
    </div>
  );
}
