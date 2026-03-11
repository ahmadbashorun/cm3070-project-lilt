"use client";

import styles from "./EmailEmptyState.module.scss";

interface EmailEmptyStateProps {
  folderName: string;
}

export default function EmailEmptyState({
  folderName,
}: EmailEmptyStateProps): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.emptyState}>No mails yet for {folderName}</div>
    </div>
  );
}
