"use client";

import { Email, Task } from "@/types";
import { highlightText } from "@/utils/highlightText";
import styles from "./ResultItem.module.scss";

interface ResultItemProps {
  type: "email" | "task";
  item: Email | Task;
  query?: string;
  onClick: () => void;
  isFocused?: boolean;
}

export function ResultItem({
  type,
  item,
  query,
  onClick,
  isFocused = false,
}: ResultItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  if (type === "email") {
    const email = item as Email;
    const bodyPreview = truncateText(email.body, 100);

    return (
      <div
        className={`${styles.resultItem} ${isFocused ? styles.focused : ""}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className={styles.icon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 5l-8 6-8-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.content}>
          <div className={styles.title}>
            {highlightText(email.subject, query)}
          </div>
          <div className={styles.preview}>
            {highlightText(bodyPreview, query)}
          </div>
          <div className={styles.metadata}>
            <span className={styles.sender}>
              {highlightText(email.from, query)}
            </span>
            <span className={styles.separator}>•</span>
            <span className={styles.timestamp}>
              {formatTimestamp(email.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Task result
  const task = item as Task;
  const descriptionPreview = task.description
    ? truncateText(task.description, 100)
    : task.project;

  return (
    <div
      className={`${styles.resultItem} ${isFocused ? styles.focused : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={styles.icon}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16l8-4 8 4V4a2 2 0 0 0-2-2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{highlightText(task.title, query)}</div>
        <div className={styles.preview}>
          {highlightText(descriptionPreview, query)}
        </div>
        <div className={styles.metadata}>
          <span className={styles.project}>
            {highlightText(task.project, query)}
          </span>
          {task.dueDate && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.dueDate}>
                {formatDueDate(task.dueDate)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Format timestamp for display (e.g., "2 hours ago", "Yesterday", "Jan 15")
 */
function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Format due date for display (e.g., "Due today", "Due tomorrow", "Due Jan 15")
 */
function formatDueDate(dueDate: Date): string {
  const date = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffMs = taskDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return "Due today";
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else if (diffDays === -1) {
    return "Due yesterday";
  } else if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${
      Math.abs(diffDays) === 1 ? "" : "s"
    }`;
  } else if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  }
}
