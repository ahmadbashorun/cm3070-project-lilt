"use client";

import { useState, useEffect } from "react";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import { useUserStore } from "@/store/userStore";
import type { Task } from "@/types";
import styles from "./ComposeCreateModal.module.scss";
import { IoCloseCircleOutline } from "react-icons/io5";
import { SlBulb } from "react-icons/sl";

interface ComposeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "email" | "task";
}

export default function ComposeCreateModal({
  isOpen,
  onClose,
  type,
}: ComposeCreateModalProps): React.ReactElement | null {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const addEmail = useDataStore((state) => state.addEmail);
  const addTask = useDataStore((state) => state.addTask);
  const user = useUserStore((state) => state.user);

  // Email state
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Task state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("P2");
  const [dueDate, setDueDate] = useState<string>("");
  const [project, setProject] = useState("");
  const [source, setSource] = useState<Task["source"]>("internal");

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const resetForm = (): void => {
    setTo("");
    setSubject("");
    setBody("");
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("P2");
    setDueDate("");
    setProject("");
    setSource("internal");
  };

  const handleSendEmail = (): void => {
    if (to && subject && body) {
      const newEmail = {
        id: Date.now().toString(),
        from: user?.email || "currentuser@example.com",
        subject: subject.trim(),
        body: body.trim(),
        timestamp: new Date(),
        read: false,
        priority: 0.5,
        senderImportance: 0.5,
        projectRelevance: 0.5,
        deadlineProximity: 0.5,
        urgency: 0.5,
        folder: "sent" as const,
      };
      addEmail(newEmail);
      resetForm();
      onClose();
    }
  };

  const handleCreateTask = (): void => {
    if (title.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim() || "",
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        project: project.trim() || "Uncategorized",
        source,
        assignee: user?.name || "Current User",
      };
      addTask(newTask);
      resetForm();
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEmail = type === "email";
  const canSubmit = isEmail ? to && subject && body : title.trim().length > 0;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={-1}
      aria-label="Close modal"
    >
      <div
        className={`${styles.modal} ${styles[`level${currentLevel}`]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-modal-title"
      >
        <div className={styles.header}>
          <h2 id="compose-modal-title" className={styles.title}>
            {isEmail ? "Compose Email" : "Create Task"}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <IoCloseCircleOutline />
          </button>
        </div>

        <div className={styles.content}>
          {isEmail ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="to">
                  To
                </label>
                <input
                  id="to"
                  name="email-to"
                  type="email"
                  autoComplete="email"
                  className={styles.input}
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                  }}
                  placeholder="recipient@example.com"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  className={styles.input}
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                  }}
                  placeholder="Email subject"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="body">
                  Message
                </label>
                <textarea
                  id="body"
                  className={styles.textarea}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                  }}
                  placeholder={
                    currentLevel >= 2
                      ? "Type your message..."
                      : "Type your message here. Keep it concise and clear."
                  }
                  rows={currentLevel >= 2 ? 8 : 12}
                />
              </div>

              {currentLevel >= 3 && (
                <div className={styles.assistance}>
                  <SlBulb />
                  <span>
                    Take a moment to breathe. We can help you draft this later.
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                  required
                  placeholder="Enter task title"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  rows={4}
                  placeholder="Enter task description"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className={styles.select}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as Task["status"]);
                    }}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="ready">Ready</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className={styles.select}
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value as Task["priority"]);
                    }}
                  >
                    <option value="P0">P0 - Critical</option>
                    <option value="P1">P1 - High</option>
                    <option value="P2">P2 - Medium</option>
                    <option value="P3">P3 - Low</option>
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="dueDate">
                    Due Date
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    className={styles.input}
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                    }}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="project">
                    Project
                  </label>
                  <input
                    id="project"
                    type="text"
                    className={styles.input}
                    value={project}
                    onChange={(e) => {
                      setProject(e.target.value);
                    }}
                    placeholder="Enter project name"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="source">
                  Source
                </label>
                <select
                  id="source"
                  className={styles.select}
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value as Task["source"]);
                  }}
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.submitButton}
            onClick={isEmail ? handleSendEmail : handleCreateTask}
            disabled={!canSubmit}
            type="button"
          >
            {isEmail ? "Send" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
