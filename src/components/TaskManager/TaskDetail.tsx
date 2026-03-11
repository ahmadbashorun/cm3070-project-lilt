"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import { filterTasksByStress, calculateTaskPriority } from "@/utils/taskUtils";
import TaskGuidancePanel from "./TaskGuidancePanel";
import SubtaskManagement from "./SubtaskManagement";
import type { Subtask } from "@/types";
import styles from "./TaskDetail.module.scss";

interface TaskDetailProps {
  taskId?: string;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}

export default function TaskDetail({ taskId }: TaskDetailProps) {
  const router = useRouter();
  const currentLevel = useStressStore((state) => state.currentLevel);
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    taskId === "1"
      ? [
          { id: "1", title: "Create bar chart", completed: false },
          { id: "2", title: "Create line chart", completed: false },
          { id: "3", title: "Create pie chart", completed: false },
        ]
      : []
  );

  const allTasks = useDataStore((state) => state.tasks);
  const tasks = useMemo(() => {
    return filterTasksByStress(allTasks, currentLevel);
  }, [currentLevel, allTasks]);

  const task = useMemo(() => {
    if (taskId) {
      return tasks.find((t) => t.id === taskId);
    }
    return tasks[0] || null;
  }, [taskId, tasks]);

  const urgentTasksCount = useMemo(() => {
    return tasks.filter(
      (t) => calculateTaskPriority(t) > 70 && t.status !== "done"
    ).length;
  }, [tasks]);

  const handleAddSubtask = (title: string): void => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title,
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const handleToggleSubtask = (id: string): void => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const handleTakeBreak = (): void => {
    useStressStore.setState({ currentLevel: 0 });
  };

  const handleGuidedBreak = (): void => {
    useStressStore.setState({ currentLevel: 4 });
  };

  if (currentLevel !== 3) {
    return null;
  }

  const taskNotInFocusList = Boolean(taskId && !task && tasks.length > 0);
  const noTasksInFocusList = !task && tasks.length === 0;

  if (taskNotInFocusList) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.backBar}>
            <button
              type="button"
              onClick={() => {
                router.push("/dashboard?tab=tasks");
              }}
              className={styles.backButton}
              aria-label="Back to Tasks"
            >
              ← Back to Tasks
            </button>
          </div>
          <div className={styles.emptyState} role="status" aria-live="polite">
            <h2 className={styles.emptyStateTitle}>
              This task isn&apos;t in your focus list right now
            </h2>
            <p className={styles.emptyStateBody}>
              We&apos;ve detected high stress, so we&apos;re showing only your
              top 3 priority tasks to reduce overload. This task is outside that
              list. You can view your focused tasks or take a break to see more.
            </p>
            <div className={styles.emptyStateActions}>
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard?tab=tasks");
                }}
                className={styles.backButton}
                aria-label="View my focused tasks"
              >
                View my focused tasks
              </button>
              <button
                type="button"
                onClick={handleTakeBreak}
                className={styles.emptyStateSecondaryButton}
                aria-label="Take a break to lower stress"
              >
                Take a break
              </button>
            </div>
          </div>
        </div>
        <TaskGuidancePanel
          remainingTasksCount={urgentTasksCount}
          onTakeBreak={handleTakeBreak}
          onGuidedBreak={handleGuidedBreak}
        />
      </div>
    );
  }

  if (noTasksInFocusList) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.backBar}>
            <button
              type="button"
              onClick={() => {
                router.push("/dashboard?tab=tasks");
              }}
              className={styles.backButton}
              aria-label="Back to Tasks"
            >
              ← Back to Tasks
            </button>
          </div>
          <div className={styles.emptyState} role="status" aria-live="polite">
            <h2 className={styles.emptyStateTitle}>
              No tasks in your focus list
            </h2>
            <p className={styles.emptyStateBody}>
              At high stress we limit the view to your top 3 priority tasks.
              There are none in your list right now. Consider taking a break or
              checking back later when you&apos;re ready.
            </p>
            <div className={styles.emptyStateActions}>
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard?tab=tasks");
                }}
                className={styles.backButton}
                aria-label="Back to Tasks"
              >
                Back to Tasks
              </button>
              <button
                type="button"
                onClick={handleTakeBreak}
                className={styles.emptyStateSecondaryButton}
                aria-label="Take a break to lower stress"
              >
                Take a break
              </button>
            </div>
          </div>
        </div>
        <TaskGuidancePanel
          remainingTasksCount={urgentTasksCount}
          onTakeBreak={handleTakeBreak}
          onGuidedBreak={handleGuidedBreak}
        />
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const priorityClass = task.priority.toLowerCase();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.backBar}>
          <button
            type="button"
            onClick={() => {
              router.push("/dashboard?tab=tasks");
            }}
            className={styles.backButton}
            aria-label="Back to Tasks"
          >
            ← Back to Tasks
          </button>
        </div>
        <div className={styles.header}>
          <h1 className={styles.title}>{task.title}</h1>
          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Project</span>
              <span className={styles.metaValue}>{task.project}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Due</span>
              <span className={styles.metaValue}>
                {task.dueDate ? formatDate(task.dueDate) : "No due date"}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <span className={styles.metaValue}>{task.status}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority</span>
              <span className={`${styles.priority} ${styles[priorityClass]}`}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        {task.description && (
          <div className={styles.description}>
            <p>{task.description}</p>
          </div>
        )}

        <SubtaskManagement
          subtasks={subtasks}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
        />

        <div className={styles.activity}>
          <div className={styles.activityHeader}>
            <h3 className={styles.activityTitle}>Activity</h3>
            <button className={styles.addButton} type="button">
              + Add
            </button>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityAvatar}>A</div>
            <div className={styles.activityContent}>
              <p className={styles.activityText}>
                Great job so far by{" "}
                <span className={styles.activityAuthor}>Colin Samir</span> •{" "}
                <span className={styles.activityTime}>2hrs ago</span>
              </p>
            </div>
          </div>
          <div className={styles.commentInput}>
            <input
              type="text"
              placeholder="Leave a comment"
              className={styles.input}
            />
            <button className={styles.sendButton} type="button">
              Send
            </button>
          </div>
        </div>
      </div>

      <TaskGuidancePanel
        remainingTasksCount={urgentTasksCount}
        onTakeBreak={handleTakeBreak}
        onGuidedBreak={handleGuidedBreak}
      />
    </div>
  );
}
