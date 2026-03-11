"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import SVGKeyboard from "./SVGKeyboard";
import { calculateKeyboardBaseline } from "@/utils/calibrationHelpers";
import { useKeyboardCalibration } from "@/hooks/useKeyboardCalibration";
import type { KeyboardBaseline } from "@/types";
import styles from "./KeyboardCalibration.module.scss";

interface KeyboardCalibrationProps {
  onComplete: (baseline: KeyboardBaseline) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
}

const targetText =
  "Closed captions were created for deaf or hard of hearing individuals to assist in comprehension. They can also be used as a tool by those learning to read, learning to speak a non-native language, or in an environment where the audio is difficult to hear or is intentionally muted.";

export default function KeyboardCalibration({
  onComplete,
  onSkip,
}: KeyboardCalibrationProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    typedText,
    currentPosition,
    highlightedKeys,
    highlightedChars,
    isComplete,
    keystrokeEvents,
    handleKeyPress,
  } = useKeyboardCalibration(targetText);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      e.preventDefault();
      if (e.key === "Backspace") {
        handleKeyPress("Backspace");
      } else if (e.key.length === 1) {
        handleKeyPress(e.key);
      }
    };

    const handleFocus = (): void => {
      input.focus();
    };

    input.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleFocus);
    input.focus();

    return () => {
      input.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleFocus);
    };
  }, [handleKeyPress]);

  const handleCapture = async (): Promise<void> => {
    const baseline = calculateKeyboardBaseline(keystrokeEvents);
    try {
      await onComplete(baseline);
    } catch (error) {
      console.error("Error completing keyboard calibration:", error);
    }
  };

  const renderedText = useMemo(() => {
    return targetText.split("").map((char, index) => {
      const isHighlighted = highlightedChars.has(index);
      const isCurrent = index === currentPosition;
      const isPast = index < currentPosition;
      const hasError = index < typedText.length && typedText[index] !== char;

      const classNames = [
        styles.char,
        isHighlighted ? styles.charHighlighted : "",
        isCurrent ? styles.charCurrent : "",
        hasError && !isPast ? styles.charError : "",
      ]
        .filter(Boolean)
        .join(" ");

      return (
        <span key={index} className={classNames}>
          {char === " " ? "\u00A0" : char}
        </span>
      );
    });
  }, [currentPosition, highlightedChars, typedText]);

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>Calibration (Keyboard)</h1>
        <p className={styles.instructionText}>
          To help Lilt have a good understanding of your default typing
          baseline, complete the following calibration exercise. Type the
          following paragraph below:
        </p>
        <motion.div
          className={styles.hintsContainer}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
        >
          <p className={styles.hintText}>
            <strong>Tips for best results:</strong>
          </p>
          <ul className={styles.hintsList}>
            <li>Type naturally at your normal pace</li>
            <li>
              Don&apos;t worry about mistakes - just type as you normally would
            </li>
          </ul>
        </motion.div>
        <div className={styles.targetTextContainer}>
          <div className={styles.targetText}>{renderedText}</div>
          <input
            ref={inputRef}
            type="text"
            className={styles.hiddenInput}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={typedText}
            onChange={() => {}}
          />
        </div>
      </div>
      <SVGKeyboard highlightedKeys={highlightedKeys} />
      <div className={styles.buttonsContainer}>
        <button
          type="button"
          onClick={() => void handleCapture()}
          className={styles.button}
          disabled={!isComplete}
        >
          Capture Baseline
        </button>
        <button
          type="button"
          onClick={() => void onSkip()}
          className={styles.skipLink}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
