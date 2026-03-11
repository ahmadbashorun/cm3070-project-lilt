"use client";

import { useState } from "react";
import Link from "next/link";
import DetectionSettings from "@/components/Settings/DetectionSettings";
import DataImport from "@/components/Settings/DataImport";
import styles from "./page.module.scss";
import DataExport from "@/components/Settings/DataExport";

export default function SettingsPage(): React.ReactElement {
  const [activeSection, setActiveSection] = useState<
    "detection" | "import" | "export"
  >("detection");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className={styles.content}>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${
              activeSection === "detection" ? styles.active : ""
            }`}
            onClick={() => {
              setActiveSection("detection");
            }}
            type="button"
          >
            Detection Settings
          </button>
          <button
            className={`${styles.navItem} ${
              activeSection === "import" ? styles.active : ""
            }`}
            onClick={() => {
              setActiveSection("import");
            }}
            type="button"
          >
            Data Import
          </button>
          <button
            className={`${styles.navItem} ${
              activeSection === "export" ? styles.active : ""
            }`}
            onClick={() => {
              setActiveSection("export");
            }}
            type="button"
          >
            Data Export
          </button>
        </nav>

        <div className={styles.section}>
          {activeSection === "detection" && <DetectionSettings />}
          {activeSection === "import" && <DataImport />}
          {activeSection === "export" && <DataExport />}
        </div>
      </div>
    </div>
  );
}
