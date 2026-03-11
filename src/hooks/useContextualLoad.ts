"use client";

import { useEffect, useRef, useState } from "react";
import { useDataStore } from "@/store/dataStore";
import { useStressStore } from "@/store/stressStore";
import type { ContextualLoad } from "@/types";

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

import type { Email, Task } from "@/types";

function calculateContextualLoad(
  emails: Email[],
  tasks: Task[],
  sessionStart: Date,
  lastActivity: Date,
  taskSwitches: number
): ContextualLoad {
  const now = new Date();

  const unreadEmails = emails.filter((e) => !e.read).length;
  const urgentTasks = tasks.filter(
    (t) => t.priority === "P0" || (t.dueDate && isToday(t.dueDate))
  ).length;
  const incompleteTasks = tasks.filter(
    (t) => t.status !== "done" && t.status !== "completed"
  ).length;

  const deadlinePressure = tasks.reduce((sum, task) => {
    if (!task.dueDate) return sum;
    const hoursUntilDue =
      (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue < 0) return sum + 30;
    if (hoursUntilDue < 2) return sum + 25;
    if (hoursUntilDue < 8) return sum + 15;
    if (hoursUntilDue < 24) return sum + 5;
    return sum;
  }, 0);

  const externalTasks = tasks.filter((t) => t.source === "external").length;
  const externalTaskRatio = tasks.length > 0 ? externalTasks / tasks.length : 0;

  const sessionDuration = (now.getTime() - sessionStart.getTime()) / 1000;
  const idleTime = (now.getTime() - lastActivity.getTime()) / 1000;
  const taskSwitchRate =
    sessionDuration > 0 ? taskSwitches / (sessionDuration / 600) : 0;

  const contextLoad = Math.min(
    100,
    (unreadEmails / 50) * 30 +
      (urgentTasks / 5) * 30 +
      (taskSwitchRate / 10) * 20 +
      externalTaskRatio * 20
  );

  return {
    unreadEmails,
    urgentTasks,
    taskSwitchRate,
    incompleteTasks,
    deadlinePressure,
    externalTaskRatio,
    sessionDuration,
    idleTime,
    contextLoad,
  };
}

export function useContextualLoad(enabled: boolean = true): {
  trackTabSwitch: (tab: string) => void;
} {
  const emails = useDataStore((state) => state.emails);
  const tasks = useDataStore((state) => state.tasks);
  const setDetectionInputs = useStressStore(
    (state) => state.setDetectionInputs
  );
  const [sessionStart] = useState(new Date());
  const [lastActivity, setLastActivity] = useState(new Date());
  const [taskSwitches, setTaskSwitches] = useState(0);
  const lastTabRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const updateContext = () => {
      const context = calculateContextualLoad(
        emails,
        tasks,
        sessionStart,
        lastActivity,
        taskSwitches
      );
      setDetectionInputs({ context });
    };

    updateContext();

    const interval = setInterval(updateContext, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [
    enabled,
    emails,
    tasks,
    sessionStart,
    lastActivity,
    taskSwitches,
    setDetectionInputs,
  ]);

  useEffect(() => {
    if (!enabled) return;

    const updateActivity = () => {
      setLastActivity(new Date());
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [enabled]);

  return {
    trackTabSwitch: (tab: string) => {
      if (lastTabRef.current !== null && lastTabRef.current !== tab) {
        setTaskSwitches((prev) => prev + 1);
      }
      lastTabRef.current = tab;
    },
  };
}
