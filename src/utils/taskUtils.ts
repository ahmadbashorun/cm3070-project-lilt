import type { Task, StressLevel } from "@/types";

export function calculateTaskPriority(task: Task): number {
  const priorityMap: Record<string, number> = {
    P0: 100,
    P1: 75,
    P2: 50,
    P3: 25,
  };

  const priorityScore = priorityMap[task.priority] || 0;
  const dueDateScore = task.dueDate ? calculateDueDateScore(task.dueDate) : 0;
  const sourceScore = task.source === "external" ? 20 : 0;

  return priorityScore * 0.5 + dueDateScore * 0.3 + sourceScore * 0.2;
}

function calculateDueDateScore(dueDate: Date): number {
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0) return 100;
  if (diffHours < 2) return 90;
  if (diffHours < 8) return 70;
  if (diffDays < 1) return 50;
  if (diffDays < 3) return 30;
  if (diffDays < 7) return 15;
  return 5;
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  const today = new Date();
  const due = new Date(task.dueDate);
  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

export function getTaskStatusColumns(level: StressLevel): string[] {
  switch (level) {
    case 0:
      return ["backlog", "ready", "in-progress", "review", "done"];
    case 1:
      return ["ready", "in-progress", "review"];
    default:
      return ["backlog", "ready", "in-progress", "review", "done"];
  }
}

export function normalizeTaskStatus(
  status: Task["status"]
): "backlog" | "ready" | "in-progress" | "review" | "done" {
  if (status === "todo") return "backlog";
  if (status === "completed") return "done";
  if (
    status === "backlog" ||
    status === "ready" ||
    status === "in-progress" ||
    status === "review" ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    status === "done"
  ) {
    return status;
  }
  return "backlog";
}

export function filterTasksByStress(tasks: Task[], level: StressLevel): Task[] {
  switch (level) {
    case 0:
      return tasks;
    case 1:
      return tasks.filter(
        (task) =>
          task.status !== "backlog" &&
          task.status !== "done" &&
          task.status !== "completed" &&
          task.status !== "todo"
      );
    case 2:
    case 3: {
      const sorted = tasks
        .map((task) => ({
          task,
          priority: calculateTaskPriority(task),
        }))
        .sort((a, b) => b.priority - a.priority);
      return sorted.slice(0, level === 2 ? 10 : 3).map((item) => item.task);
    }
    case 4:
      return [];
    default:
      return tasks;
  }
}

export function groupTasksByDueDate(tasks: Task[]): {
  dueToday: Task[];
  others: Task[];
} {
  const dueToday: Task[] = [];
  const others: Task[] = [];

  tasks.forEach((task) => {
    if (isTaskDueToday(task)) {
      dueToday.push(task);
    } else {
      others.push(task);
    }
  });

  return {
    dueToday: dueToday.sort(
      (a, b) => calculateTaskPriority(b) - calculateTaskPriority(a)
    ),
    others: others.sort(
      (a, b) => calculateTaskPriority(b) - calculateTaskPriority(a)
    ),
  };
}

export function groupTasksByStatus(tasks: Task[]): {
  inProgress: Task[];
  ready: Task[];
  review: Task[];
} {
  const inProgress: Task[] = [];
  const ready: Task[] = [];
  const review: Task[] = [];

  tasks.forEach((task) => {
    const normalized = normalizeTaskStatus(task.status);
    if (normalized === "in-progress") {
      inProgress.push(task);
    } else if (normalized === "ready") {
      ready.push(task);
    } else if (normalized === "review") {
      review.push(task);
    }
  });

  return {
    inProgress: inProgress.sort(
      (a, b) => calculateTaskPriority(b) - calculateTaskPriority(a)
    ),
    ready: ready.sort(
      (a, b) => calculateTaskPriority(b) - calculateTaskPriority(a)
    ),
    review: review.sort(
      (a, b) => calculateTaskPriority(b) - calculateTaskPriority(a)
    ),
  };
}

export function getProjectIcon(
  project: string
): "building" | "wrench" | "users" {
  const projectLower = project.toLowerCase();
  if (
    projectLower.includes("product roadmap") ||
    projectLower.includes("roadmap")
  ) {
    return "building";
  }
  if (projectLower.includes("design") || projectLower.includes("revision")) {
    return "wrench";
  }
  if (projectLower.includes("user") || projectLower.includes("review")) {
    return "users";
  }
  return "building";
}
