"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useStressStore } from "@/store/stressStore";
import { usePermissionStore } from "@/store/permissionStore";
import { useKeyboardMetrics } from "@/hooks/useKeyboardMetrics";
import { useMouseBehavior } from "@/hooks/useMouseBehavior";
import { useFacialDetection } from "@/hooks/useFacialDetection";
import { usePostureDetection } from "@/hooks/usePostureDetection";

interface DetectionOrchestratorProps {
  videoElement: HTMLVideoElement | null;
  enabled?: boolean;
}

export default function DetectionOrchestrator({
  videoElement,
  enabled = true,
}: DetectionOrchestratorProps): null {
  const detectionPreferences = useOnboardingStore(
    (state) => state.detectionPreferences
  );
  const cameraPermission = usePermissionStore(
    (state) => state.cameraPermission
  );
  const setBaselines = useStressStore((state) => state.setBaselines);

  const typingAndMouseEnabled = enabled && detectionPreferences.typingAndMouse;
  const facialEnabled =
    enabled &&
    detectionPreferences.facialExpression &&
    cameraPermission === "granted";
  const postureEnabled =
    enabled && detectionPreferences.posture && cameraPermission === "granted";

  useKeyboardMetrics(typingAndMouseEnabled);
  useMouseBehavior(typingAndMouseEnabled);

  useFacialDetection(videoElement, facialEnabled, cameraPermission);

  usePostureDetection(videoElement, postureEnabled, cameraPermission);

  useEffect(() => {
    let previousKeyboard:
      | ReturnType<
          typeof useOnboardingStore.getState
        >["calibration"]["keyboard"]
      | null = null;
    let previousPosture:
      | ReturnType<typeof useOnboardingStore.getState>["calibration"]["posture"]
      | null = null;
    let previousFacial:
      | ReturnType<typeof useOnboardingStore.getState>["calibration"]["facial"]
      | null = null;

    // Initial sync: apply any existing baselines from onboarding store
    const initialState = useOnboardingStore.getState();
    const initialKeyboard = initialState.calibration.keyboard;
    const initialPosture = initialState.calibration.posture;
    const initialFacial = initialState.calibration.facial;

    if (initialKeyboard) {
      previousKeyboard = initialKeyboard;
      setBaselines({ keyboard: initialKeyboard });
    }
    if (initialPosture) {
      previousPosture = initialPosture;
      setBaselines({ posture: initialPosture });
    }
    if (initialFacial) {
      previousFacial = initialFacial;
      setBaselines({ facial: initialFacial });
    }

    const unsubscribeKeyboard = useOnboardingStore.subscribe((state) => {
      const keyboard = state.calibration.keyboard;
      if (keyboard !== previousKeyboard && keyboard !== null) {
        previousKeyboard = keyboard;
        setBaselines({ keyboard });
      }
    });

    const unsubscribePosture = useOnboardingStore.subscribe((state) => {
      const posture = state.calibration.posture;
      if (posture !== previousPosture && posture !== null) {
        previousPosture = posture;
        setBaselines({ posture });
      }
    });

    const unsubscribeFacial = useOnboardingStore.subscribe((state) => {
      const facial = state.calibration.facial;
      if (facial !== previousFacial && facial !== null) {
        previousFacial = facial;
        setBaselines({ facial });
      }
    });

    return () => {
      unsubscribeKeyboard();
      unsubscribePosture();
      unsubscribeFacial();
    };
  }, [setBaselines]);

  return null;
}
