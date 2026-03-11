"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types";
import styles from "./AddEditTaskForm.module.scss";

interface AddEditTaskFormProps {
  task?: Task | null;
  onSave: (task: Omit<Task, "id">) => void;
  onCancel: () => void;
}

export default function AddEditTaskForm({
  task,
  onSave,
  onCancel,
}: AddEditTaskFormProps): React.ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("P2");
  const [dueDate, setDueDate] = useState<string>("");
  const [project, setProject] = useState("");
  const [source, setSource] = useState<Task["source"]>("internal");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0] ?? ""
          : ""
      );
      setProject(task.project);
      setSource(task.source);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      project: project.trim() || "Uncategorized",
      source,
      assignee: task?.assignee || "Current User",
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className={styles.saveButton}>
          {task ? "Update" : "Create"} Task
        </button>
      </div>
    </form>
  );
}
