"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/Onboarding/ProgressBar";
import AccountSetup from "@/components/Onboarding/AccountSetup";
import DetectionPreferences from "@/components/Onboarding/DetectionPreferences";
import KeyboardCalibration from "@/components/Onboarding/KeyboardCalibration";
import PostureCalibration from "@/components/Onboarding/PostureCalibration";
import FacialCalibration from "@/components/Onboarding/FacialCalibration";
import type {
  KeyboardBaseline,
  PostureBaseline,
  FacialBaseline,
  DetectionPreferences as DetectionPreferencesType,
} from "@/types";
import styles from "./page.module.scss";

export default function OnboardingPage() {
  const router = useRouter();
  const {
    user,
    detectionPreferences,
    calibration,
    setUser,
    setDetectionPreferences,
    setKeyboardBaseline,
    setPostureBaseline,
    setFacialBaseline,
    setKeyboardSkipped,
    setPostureSkipped,
    setFacialSkipped,
    setOnboardingComplete,
    onboardingComplete,
  } = useOnboardingStore();

  const determineCurrentStep = (): number => {
    if (!user.name) return 0;
    const hasKeyboardPreference = detectionPreferences.typingAndMouse;
    const hasPosturePreference = detectionPreferences.posture;
    const hasFacialPreference = detectionPreferences.facialExpression;
    const keyboardHandled =
      calibration.keyboard !== null || calibration.skipped.keyboard;
    const postureHandled =
      calibration.posture !== null || calibration.skipped.posture;
    const facialHandled =
      calibration.facial !== null || calibration.skipped.facial;

    if (
      !hasKeyboardPreference &&
      !hasPosturePreference &&
      !hasFacialPreference
    ) {
      return 1;
    }
    if (hasKeyboardPreference && !keyboardHandled) {
      return 2;
    }
    if (hasPosturePreference && !postureHandled) {
      return 3;
    }
    if (hasFacialPreference && !facialHandled) {
      return 4;
    }
    return 5;
  };

  const currentStepIndex = determineCurrentStep();
  const totalSteps = 5;

  const getProgress = (): number => {
    if (currentStepIndex === 5) return 100;
    return ((currentStepIndex + 1) / totalSteps) * 100;
  };

  const checkOnboardingComplete = useCallback(async (): Promise<void> => {
    const currentState = useOnboardingStore.getState();
    const hasKeyboardPreference =
      currentState.detectionPreferences.typingAndMouse;
    const hasPosturePreference = currentState.detectionPreferences.posture;
    const hasFacialPreference =
      currentState.detectionPreferences.facialExpression;
    const keyboardHandled =
      currentState.calibration.keyboard !== null ||
      currentState.calibration.skipped.keyboard;
    const postureHandled =
      currentState.calibration.posture !== null ||
      currentState.calibration.skipped.posture;
    const facialHandled =
      currentState.calibration.facial !== null ||
      currentState.calibration.skipped.facial;

    const needsKeyboard = hasKeyboardPreference;
    const needsPosture = hasPosturePreference;
    const needsFacial = hasFacialPreference;

    if (
      (!needsKeyboard || keyboardHandled) &&
      (!needsPosture || postureHandled) &&
      (!needsFacial || facialHandled)
    ) {
      await setOnboardingComplete(true);
      router.push("/dashboard");
    }
  }, [router, setOnboardingComplete]);

  const handleAccountSubmit = (data: {
    name: string;
    avatar?: string;
  }): void => {
    setUser({
      name: data.name,
      ...(data.avatar ? { avatar: data.avatar } : {}),
    });
  };

  const handleDetectionSubmit = async (
    preferences: DetectionPreferencesType
  ): Promise<void> => {
    setDetectionPreferences(preferences);
    await checkOnboardingComplete();
  };

  const handleKeyboardComplete = async (
    baseline: KeyboardBaseline
  ): Promise<void> => {
    setKeyboardBaseline(baseline);
    await checkOnboardingComplete();
  };

  const handleKeyboardSkip = async (): Promise<void> => {
    setKeyboardBaseline(null);
    setKeyboardSkipped(true);
    await checkOnboardingComplete();
  };

  const handlePostureComplete = async (
    baseline: PostureBaseline
  ): Promise<void> => {
    setPostureBaseline(baseline);
    await checkOnboardingComplete();
  };

  const handlePostureSkip = async (): Promise<void> => {
    setPostureBaseline(null);
    setPostureSkipped(true);
    await checkOnboardingComplete();
  };

  const handleFacialComplete = async (
    baseline: FacialBaseline
  ): Promise<void> => {
    setFacialBaseline(baseline);
    await checkOnboardingComplete();
  };

  const handleFacialSkip = async (): Promise<void> => {
    setFacialBaseline(null);
    setFacialSkipped(true);
    await checkOnboardingComplete();
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className={styles.logo}>Lilt</div>
        <ProgressBar
          progress={getProgress()}
          totalSteps={totalSteps}
          currentStep={currentStepIndex + 1}
        />
        <AnimatePresence mode="wait">
          {currentStepIndex === 0 && !onboardingComplete && (
            <motion.div
              key="account-setup"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <AccountSetup
                name={user.name}
                {...(user.avatar ? { avatar: user.avatar } : {})}
                onSubmit={handleAccountSubmit}
              />
            </motion.div>
          )}
          {currentStepIndex === 1 && !onboardingComplete && (
            <motion.div
              key="detection-preferences"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <DetectionPreferences
                preferences={detectionPreferences}
                onChange={setDetectionPreferences}
                onSubmit={handleDetectionSubmit}
              />
            </motion.div>
          )}
          {currentStepIndex === 2 && detectionPreferences.typingAndMouse && !onboardingComplete && (
            <motion.div
              key="keyboard-calibration"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <KeyboardCalibration
                onComplete={handleKeyboardComplete}
                onSkip={handleKeyboardSkip}
              />
            </motion.div>
          )}
          {currentStepIndex === 3 && detectionPreferences.posture && !onboardingComplete && (
            <motion.div
              key="posture-calibration"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <PostureCalibration
                onComplete={handlePostureComplete}
                onSkip={handlePostureSkip}
              />
            </motion.div>
          )}
          {currentStepIndex === 4 && detectionPreferences.facialExpression && !onboardingComplete && (
            <motion.div
              key="facial-calibration"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <FacialCalibration
                onComplete={handleFacialComplete}
                onSkip={handleFacialSkip}
              />
            </motion.div>
          )}
          {onboardingComplete && (
            <motion.div
              key="onboarding-complete"
              initial="initial"
              animate="animate"
              exit="exit"
              className={styles.loadingContainer}
              variants={pageVariants}
            >
              <div className={styles.loadingAnimation}>Lilt</div>
              <p>Preparing your dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
