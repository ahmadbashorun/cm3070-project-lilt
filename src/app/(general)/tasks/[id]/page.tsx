"use client";

import TaskDetail from "@/components/TaskManager/TaskDetail";
import { useDataStore } from "@/store/dataStore";
import { useStressStore } from "@/store/stressStore";
import { addItem as addRecentItem } from "@/utils/recentItemsTracker";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import styles from "./page.module.scss";

/**
 * Task Detail Page
 *
 * Displays the full task content using the TaskDetail component.
 * Works across all stress levels (0-4).
 * Updates RecentItemsTracker on page load.
 * Handles 404 when task ID doesn't exist.
 *
 * Route: /tasks/[id]
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const tasks = useDataStore((state) => state.tasks);
  const currentLevel = useStressStore((state) => state.currentLevel);

  // Find the task by ID
  const task = useMemo(() => {
    return tasks.find((t) => t.id === taskId);
  }, [tasks, taskId]);

  // Update recent items tracker when task is found
  useEffect(() => {
    if (task) {
      addRecentItem(task, "task");
    }
  }, [task]);

  // Handle 404 - task not found
  if (!task) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Task Not Found</h1>
          <p>
            The task you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <button
            type="button"
            onClick={() => { router.push("/dashboard?tab=tasks"); }}
            className={styles.backButton}
            aria-label="Return to Tasks"
          >
            ← Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  // For stress level 3, use the existing TaskDetail component
  if (currentLevel === 3) {
    return <TaskDetail taskId={taskId} />;
  }

  // For other stress levels (0, 1, 2, 4), render a simplified detail view
  const formatDate = (date: Date | null): string => {
    if (!date) return "No due date";
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "P0":
        return styles.p0 || "";
      case "P1":
        return styles.p1 || "";
      case "P2":
        return styles.p2 || "";
      case "P3":
        return styles.p3 || "";
      default:
        return "";
    }
  };

  const getStatusDisplay = (status: string): string => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={() => { router.push("/dashboard?tab=tasks"); }}
          className={styles.backButton}
          aria-label="Back to Tasks"
        >
          ← Back to Tasks
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.taskHeader}>
          <h1 className={styles.title}>{task.title}</h1>

          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Project</span>
                <span className={styles.metaValue}>{task.project}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Assignee</span>
                <span className={styles.metaValue}>{task.assignee}</span>
              </div>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Due Date</span>
                <span className={styles.metaValue}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Status</span>
                <span className={styles.metaValue}>
                  {getStatusDisplay(task.status)}
                </span>
              </div>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Priority</span>
                <span
                  className={`${styles.priority} ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Source</span>
                <span className={styles.metaValue}>
                  {task.source === "external" ? "External" : "Internal"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {task.description && (
          <div className={styles.description}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.descriptionText}>{task.description}</p>
          </div>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className={styles.subtasks}>
            <h2 className={styles.sectionTitle}>Subtasks</h2>
            <ul className={styles.subtaskList}>
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className={styles.subtaskItem}>
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    readOnly
                    className={styles.subtaskCheckbox}
                  />
                  <span className={subtask.completed ? styles.completed : ""}>
                    {subtask.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.actionButton} type="button">
            Edit Task
          </button>
          <button className={styles.actionButton} type="button">
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}
