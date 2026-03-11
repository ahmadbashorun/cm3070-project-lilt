"use client";

import DashboardLayout from "@/components/AdaptiveUI/DashboardLayout";
import DetectionOrchestrator from "@/components/Detection/DetectionOrchestrator";
import type { EmailFolder } from "@/types";
import BreathingExercise from "@/components/RecoveryMode/BreathingExercise";
import MicroBreakPrompt from "@/components/RecoveryMode/MicroBreakPrompt";
import { TaskView } from "@/components/TaskManager/TaskSidebar";
import {
  DashboardLayoutProvider,
  useDashboardLayoutContext,
} from "@/contexts/DashboardLayoutContext";
import { useContextualLoad } from "@/hooks/useContextualLoad";
import { useStressCalculation } from "@/hooks/useStressCalculation";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useStressStore } from "@/store/stressStore";
import { useUserStore } from "@/store/userStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";

const VALID_EMAIL_FOLDERS: readonly EmailFolder[] = [
  "inbox",
  "starred",
  "scheduled",
  "sent",
  "drafts",
  "spam",
  "trash",
];

const VALID_TASK_VIEWS: readonly TaskView[] = [
  "my-tasks",
  "starred",
  "all-tasks",
  "projects",
  "team",
];

function isValidEmailFolder(value: string | null): value is EmailFolder {
  if (value === null) return false;
  return VALID_EMAIL_FOLDERS.includes(value as EmailFolder);
}

function isValidTaskView(value: string | null): value is TaskView {
  if (value === null) return false;
  return VALID_TASK_VIEWS.includes(value as TaskView);
}

import { Suspense } from "react";

function GeneralLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLevel = useStressStore((state) => state.currentLevel);
  const detectionPreferences = useOnboardingStore(
    (state) => state.detectionPreferences
  );
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const webcamRef = useRef<Webcam>(null);

  const urlTab = searchParams.get("tab");
  const urlFolder = searchParams.get("folder");
  const urlView = searchParams.get("view");

  const { initialTab, initialEmailFolder, initialTaskView } = useMemo(() => {
    let tab: "email" | "tasks" = "email";
    if (urlTab === "tasks") tab = "tasks";
    else if (urlTab === "email") tab = "email";
    else if (urlView) tab = "tasks";
    else if (urlFolder) tab = "email";

    let emailFolder: EmailFolder | null = null;
    if (urlFolder && isValidEmailFolder(urlFolder)) {
      emailFolder = urlFolder;
    } else if (tab === "email") {
      emailFolder = "inbox";
    }

    let taskView: TaskView | null = null;
    if (urlView && isValidTaskView(urlView)) {
      taskView = urlView;
    } else if (tab === "tasks") {
      taskView = "my-tasks";
    }

    return {
      initialTab: tab,
      initialEmailFolder: emailFolder,
      initialTaskView: taskView,
    };
  }, [urlTab, urlFolder, urlView]);

  useStressCalculation(true);

  const { trackTabSwitch } = useContextualLoad(true);
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser().catch((error: unknown) => {
      console.error("Failed to fetch user:", error);
    });
  }, [fetchUser]);

  const handleEmailFolderSelect = useCallback(
    (folder: EmailFolder) => {
      router.push(`/dashboard?tab=email&folder=${folder}`);
    },
    [router]
  );

  const handleTaskViewSelect = useCallback(
    (view: TaskView) => {
      router.push(`/dashboard?tab=tasks&view=${view}`);
    },
    [router]
  );

  const handleUserMedia = useCallback(() => {
    if (webcamRef.current?.video) {
      setVideoElement(webcamRef.current.video);
    }
  }, []);

  const shouldShowBreathing = useMemo(
    () => currentLevel === 4 || showBreathingExercise,
    [currentLevel, showBreathingExercise]
  );

  const needsCamera = useMemo(
    () => detectionPreferences.posture || detectionPreferences.facialExpression,
    [detectionPreferences.posture, detectionPreferences.facialExpression]
  );

  const handleBreathingComplete = (): void => {
    setShowBreathingExercise(false);
    useStressStore.getState().reset();
  };

  const handleTakeBreak = (): void => {
    setShowBreathingExercise(true);
  };

  if (shouldShowBreathing) {
    return <BreathingExercise onComplete={handleBreathingComplete} />;
  }

  return (
    <>
      {needsCamera && (
        <Webcam
          ref={webcamRef}
          onUserMedia={handleUserMedia}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
          style={{
            width: "1px",
            height: "1px",
            opacity: 0,
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: -1,
          }}
          audio={false}
        />
      )}
      <DetectionOrchestrator videoElement={videoElement} enabled={true} />
      <MicroBreakPrompt onTakeBreak={handleTakeBreak} />
      <DashboardLayoutProvider
        initialTab={initialTab}
        initialEmailFolder={initialEmailFolder}
        initialTaskView={initialTaskView}
        onTabChange={trackTabSwitch}
        onEmailFolderSelect={handleEmailFolderSelect}
        onTaskViewSelect={handleTaskViewSelect}
      >
        <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
      </DashboardLayoutProvider>
    </>
  );
}

function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const layoutProps = useDashboardLayoutContext();
  return <DashboardLayout {...layoutProps}>{children}</DashboardLayout>;
}

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <GeneralLayoutInner>{children}</GeneralLayoutInner>
    </Suspense>
  );
}
