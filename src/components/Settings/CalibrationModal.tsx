"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseCircleOutline } from "react-icons/io5";
import KeyboardCalibration from "@/components/Onboarding/KeyboardCalibration";
import PostureCalibration from "@/components/Onboarding/PostureCalibration";
import FacialCalibration from "@/components/Onboarding/FacialCalibration";
import type {
  KeyboardBaseline,
  PostureBaseline,
  FacialBaseline,
} from "@/types";
import styles from "./CalibrationModal.module.scss";

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibrationType: "keyboard" | "posture" | "facial";
  onComplete: (
    baseline: KeyboardBaseline | PostureBaseline | FacialBaseline
  ) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
}

export default function CalibrationModal({
  isOpen,
  onClose,
  calibrationType,
  onComplete,
  onSkip,
}: CalibrationModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyboardComplete = async (
    baseline: KeyboardBaseline
  ): Promise<void> => {
    await onComplete(baseline);
  };

  const handlePostureComplete = async (
    baseline: PostureBaseline
  ): Promise<void> => {
    await onComplete(baseline);
  };

  const handleFacialComplete = async (
    baseline: FacialBaseline
  ): Promise<void> => {
    await onComplete(baseline);
  };

  const handleKeyboardSkip = async (): Promise<void> => {
    await onSkip();
  };

  const handlePostureSkip = async (): Promise<void> => {
    await onSkip();
  };

  const handleFacialSkip = async (): Promise<void> => {
    await onSkip();
  };

  const getCalibrationTitle = (): string => {
    switch (calibrationType) {
      case "keyboard":
        return "Keyboard Calibration";
      case "posture":
        return "Posture Calibration";
      case "facial":
        return "Facial Expression Calibration";
      default:
        return "Calibration";
    }
  };

  return (
    <AnimatePresence>
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {isOpen && (
        <motion.div
          className={styles.overlay}
          onClick={handleOverlayClick}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onClose();
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calibration-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className={styles.header}>
              <h2 id="calibration-modal-title" className={styles.title}>
                {getCalibrationTitle()}
              </h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                type="button"
                aria-label="Close"
              >
                <IoCloseCircleOutline />
              </button>
            </div>

            <div className={styles.content}>
              {calibrationType === "keyboard" && (
                <KeyboardCalibration
                  onComplete={handleKeyboardComplete}
                  onSkip={handleKeyboardSkip}
                />
              )}
              {calibrationType === "posture" && (
                <PostureCalibration
                  onComplete={handlePostureComplete}
                  onSkip={handlePostureSkip}
                />
              )}
              {calibrationType === "facial" && (
                <FacialCalibration
                  onComplete={handleFacialComplete}
                  onSkip={handleFacialSkip}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
