"use client";

import { useEffect } from "react";
import type { Task } from "@/types";
import styles from "./TaskDetailModal.module.scss";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onEdit,
}: TaskDetailModalProps): React.ReactElement | null {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) {
    return null;
  }

  const priorityClass = task.priority.toLowerCase();

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={styles.header}>
          <h2 id="task-modal-title" className={styles.title}>
            {task.title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Project</span>
              <span className={styles.metaValue}>{task.project}</span>
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
            {task.dueDate && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Due Date</span>
                <span className={styles.metaValue}>
                  {task.dueDate.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          {task.description && (
            <div className={styles.description}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p>{task.description}</p>
            </div>
          )}
        </div>
        <div className={styles.footer}>
          {onEdit && (
            <button
              className={styles.editButton}
              onClick={onEdit}
              type="button"
            >
              Edit
            </button>
          )}
          <button
            className={styles.closeButtonFooter}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
