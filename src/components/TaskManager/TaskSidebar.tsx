"use client";

import { useMemo } from "react";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import {
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import styles from "./TaskSidebar.module.scss";

export type TaskView =
  | "my-tasks"
  | "starred"
  | "all-tasks"
  | "projects"
  | "team";

interface TaskSidebarProps {
  selectedView: TaskView | null;
  onViewSelect: (view: TaskView) => void;
}

export default function TaskSidebar({
  selectedView,
  onViewSelect,
}: TaskSidebarProps) {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const tasks = useDataStore((state) => state.tasks);

  const myTasksCount = useMemo(() => {
    return tasks.filter((task) => task.assignee === "Current User").length;
  }, [tasks]);

  if (currentLevel >= 1) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>You</h3>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${
              selectedView === "my-tasks" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onViewSelect("my-tasks");
            }}
          >
            <HiOutlineCheckCircle className={styles.navIcon} />
            <span className={styles.navLabel}>My tasks</span>
            <span className={styles.count}>{myTasksCount}</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedView === "starred" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onViewSelect("starred");
            }}
          >
            <HiOutlineStar className={styles.navIcon} />
            <span className={styles.navLabel}>Starred</span>
          </button>
        </nav>
      </section>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Your Team</h3>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${
              selectedView === "all-tasks" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onViewSelect("all-tasks");
            }}
          >
            <HiOutlineDocumentText className={styles.navIcon} />
            <span className={styles.navLabel}>All tasks</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedView === "projects" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onViewSelect("projects");
            }}
          >
            <HiOutlineBuildingOffice2 className={styles.navIcon} />
            <span className={styles.navLabel}>Projects</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedView === "team" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onViewSelect("team");
            }}
          >
            <HiOutlineUserGroup className={styles.navIcon} />
            <span className={styles.navLabel}>Team</span>
          </button>
        </nav>
      </section>
    </aside>
  );
}
