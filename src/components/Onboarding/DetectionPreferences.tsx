"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DetectionPreferences } from "@/types";
import styles from "./DetectionPreferences.module.scss";

interface DetectionPreferencesProps {
  preferences: DetectionPreferences;
  onChange: (preferences: Partial<DetectionPreferences>) => void;
  onSubmit: (preferences: DetectionPreferences) => Promise<void> | void;
}

export default function DetectionPreferences({
  preferences: initialPreferences,
  onChange,
  onSubmit,
}: DetectionPreferencesProps): React.ReactElement {
  const [localPreferences, setLocalPreferences] =
    useState<DetectionPreferences>(initialPreferences);

  const handleToggle = (
    key: keyof DetectionPreferences,
    value: boolean
  ): void => {
    setLocalPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    onChange(localPreferences);
    try {
      await onSubmit(localPreferences);
    } catch (error) {
      console.error("Error submitting detection preferences:", error);
    }
  };

  const options = [
    {
      key: "typingAndMouse" as const,
      label: "Typing and mouse patterns",
      description:
        "Analyze your typing rhythm, keystroke patterns, and mouse movements to detect stress and focus levels",
      requiresCalibration: "keyboard",
    },
    {
      key: "posture" as const,
      label: "Posture",
      description:
        "Monitor your sitting posture and body position to detect fatigue and discomfort",
      requiresCalibration: "posture",
    },
    {
      key: "facialExpression" as const,
      label: "Facial expression",
      description:
        "Detect emotional states and expressions through facial analysis to understand your mood",
      requiresCalibration: "posture",
    },
    {
      key: "emailContext" as const,
      label: "Email and tasks context",
      description:
        "Analyze your email content and task context to provide contextual insights",
      requiresCalibration: null,
    },
  ];

  const getRequiredCalibrations = (): string[] => {
    const calibrations: string[] = [];
    if (localPreferences.typingAndMouse) {
      calibrations.push("keyboard");
    }
    if (localPreferences.posture || localPreferences.facialExpression) {
      calibrations.push("posture");
    }
    return calibrations;
  };

  const requiredCalibrations = getRequiredCalibrations();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Detection Preferences</h1>
      <p className={styles.description}>
        Configure what you want Lilt to detect and enable permissions for them.
        Your data is associated with only your account.
      </p>
      <AnimatePresence>
        {requiredCalibrations.length > 0 && (
          <motion.div
            className={styles.hintWrapper}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <motion.div
              className={styles.hintBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <p className={styles.hintTitle}>What happens next:</p>
              <p className={styles.hintText}>
                {requiredCalibrations.includes("keyboard") &&
                  requiredCalibrations.includes("posture") &&
                  "You'll complete keyboard calibration first, then posture calibration."}
                {requiredCalibrations.includes("keyboard") &&
                  !requiredCalibrations.includes("posture") &&
                  "You'll complete keyboard calibration to establish your typing baseline."}
                {!requiredCalibrations.includes("keyboard") &&
                  requiredCalibrations.includes("posture") &&
                  "You'll complete posture calibration to capture your baseline posture."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={styles.optionsList}>
        {options.map((option) => (
          <div key={option.key} className={styles.option}>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>{option.label}</h3>
              <p className={styles.optionDescription}>{option.description}</p>
              {option.requiresCalibration && (
                <span className={styles.calibrationBadge}>
                  Requires {option.requiresCalibration} calibration
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                handleToggle(option.key, !localPreferences[option.key]);
              }}
              className={`${styles.enableButton} ${
                localPreferences[option.key] ? styles.enabled : styles.disabled
              }`}
            >
              {localPreferences[option.key] ? "Enabled" : "Enable"}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void handleSubmit()}
        className={styles.submitButton}
      >
        Continue
      </button>
    </div>
  );
}
