"use client";

import { createContext, useContext, ReactNode } from "react";
import type { EmailFolder } from "@/types";
import { TaskView } from "@/components/TaskManager/TaskSidebar";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

interface DashboardLayoutContextValue {
  selectedTab: "email" | "tasks";
  onTabChange: (tab: "email" | "tasks") => void;
  selectedEmailFolder: EmailFolder | null;
  onEmailFolderSelect: (folder: EmailFolder) => void;
  selectedTaskView: TaskView | null;
  onTaskViewSelect: (view: TaskView) => void;
}

const DashboardLayoutContext =
  createContext<DashboardLayoutContextValue | null>(null);

interface DashboardLayoutProviderProps {
  children: ReactNode;
  initialTab?: "email" | "tasks";
  initialEmailFolder?: EmailFolder | null;
  initialTaskView?: TaskView | null;
  onTabChange?: (tab: "email" | "tasks") => void;
  onEmailFolderSelect?: (folder: EmailFolder) => void;
  onTaskViewSelect?: (view: TaskView) => void;
}

export function DashboardLayoutProvider({
  children,
  initialTab,
  initialEmailFolder,
  initialTaskView,
  onTabChange,
  onEmailFolderSelect,
  onTaskViewSelect,
}: DashboardLayoutProviderProps) {
  const value = useDashboardLayout({
    initialTab: initialTab || "email",
    initialEmailFolder: initialEmailFolder || "inbox",
    initialTaskView: initialTaskView || "my-tasks",
    onTabChange: onTabChange || (() => {}),
    onEmailFolderSelect: onEmailFolderSelect || (() => {}),
    onTaskViewSelect: onTaskViewSelect || (() => {}),
  });

  return (
    <DashboardLayoutContext.Provider value={value}>
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayoutContext(): DashboardLayoutContextValue {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error(
      "useDashboardLayoutContext must be used within DashboardLayoutProvider"
    );
  }
  return context;
}
