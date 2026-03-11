"use client";

import styles from "./DataExport.module.scss";

export default function DataExport(): React.ReactElement {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Export Data</h2>
      <p className={styles.description}>
        Download your stress detection data and adaptation history.
      </p>
      <button className={styles.exportButton} type="button">
        Export as CSV
      </button>
    </div>
  );
}
