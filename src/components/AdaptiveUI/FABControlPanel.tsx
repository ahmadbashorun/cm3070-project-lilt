"use client";

import { useState } from "react";
import { useStressStore } from "@/store/stressStore";
import type { StressLevel, StressType } from "@/types";
import styles from "./FABControlPanel.module.scss";
import { IoCloseCircleOutline, IoSettingsOutline } from "react-icons/io5";

const stressTypes: StressType[] = ["overload", "fatigue", "withdrawal"];

export default function FABControlPanel(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const currentLevel = useStressStore((state) => state.currentLevel);
  const setStressResult = useStressStore((state) => state.setStressResult);

  const handleStressLevelChange = (level: StressLevel): void => {
    setStressResult(
      {
        level,
        score: level * 20,
        type: "early",
        confidence: 1.0,
        signals: [],
      },
      true
    );
  };

  const handleBreathingTrigger = (): void => {
    setStressResult(
      {
        level: 4,
        score: 80,
        type: "overload",
        confidence: 1.0,
        signals: [],
      },
      true
    );
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-label="Control Panel"
        type="button"
      >
        <IoSettingsOutline />
      </button>

      {isOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => {
              setIsOpen(false);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
          />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Stress Control Panel</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setIsOpen(false);
                }}
                type="button"
              >
                <IoCloseCircleOutline />
              </button>
            </div>

            <div className={styles.panelContent}>
              <div className={styles.section}>
                <span id="stress-level-label" className={styles.label}>
                  Stress Level
                </span>
                <div
                  className={styles.radioGroup}
                  role="radiogroup"
                  aria-labelledby="stress-level-label"
                >
                  {[0, 1, 2, 3, 4].map((level) => (
                    <label key={level} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="stressLevel"
                        value={level}
                        checked={currentLevel === level}
                        onChange={() => {
                          handleStressLevelChange(level as StressLevel);
                        }}
                      />
                      <span>S{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <span id="context-toggles-label" className={styles.label}>
                  Context Toggles
                </span>
                <div
                  className={styles.checkboxGroup}
                  role="group"
                  aria-labelledby="context-toggles-label"
                >
                  {stressTypes.map((type) => (
                    <label key={type} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        aria-label={
                          type.charAt(0).toUpperCase() + type.slice(1)
                        }
                      />
                      <span>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <button
                  className={styles.breathingButton}
                  onClick={handleBreathingTrigger}
                  type="button"
                >
                  Trigger Breathing Exercise
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
