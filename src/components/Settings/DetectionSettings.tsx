"use client";

import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePermissionStore } from "@/store/permissionStore";
import { useStressStore } from "@/store/stressStore";
import CalibrationModal from "./CalibrationModal";
import type {
  KeyboardBaseline,
  PostureBaseline,
  FacialBaseline,
  StressLevel,
  StressResult,
} from "@/types";
import { MANUAL_SCENARIOS } from "@/utils/manualScenarios";
import styles from "./DetectionSettings.module.scss";

interface DetectionPreferences {
  typingAndMouse: boolean;
  posture: boolean;
  facialExpression: boolean;
  emailContext: boolean;
}

export default function DetectionSettings(): React.ReactElement {
  const detectionPreferences = useOnboardingStore(
    (state) => state.detectionPreferences
  );
  const setDetectionPreferences = useOnboardingStore(
    (state) => state.setDetectionPreferences
  );
  const calibration = useOnboardingStore((state) => state.calibration);
  const setKeyboardBaseline = useOnboardingStore(
    (state) => state.setKeyboardBaseline
  );
  const setPostureBaseline = useOnboardingStore(
    (state) => state.setPostureBaseline
  );
  const setFacialBaseline = useOnboardingStore(
    (state) => state.setFacialBaseline
  );
  const cameraPermission = usePermissionStore(
    (state) => state.cameraPermission
  );
  const checkCameraPermission = usePermissionStore(
    (state) => state.checkCameraPermission
  );

  const [preferences, setPreferences] = useState<DetectionPreferences>({
    typingAndMouse: detectionPreferences.typingAndMouse,
    posture: detectionPreferences.posture,
    facialExpression: detectionPreferences.facialExpression,
    emailContext: detectionPreferences.emailContext,
  });

  const [sensitivity, setSensitivity] = useState(50);
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false);
  const [pendingPreference, setPendingPreference] = useState<
    keyof DetectionPreferences | null
  >(null);
  const [calibrationType, setCalibrationType] = useState<
    "keyboard" | "posture" | "facial" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions
  const requiresBaseline = (
    preference: keyof DetectionPreferences
  ): "keyboard" | "posture" | "facial" | null => {
    if (preference === "typingAndMouse") return "keyboard";
    if (preference === "posture") return "posture";
    if (preference === "facialExpression") return "facial";
    return null;
  };

  const hasBaseline = (type: string): boolean => {
    if (type === "keyboard") return calibration.keyboard !== null;
    if (type === "posture") return calibration.posture !== null;
    if (type === "facial") return calibration.facial !== null;
    return false;
  };

  // Fetch preferences from API on mount
  useEffect(() => {
    const fetchPreferences = async (): Promise<void> => {
      try {
        const response = await fetch("/api/preferences");
        if (response.ok) {
          const data = (await response.json()) as DetectionPreferences;
          setPreferences(data);
          setDetectionPreferences(data);
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err);
        // Fallback to store if API fails
      }
    };
    void fetchPreferences();
  }, [setDetectionPreferences]);

  // Update preferences via API
  const updatePreferences = async (
    newPreferences: DetectionPreferences
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      setPreferences(newPreferences);
      setDetectionPreferences(newPreferences);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update preferences";
      setError(errorMessage);
      console.error("Failed to update preferences:", err);
      // Fallback: update store even if API fails
      setDetectionPreferences(newPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (
    key: keyof DetectionPreferences
  ): Promise<void> => {
    const newValue = !preferences[key];

    // If disabling, just update directly
    if (!newValue) {
      const newPreferences = {
        ...preferences,
        [key]: false,
      };
      await updatePreferences(newPreferences);
      return;
    }

    // If enabling, check if baseline is required
    const requiredBaselineType = requiresBaseline(key);
    if (requiredBaselineType && !hasBaseline(requiredBaselineType)) {
      // Need calibration - show modal
      setPendingPreference(key);
      setCalibrationType(requiredBaselineType);
      setCalibrationModalOpen(true);
    } else {
      // No baseline needed or baseline exists - update directly
      const newPreferences = {
        ...preferences,
        [key]: true,
      };
      await updatePreferences(newPreferences);
    }
  };

  const handleCalibrationComplete = async (
    baseline: KeyboardBaseline | PostureBaseline | FacialBaseline
  ): Promise<void> => {
    // Save baseline to store
    if (calibrationType === "keyboard") {
      setKeyboardBaseline(baseline as KeyboardBaseline);
    } else if (calibrationType === "posture") {
      setPostureBaseline(baseline as PostureBaseline);
    } else if (calibrationType === "facial") {
      setFacialBaseline(baseline as FacialBaseline);
    }

    // Close modal
    setCalibrationModalOpen(false);
    setCalibrationType(null);

    // Enable the pending preference
    if (pendingPreference) {
      const newPreferences = {
        ...preferences,
        [pendingPreference]: true,
      };
      await updatePreferences(newPreferences);
      setPendingPreference(null);
    }
  };

  const handleCalibrationSkip = async (): Promise<void> => {
    // Close modal
    setCalibrationModalOpen(false);
    setCalibrationType(null);

    // Enable the pending preference even without baseline
    if (pendingPreference) {
      const newPreferences = {
        ...preferences,
        [pendingPreference]: true,
      };
      await updatePreferences(newPreferences);
      setPendingPreference(null);
    }
  };

  const handleCalibrationClose = (): void => {
    setCalibrationModalOpen(false);
    setCalibrationType(null);
    setPendingPreference(null);
  };

  const handleRequestPermission = async (): Promise<void> => {
    try {
      if (
        typeof navigator !== "undefined" &&
        "mediaDevices" in navigator &&
        "getUserMedia" in navigator.mediaDevices
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        await checkCameraPermission();
      }
    } catch (err) {
      const error = err as DOMException;
      if (error.name === "NotAllowedError") {
        console.warn("Camera permission denied");
      }
    }
  };

  const getPermissionStatus = (): {
    status: "granted" | "denied" | "prompt" | "unavailable";
    message: string;
  } => {
    switch (cameraPermission) {
      case "granted":
        return { status: "granted", message: "Camera access granted" };
      case "denied":
        return {
          status: "denied",
          message: "Camera access denied. Enable in browser settings.",
        };
      case "unavailable":
        return { status: "unavailable", message: "Camera not available" };
      default:
        return { status: "prompt", message: "Camera permission needed" };
    }
  };

  const permissionInfo = getPermissionStatus();

  const currentLevel = useStressStore((state) => state.currentLevel);
  const isManualOverride = useStressStore((state) => state.isManualOverride);
  const stressResult = useStressStore((state) => state.stressResult);
  const setManualStress = useStressStore((state) => state.setManualStress);
  const applyScenario = useStressStore((state) => state.applyScenario);
  const selectedScenarioId =
    (useStressStore.getState() as { selectedScenarioId: string | null })
      .selectedScenarioId;

  const createManualResult = (
    level: StressLevel,
    base?: StressResult | null
  ): StressResult => {
    if (base) {
      return {
        ...base,
        level,
      };
    }

    let type: StressResult["type"] = "none";
    if (level === 1) type = "early";
    if (level === 2) type = "overload";
    if (level >= 3) type = "anxiety";

    const score = level * 20 + 10;

    return {
      level,
      score,
      type,
      confidence: 0.8,
      signals: [],
    };
  };

  return (
    <>
      {calibrationType && (
        <CalibrationModal
          isOpen={calibrationModalOpen}
          onClose={handleCalibrationClose}
          calibrationType={calibrationType}
          onComplete={handleCalibrationComplete}
          onSkip={handleCalibrationSkip}
        />
      )}
      <div className={styles.container}>
        <h2 className={styles.title}>Detection Settings</h2>
        <p className={styles.description}>
          Configure which detection methods should be active for stress
          monitoring.
        </p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Detection Methods</h3>
          <div className={styles.options}>
            <div className={styles.option}>
              <div className={styles.optionContent}>
                <label className={styles.optionLabel} htmlFor="typingMouse">
                  Typing and Mouse Patterns
                </label>
                <p className={styles.optionDescription}>
                  Tracks keyboard rhythm and mouse movement for stress
                  indicators
                </p>
              </div>
              <label className={styles.toggle} htmlFor="typingMouse">
                <input
                  id="typingMouse"
                  type="checkbox"
                  checked={preferences.typingAndMouse}
                  disabled={isLoading}
                  onChange={() => {
                    void handleToggle("typingAndMouse");
                  }}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.srOnly}>
                  Toggle typing and mouse patterns detection
                </span>
              </label>
            </div>

            <div className={styles.option}>
              <div className={styles.optionContent}>
                <label className={styles.optionLabel} htmlFor="posture">
                  Posture Detection
                </label>
                <p className={styles.optionDescription}>
                  Uses webcam to detect posture changes (requires camera
                  permission)
                </p>
                {preferences.posture && cameraPermission !== "granted" && (
                  <div className={styles.permissionStatus}>
                    <span
                      className={`${styles.permissionIndicator} ${
                        styles[permissionInfo.status]
                      }`}
                    >
                      {permissionInfo.status === "granted" ? "✓" : "!"}
                    </span>
                    <span className={styles.permissionMessage}>
                      {permissionInfo.message}
                    </span>
                    {cameraPermission !== "denied" &&
                      cameraPermission !== "unavailable" && (
                        <button
                          className={styles.permissionButton}
                          onClick={() => void handleRequestPermission()}
                          type="button"
                        >
                          Grant Permission
                        </button>
                      )}
                  </div>
                )}
              </div>
              <label className={styles.toggle} htmlFor="posture">
                <input
                  id="posture"
                  type="checkbox"
                  checked={preferences.posture}
                  disabled={isLoading}
                  onChange={() => {
                    void handleToggle("posture");
                  }}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.srOnly}>Toggle posture detection</span>
              </label>
            </div>

            <div className={styles.option}>
              <div className={styles.optionContent}>
                <label className={styles.optionLabel} htmlFor="facial">
                  Facial Expression
                </label>
                <p className={styles.optionDescription}>
                  Uses webcam to analyze facial expressions (requires camera
                  permission)
                </p>
                {preferences.facialExpression &&
                  cameraPermission !== "granted" && (
                    <div className={styles.permissionStatus}>
                      <span
                        className={`${styles.permissionIndicator} ${
                          styles[permissionInfo.status]
                        }`}
                      >
                        {permissionInfo.status === "granted" ? "✓" : "!"}
                      </span>
                      <span className={styles.permissionMessage}>
                        {permissionInfo.message}
                      </span>
                      {cameraPermission !== "denied" &&
                        cameraPermission !== "unavailable" && (
                          <button
                            className={styles.permissionButton}
                            onClick={() => void handleRequestPermission()}
                            type="button"
                          >
                            Grant Permission
                          </button>
                        )}
                    </div>
                  )}
              </div>
              <label className={styles.toggle} htmlFor="facial">
                <input
                  id="facial"
                  type="checkbox"
                  checked={preferences.facialExpression}
                  disabled={isLoading}
                  onChange={() => {
                    void handleToggle("facialExpression");
                  }}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.srOnly}>
                  Toggle facial expression detection
                </span>
              </label>
            </div>

            <div className={styles.option}>
              <div className={styles.optionContent}>
                <label className={styles.optionLabel} htmlFor="emailContext">
                  Email and Task Context
                </label>
                <p className={styles.optionDescription}>
                  Analyzes workload from imported email and task data
                </p>
              </div>
              <label className={styles.toggle} htmlFor="emailContext">
                <input
                  id="emailContext"
                  type="checkbox"
                  checked={preferences.emailContext}
                  disabled={isLoading}
                  onChange={() => {
                    void handleToggle("emailContext");
                  }}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.srOnly}>
                  Toggle email and task context detection
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Adaptation Sensitivity</h3>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={sensitivity}
              onChange={(e) => {
                setSensitivity(Number(e.target.value));
              }}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>Less Sensitive</span>
              <span>{sensitivity}%</span>
              <span>More Sensitive</span>
            </div>
          </div>
          <p className={styles.sliderDescription}>
            Adjust how quickly the system adapts to detected stress levels
          </p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Manual Stress &amp; Scenarios</h3>
          <p className={`${styles.description} ${styles.manualSectionDescription}`}>
            Use manual mode to simulate stress levels and scenarios for demos.
            Automatic detection and adaptation are paused while manual mode is
            enabled.
          </p>

          <div className={styles.options}>
            <div className={styles.option}>
              <div className={styles.optionContent}>
                <label className={styles.optionLabel} htmlFor="manualMode">
                  Manual stress mode
                </label>
                <p className={styles.optionDescription}>
                  Override detected stress with a selected level or scenario.
                </p>
              </div>
              <label className={styles.toggle} htmlFor="manualMode">
                <input
                  id="manualMode"
                  type="checkbox"
                  checked={isManualOverride}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const next = createManualResult(
                        currentLevel,
                        stressResult
                      );
                      setManualStress(next);
                    } else {
                      setManualStress(null);
                    }
                  }}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.srOnly}>
                  Toggle manual stress mode
                </span>
              </label>
            </div>
          </div>

          <div className={styles.manualControlsGrid}>
            <div className={styles.option}>
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>Stress level (S0–S4)</span>
                <p className={styles.optionDescription}>
                  Choose a target stress band while manual mode is enabled.
                </p>
                <div className={styles.levelSelectWrapper}>
                  <select
                    className={styles.levelSelect}
                    value={currentLevel}
                    disabled={!isManualOverride}
                    onChange={(e) => {
                      const level = Number(e.target.value) as StressLevel;
                      const next = createManualResult(level, stressResult);
                      setManualStress(next);
                    }}
                  >
                    <option value={0}>S0 – Calm</option>
                    <option value={1}>S1 – Early signs</option>
                    <option value={2}>S2 – Elevated</option>
                    <option value={3}>S3 – High</option>
                    <option value={4}>S4 – Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.option}>
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>Scenarios</span>
                <p className={styles.optionDescription}>
                  Quickly simulate common stress situations with matching
                  contextual load.
                </p>
                <div className={styles.scenarioButtons}>
                  {MANUAL_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      className={`${styles.scenarioButton} ${
                        selectedScenarioId === scenario.id
                          ? styles.scenarioButtonActive
                          : ""
                      }`}
                      type="button"
                      aria-pressed={selectedScenarioId === scenario.id}
                      onClick={() => {
                        applyScenario(scenario.id);
                      }}
                    >
                      {scenario.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.saveButton}
            type="button"
            disabled={isLoading}
          >
            Save Settings
          </button>
          <button
            className={styles.resetButton}
            type="button"
            disabled={isLoading}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </>
  );
}
