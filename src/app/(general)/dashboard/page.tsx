"use client";

import EmailDetailView from "@/components/EmailInterface/EmailDetailView";
import EmailList from "@/components/EmailInterface/EmailList";
// import type { EmailFolder } from "@/types";
import TaskEmptyState from "@/components/TaskManager/TaskEmptyState";
import TaskInterface from "@/components/TaskManager/TaskInterface";
import { TaskView } from "@/components/TaskManager/TaskSidebar";
import { useDashboardLayoutContext } from "@/contexts/DashboardLayoutContext";
import { useStressStore } from "@/store/stressStore";

export default function DashboardPage(): React.ReactElement {
  const currentLevel = useStressStore((state) => state.currentLevel);

  const dashboardLayoutProps = useDashboardLayoutContext();

  // const getFolderDisplayName = (folder: EmailFolder): string => {
  //   const names: Record<EmailFolder, string> = {
  //     inbox: "Inbox",
  //     starred: "Starred",
  //     scheduled: "Scheduled",
  //     sent: "Sent",
  //     drafts: "Drafts",
  //     spam: "Spam",
  //     trash: "Trash",
  //   };
  //   return names[folder];
  // };

  const getViewDisplayName = (view: TaskView): string => {
    const names: Record<TaskView, string> = {
      "my-tasks": "My tasks",
      starred: "Starred",
      "all-tasks": "All tasks",
      projects: "Projects",
      team: "Team",
    };
    return names[view];
  };

  const renderEmailContent = () => {
    if (currentLevel === 3) {
      return <EmailDetailView />;
    }
    // EmailList now handles folder filtering internally
    return <EmailList />;
  };

  const renderTaskContent = () => {
    if (
      dashboardLayoutProps.selectedTaskView === "all-tasks" ||
      dashboardLayoutProps.selectedTaskView === "projects" ||
      dashboardLayoutProps.selectedTaskView === "team"
    ) {
      return (
        <TaskEmptyState
          viewName={getViewDisplayName(dashboardLayoutProps.selectedTaskView)}
        />
      );
    }
    return <TaskInterface />;
  };

  return (
    <>
      {dashboardLayoutProps.selectedTab === "email"
        ? renderEmailContent()
        : renderTaskContent()}
    </>
  );
}
