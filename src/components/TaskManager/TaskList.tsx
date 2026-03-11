"use client";

import { useMemo, useState } from "react";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import {
  filterTasksByStress,
  groupTasksByDueDate,
  groupTasksByStatus,
} from "@/utils/taskUtils";
import TaskCard from "./TaskCard";
import styles from "./TaskList.module.scss";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  Announcements,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types";
import {
  createTaskDragId,
  extractTaskIdFromDragId,
  mapDropIdToStatus,
  createSectionDropId,
} from "@/utils/dragAndDrop";

type DueDateTab = "dueToday" | "others";

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

function SortableTaskCard({
  task,
  onClick,
}: SortableTaskCardProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: createTaskDragId(task.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`Drag task ${task.title}`}
      aria-describedby={`task-${task.id}-description`}
      tabIndex={0}
    >
      <TaskCard task={task} simplified onClick={onClick} />
      <span id={`task-${task.id}-description`} className="sr-only">
        Press space or enter to start dragging, use arrow keys to reorder
      </span>
    </div>
  );
}

interface DroppableSectionProps {
  id: string;
  section: string;
  children: React.ReactNode;
}

function DroppableSection({
  id,
  section,
  children,
}: DroppableSectionProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getSectionLabel = (sectionName: string): string => {
    const labels: Record<string, string> = {
      "in-progress": "IN PROGRESS",
      ready: "READY",
      review: "REVIEW",
    };
    return labels[sectionName] || sectionName.toUpperCase();
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.section} ${isOver ? styles.dragOver : ""}`}
      role="region"
      aria-label={`${getSectionLabel(section)} section`}
    >
      {children}
    </div>
  );
}

export default function TaskList(): React.ReactElement {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const router = useRouter();
  const tasks = useDataStore((state) => state.tasks);
  const updateTask = useDataStore((state) => state.updateTask);
  const [selectedTab, setSelectedTab] = useState<DueDateTab>("dueToday");
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
      if (over.id.toString().startsWith("section-")) {
        const sectionName = over.id.toString().replace("section-", "");
        const sectionLabels: Record<string, string> = {
          "in-progress": "IN PROGRESS",
          ready: "READY",
          review: "REVIEW",
        };
        const sectionLabel = sectionLabels[sectionName] || sectionName;
        return task
          ? `Dragging ${task.title} over ${sectionLabel} section`
          : `Dragging over ${sectionLabel} section`;
      }
      return task ? `Dragging ${task.title}` : "Dragging task";
    },
    onDragEnd({ active, over }) {
      if (!over) return "Drag cancelled";
      const taskId = extractTaskIdFromDragId(active.id as string);
      const task = filteredTasks.find((t) => t.id === taskId);
      if (over.id.toString().startsWith("section-")) {
        const sectionName = over.id.toString().replace("section-", "");
        const sectionLabels: Record<string, string> = {
          "in-progress": "IN PROGRESS",
          ready: "READY",
          review: "REVIEW",
        };
        const sectionLabel = sectionLabels[sectionName] || sectionName;
        return task
          ? `Moved ${task.title} to ${sectionLabel} section`
          : `Task moved to ${sectionLabel} section`;
      }
      return task ? `Reordered ${task.title}` : "Task reordered";
    },
    onDragCancel() {
      return "Drag cancelled";
    },
  };

  const filteredTasks = useMemo(() => {
    return filterTasksByStress(tasks, currentLevel);
  }, [currentLevel, tasks]);

  const groupedByDueDate = useMemo(() => {
    return groupTasksByDueDate(filteredTasks);
  }, [filteredTasks]);

  const groupedByStatus = useMemo(() => {
    const tasks =
      selectedTab === "dueToday"
        ? groupedByDueDate.dueToday
        : groupedByDueDate.others;
    return groupTasksByStatus(tasks);
  }, [selectedTab, groupedByDueDate]);

  const displayedTasks =
    selectedTab === "dueToday"
      ? groupedByDueDate.dueToday
      : groupedByDueDate.others;

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
    const overId = over.id as string;

    // Check if dropped on a section (moving between sections)
    if (overId.startsWith("section-")) {
      const sectionName = overId.replace("section-", "");
      const newStatus = mapDropIdToStatus(`section-${sectionName}`);

      if (newStatus) {
        updateTask(taskId, { status: newStatus });
      }
      return;
    }

    // Check if reordering within the same section
    const activeTaskId = extractTaskIdFromDragId(active.id as string);
    const overTaskId = extractTaskIdFromDragId(overId);

    if (activeTaskId !== overTaskId) {
      // For now, we just update status if needed
      // In a full implementation, you might want to track order
      const activeTask = filteredTasks.find((t) => t.id === activeTaskId);
      const overTask = filteredTasks.find((t) => t.id === overTaskId);

      if (activeTask && overTask && activeTask.status !== overTask.status) {
        updateTask(activeTaskId, { status: overTask.status });
      }
    }
  };

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    const taskId = extractTaskIdFromDragId(activeId);
    return filteredTasks.find((t) => t.id === taskId) || null;
  }, [activeId, filteredTasks]);

  return (
    <div className={`${styles.container} ${styles[`level${currentLevel}`]}`}>
      <p className={styles.noticeBanner}>
        We have detected some level of stress so your task list has been adapted
        to show only your critical tasks.
      </p>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            selectedTab === "dueToday" ? styles.active : ""
          }`}
          onClick={() => {
            setSelectedTab("dueToday");
          }}
          type="button"
        >
          Due today
        </button>
        <button
          className={`${styles.tab} ${
            selectedTab === "others" ? styles.active : ""
          }`}
          onClick={() => {
            setSelectedTab("others");
          }}
          type="button"
        >
          Others
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
        }}
      >
        <div className={styles.taskList}>
          {groupedByStatus.inProgress.length > 0 && (
            <DroppableSection
              id={createSectionDropId("in-progress")}
              section="in-progress"
            >
              <h2 className={styles.sectionTitle}>
                IN PROGRESS • {groupedByStatus.inProgress.length}
              </h2>
              <SortableContext
                items={groupedByStatus.inProgress.map((task) =>
                  createTaskDragId(task.id)
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.taskGroup}>
                  {groupedByStatus.inProgress.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => {
                        handleTaskClick(task.id);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DroppableSection>
          )}
          {groupedByStatus.ready.length > 0 && (
            <DroppableSection id={createSectionDropId("ready")} section="ready">
              <h2 className={styles.sectionTitle}>
                READY • {groupedByStatus.ready.length}
              </h2>
              <SortableContext
                items={groupedByStatus.ready.map((task) =>
                  createTaskDragId(task.id)
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.taskGroup}>
                  {groupedByStatus.ready.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => {
                        handleTaskClick(task.id);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DroppableSection>
          )}
          {displayedTasks.length === 0 && (
            <div className={styles.emptyState}>No tasks to display</div>
          )}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className={styles.dragOverlay}>
              <TaskCard task={activeTask} simplified />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <p className={styles.encouragement}>
        You&apos;re crushing it, well done!
      </p>
    </div>
  );
}
