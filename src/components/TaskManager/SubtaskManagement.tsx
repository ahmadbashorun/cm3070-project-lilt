"use client";

import { useState } from "react";
import type { Subtask } from "@/types";
import styles from "./SubtaskManagement.module.scss";

interface SubtaskManagementProps {
  subtasks: Subtask[];
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (id: string) => void;
}

export default function SubtaskManagement({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
}: SubtaskManagementProps): React.ReactElement {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAdd = (): void => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>SUB TASKS • {subtasks.length}</h3>
        <button className={styles.addButton} onClick={handleAdd} type="button">
          + Add
        </button>
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.input}
          placeholder="Add a subtask"
          value={newSubtaskTitle}
          onChange={(e) => {
            setNewSubtaskTitle(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.subtaskList}>
        {subtasks.map((subtask) => (
          <label key={subtask.id} className={styles.subtaskItem}>
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() => {
                onToggleSubtask(subtask.id);
              }}
              className={styles.checkbox}
            />
            <span
              className={`${styles.subtaskTitle} ${
                subtask.completed ? styles.completed : ""
              }`}
            >
              {subtask.title}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
