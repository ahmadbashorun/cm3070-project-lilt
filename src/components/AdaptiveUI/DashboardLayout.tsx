"use client";

import { ReactNode, useState } from "react";
import { useStressStore } from "@/store/stressStore";
import HeaderBar from "@/components/Shared/HeaderBar";
import EmailSidebar from "@/components/EmailInterface/EmailSidebar";
import type { EmailFolder } from "@/types";
import TaskSidebar, { TaskView } from "@/components/TaskManager/TaskSidebar";
import RestoreDefaultBanner from "@/components/Shared/RestoreDefaultBanner";
import PermissionBanner from "@/components/Shared/PermissionBanner";
import FABControlPanel from "./FABControlPanel";
import ComposeCreateModal from "@/components/Shared/ComposeCreateModal";
import StressMonitoringPanel from "./StressMonitoringPanel";
import StressMonitoringToggle from "./StressMonitoringToggle";
import styles from "./DashboardLayout.module.scss";
import { useGlobalSearch } from "@/store/searchStore";
import { useDashboardLayoutContext } from "@/contexts/DashboardLayoutContext";

interface DashboardLayoutProps {
  children: ReactNode;
  selectedTab: "email" | "tasks";
  onTabChange: (tab: "email" | "tasks") => void;
  selectedEmailFolder: EmailFolder | null;
  onEmailFolderSelect: (folder: EmailFolder) => void;
  selectedTaskView: TaskView | null;
  onTaskViewSelect: (view: TaskView) => void;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps): React.ReactElement {
  const {
    selectedTab,
    onTabChange,
    selectedEmailFolder,
    onEmailFolderSelect,
    selectedTaskView,
    onTaskViewSelect,
  } = useDashboardLayoutContext();
  const currentLevel = useStressStore((state) => state.currentLevel);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [isStressMonitoringOpen, setIsStressMonitoringOpen] = useState(false);

  const { openSearch } = useGlobalSearch();

  const handleComposeClick = (): void => {
    setIsComposeModalOpen(true);
  };

  const handleSearchClick = (): void => {
    openSearch();
  };

  const handleCloseModal = (): void => {
    setIsComposeModalOpen(false);
  };

  return (
    <div className={`${styles.container} ${styles[`level${currentLevel}`]}`}>
      <HeaderBar
        selectedTab={selectedTab}
        onTabChange={onTabChange}
        onComposeClick={handleComposeClick}
        onSearchClick={handleSearchClick}
      />
      <div className={styles.contentWrapper}>
        {currentLevel <= 1 &&
          (selectedTab === "tasks" ? (
            <TaskSidebar
              selectedView={selectedTaskView}
              onViewSelect={onTaskViewSelect}
            />
          ) : (
            <EmailSidebar
              selectedFolder={selectedEmailFolder}
              onFolderSelect={onEmailFolderSelect}
            />
          ))}
        <main className={styles.main}>{children}</main>
      </div>
      <PermissionBanner />
      <RestoreDefaultBanner />
      <FABControlPanel />
      <StressMonitoringToggle
        onClick={() => {
          setIsStressMonitoringOpen(true);
        }}
      />
      <ComposeCreateModal
        isOpen={isComposeModalOpen}
        onClose={handleCloseModal}
        type={selectedTab === "email" ? "email" : "task"}
      />
      <StressMonitoringPanel
        isOpen={isStressMonitoringOpen}
        onClose={() => {
          setIsStressMonitoringOpen(false);
        }}
      />
    </div>
  );
}
