"use client";

import { useMemo, useState } from "react";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import {
  filterTasksByStress,
  getTaskStatusColumns,
  normalizeTaskStatus,
} from "@/utils/taskUtils";
import { HiOutlineBars3 } from "react-icons/hi2";
import TaskCard from "./TaskCard";
import styles from "./TaskKanban.module.scss";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  Announcements,
} from "@dnd-kit/core";
import type { Task } from "@/types";
import {
  createTaskDragId,
  extractTaskIdFromDragId,
  extractDropId,
  mapDropIdToStatus,
} from "@/utils/dragAndDrop";

type ViewType = "status" | "list" | "calendar";

interface DroppableColumnProps {
  id: string;
  column: string;
  children: React.ReactNode;
}

function DroppableColumn({
  id,
  column,
  children,
}: DroppableColumnProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getColumnLabel = (status: string): string => {
    const labels: Record<string, string> = {
      backlog: "BACKLOG",
      ready: "READY",
      "in-progress": "IN PROGRESS",
      review: "REVIEW",
      done: "DONE",
    };
    return labels[status] || status.toUpperCase();
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.dragOver : ""}`}
      role="region"
      aria-label={`${getColumnLabel(column)} column`}
    >
      {children}
    </div>
  );
}

interface DraggableTaskCardProps {
  taskId: string;
  task: Task;
  onClick: () => void;
}

function DraggableTaskCard({
  taskId,
  task,
  onClick,
}: DraggableTaskCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: createTaskDragId(taskId),
      data: {
        type: "task",
        task,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? styles.dragging : ""}`}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`Drag task ${task.title}`}
      aria-describedby={`task-${taskId}-description`}
      tabIndex={0}
    >
      <TaskCard task={task} onClick={onClick} />
      <span id={`task-${taskId}-description`} className="sr-only">
        Press space or enter to start dragging, use arrow keys to move between
        columns
      </span>
    </div>
  );
}

export default function TaskKanban(): React.ReactElement {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const tasks = useDataStore((state) => state.tasks);
  const updateTask = useDataStore((state) => state.updateTask);
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>("status");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const announcements: Announcements = {
    onDragStart({ active }) {
      const taskId = extractTaskIdFromDragId(active.id as string);
      const task = filteredTasks.find((t) => t.id === taskId);
      return task
        ? `Started dragging task ${task.title}`
        : "Started dragging task";
    },
    onDragOver({ active, over }) {
      if (!over) return "";
      const taskId = extractTaskIdFromDragId(active.id as string);
      const task = filteredTasks.find((t) => t.id === taskId);
      const columnLabel = getColumnLabel(extractDropId(over.id as string));
      return task
        ? `Dragging ${task.title} over ${columnLabel} column`
        : `Dragging over ${columnLabel} column`;
    },
    onDragEnd({ active, over }) {
      if (!over) return "Drag cancelled";
      const taskId = extractTaskIdFromDragId(active.id as string);
      const task = filteredTasks.find((t) => t.id === taskId);
      const columnLabel = getColumnLabel(extractDropId(over.id as string));
      return task
        ? `Moved ${task.title} to ${columnLabel} column`
        : `Task moved to ${columnLabel} column`;
    },
    onDragCancel() {
      return "Drag cancelled";
    },
  };

  const columns = useMemo(() => {
    return getTaskStatusColumns(currentLevel);
  }, [currentLevel]);

  const filteredTasks = useMemo(() => {
    return filterTasksByStress(tasks, currentLevel);
  }, [currentLevel, tasks]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, typeof filteredTasks> = {};
    columns.forEach((col) => {
      grouped[col] = [];
    });

    filteredTasks.forEach((task) => {
      const normalized = normalizeTaskStatus(task.status);
      if (grouped[normalized]) {
        grouped[normalized].push(task);
      }
    });

    return grouped;
  }, [filteredTasks, columns]);

  const getColumnLabel = (status: string): string => {
    const labels: Record<string, string> = {
      backlog: "BACKLOG",
      ready: "READY",
      "in-progress": "IN PROGRESS",
      review: "REVIEW",
      done: "DONE",
    };
    return labels[status] || status.toUpperCase();
  };

  const handleTaskClick = (taskId: string): void => {
    router.push(`/tasks/${taskId}`);
  };

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = extractTaskIdFromDragId(active.id as string);
    const dropId = over.id as string;
    const newStatus = mapDropIdToStatus(extractDropId(dropId));

    if (newStatus) {
      updateTask(taskId, { status: newStatus });
    }
  };

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    const taskId = extractTaskIdFromDragId(activeId);
    return filteredTasks.find((t) => t.id === taskId) || null;
  }, [activeId, filteredTasks]);

  return (
    <div className={`${styles.container} ${styles[`level${currentLevel}`]}`}>
      {currentLevel <= 1 && (
        <div className={styles.header}>
          <div className={styles.viewOptions}>
            <button
              className={`${styles.viewButton} ${
                currentView === "status" ? styles.active : ""
              }`}
              onClick={() => {
                setCurrentView("status");
              }}
              type="button"
            >
              Status view
            </button>
            <button
              className={`${styles.viewButton} ${
                currentView === "list" ? styles.active : ""
              }`}
              onClick={() => {
                setCurrentView("list");
              }}
              type="button"
            >
              List view
            </button>
            <button
              className={`${styles.viewButton} ${
                currentView === "calendar" ? styles.active : ""
              }`}
              onClick={() => {
                setCurrentView("calendar");
              }}
              type="button"
            >
              Calendar view
            </button>
          </div>
          <button className={styles.filterButton} type="button">
            <HiOutlineBars3 className={styles.filterIcon} />
            Filter
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
        }}
      >
        <motion.div
          className={styles.kanban}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {columns.map((column, colIndex) => {
            const columnTasks = tasksByColumn[column] || [];
            return (
              <DroppableColumn key={column} id={column} column={column}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: colIndex * 0.1 }}
                >
                  <div className={styles.columnHeader}>
                    <h2 className={styles.columnTitle}>
                      {getColumnLabel(column)} • {columnTasks.length}
                    </h2>
                  </div>
                  <div className={styles.columnContent}>
                    <AnimatePresence mode="popLayout">
                      {columnTasks.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            duration: 0.3,
                            delay: taskIndex * 0.05,
                            ease: "easeOut",
                          }}
                        >
                          <DraggableTaskCard
                            taskId={task.id}
                            task={task}
                            onClick={() => {
                              handleTaskClick(task.id);
                            }}
                          />
                        </motion.div>
                      ))}
                      {columnTasks.length === 0 && (
                        <motion.div
                          className={styles.emptyColumn}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          No tasks
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </DroppableColumn>
            );
          })}
        </motion.div>
        <DragOverlay>
          {activeTask ? (
            <div className={styles.dragOverlay}>
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
