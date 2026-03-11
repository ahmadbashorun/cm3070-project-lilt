import type { Task } from "@/types";

/**
 * Maps column/section identifiers to task status values
 */
export function mapDropIdToStatus(dropId: string): Task["status"] | null {
  const statusMap: Record<string, Task["status"]> = {
    backlog: "backlog",
    ready: "ready",
    "in-progress": "in-progress",
    review: "review",
    done: "done",
    "section-in-progress": "in-progress",
    "section-ready": "ready",
    "section-review": "review",
  };

  return statusMap[dropId] || null;
}

/**
 * Maps task status to column/section identifier
 */
export function mapStatusToDropId(status: Task["status"]): string {
  const idMap: Record<string, string> = {
    backlog: "backlog",
    ready: "ready",
    "in-progress": "in-progress",
    review: "review",
    done: "done",
    todo: "backlog",
    completed: "done",
  };

  return idMap[status] || "backlog";
}

/**
 * Creates a draggable task ID
 */
export function createTaskDragId(taskId: string): string {
  return `task-${taskId}`;
}

/**
 * Extracts task ID from draggable ID
 */
export function extractTaskIdFromDragId(dragId: string): string {
  return dragId.replace("task-", "");
}

/**
 * Creates a droppable column ID
 */
export function createColumnDropId(column: string): string {
  return `column-${column}`;
}

/**
 * Creates a droppable section ID
 */
export function createSectionDropId(section: string): string {
  return `section-${section}`;
}

/**
 * Extracts column/section name from drop ID
 */
export function extractDropId(dropId: string): string {
  return dropId.replace("column-", "").replace("section-", "");
}
