import { useState, useCallback } from "react";
import { EmailFolder } from "@/components/EmailInterface/EmailSidebar";
import { TaskView } from "@/components/TaskManager/TaskSidebar";

interface UseDashboardLayoutOptions {
  initialTab?: "email" | "tasks";
  initialEmailFolder?: EmailFolder | null;
  initialTaskView?: TaskView | null;
  onTabChange?: (tab: "email" | "tasks") => void;
  onEmailFolderSelect?: (folder: EmailFolder) => void;
  onTaskViewSelect?: (view: TaskView) => void;
}

export function useDashboardLayout(options: UseDashboardLayoutOptions = {}) {
  const {
    initialTab = "email",
    initialEmailFolder = null,
    initialTaskView = null,
    onTabChange: externalOnTabChange,
    onEmailFolderSelect: externalOnEmailFolderSelect,
    onTaskViewSelect: externalOnTaskViewSelect,
  } = options;

  const [selectedTab, setSelectedTab] = useState<"email" | "tasks">(initialTab);
  const [selectedEmailFolder, setSelectedEmailFolder] =
    useState<EmailFolder | null>(initialEmailFolder);
  const [selectedTaskView, setSelectedTaskView] = useState<TaskView | null>(
    initialTaskView
  );

  const handleTabChange = useCallback(
    (tab: "email" | "tasks") => {
      setSelectedTab(tab);
      if (tab === "email") {
        setSelectedEmailFolder("inbox");
      } else {
        setSelectedTaskView("my-tasks");
      }
      externalOnTabChange?.(tab);
    },
    [externalOnTabChange]
  );

  const handleEmailFolderSelect = useCallback(
    (folder: EmailFolder) => {
      setSelectedEmailFolder(folder);
      externalOnEmailFolderSelect?.(folder);
    },
    [externalOnEmailFolderSelect]
  );

  const handleTaskViewSelect = useCallback(
    (view: TaskView) => {
      setSelectedTaskView(view);
      externalOnTaskViewSelect?.(view);
    },
    [externalOnTaskViewSelect]
  );

  return {
    selectedTab,
    onTabChange: handleTabChange,
    selectedEmailFolder,
    onEmailFolderSelect: handleEmailFolderSelect,
    selectedTaskView,
    onTaskViewSelect: handleTaskViewSelect,
  };
}
