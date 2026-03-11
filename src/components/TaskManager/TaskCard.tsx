"use client";

import type { Task } from "@/types";
import { isTaskDueToday, getProjectIcon } from "@/utils/taskUtils";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { HiOutlineUserGroup } from "react-icons/hi2";
import styles from "./TaskCard.module.scss";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  simplified?: boolean;
}

export default function TaskCard({
  task,
  onClick,
  simplified = false,
}: TaskCardProps): React.ReactElement {
  const priorityClass = task.priority.toLowerCase();
  const projectIconType = getProjectIcon(task.project);

  const renderProjectIcon = (): React.ReactElement => {
    switch (projectIconType) {
      case "wrench":
        return <HiOutlineWrenchScrewdriver className={styles.projectIcon} />;
      case "users":
        return <HiOutlineUserGroup className={styles.projectIcon} />;
      case "building":
      default:
        return <HiOutlineBuildingOffice2 className={styles.projectIcon} />;
    }
  };

  return (
    <div
      className={`${styles.card} ${simplified ? styles.simplified : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <h3 className={styles.title}>{task.title}</h3>
      <div className={styles.meta}>
        <div className={styles.projectContainer}>
          {renderProjectIcon()}
          <span className={styles.projectName}>{task.project}</span>
        </div>
      </div>
      <div className={styles.priorityContainer}>
        <span className={`${styles.priority} ${styles[priorityClass]}`}>
          {task.priority}
        </span>
        {isTaskDueToday(task) && (
          <div className={styles.dueToday}>
            <span className={styles.redDot}></span>
            <span>Due today</span>
          </div>
        )}
      </div>
    </div>
  );
}
