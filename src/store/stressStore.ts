import { create } from "zustand";
import type {
  StressLevel,
  StressResult,
  DetectionInputs,
  FacialBaseline,
  PostureBaseline,
  KeyboardBaseline,
  ContextualLoad,
} from "@/types";
import type { ManualScenarioId } from "@/utils/manualScenarios";
import { getScenarioConfig } from "@/utils/manualScenarios";

interface StressHistoryEntry {
  level: StressLevel;
  timestamp: number;
}

interface StressStore {
  currentLevel: StressLevel;
  stressResult: StressResult | null;
  detectionInputs: DetectionInputs;
  facialBaseline: FacialBaseline | null;
  postureBaseline: PostureBaseline | null;
  keyboardBaseline: KeyboardBaseline | null;
  stressHistory: StressHistoryEntry[];
  cameraAvailable: boolean;
  isManualOverride: boolean;
  selectedScenarioId: ManualScenarioId | null;
  setStressResult: (result: StressResult, isManual?: boolean) => void;
  setManualStress: (result: StressResult | null) => void;
  applyScenario: (id: ManualScenarioId) => void;
  setDetectionInputs: (inputs: Partial<DetectionInputs>) => void;
  setBaselines: (baselines: {
    facial?: FacialBaseline | null;
    posture?: PostureBaseline | null;
    keyboard?: KeyboardBaseline | null;
  }) => void;
  setCameraAvailable: (available: boolean) => void;
  reset: () => void;
}

function buildStateFromResult(
  state: StressStore,
  result: StressResult,
  isManual: boolean
): Pick<StressStore, "stressResult" | "currentLevel" | "isManualOverride" | "stressHistory"> {
  const newHistory = [...state.stressHistory];
  if (
    newHistory.length === 0 ||
    newHistory[newHistory.length - 1]?.level !== result.level
  ) {
    newHistory.push({
      level: result.level,
      timestamp: Date.now(),
    });
    if (newHistory.length > 50) {
      newHistory.shift();
    }
  }

  return {
    stressResult: result,
    currentLevel: result.level,
    isManualOverride: isManual,
    stressHistory: newHistory,
  };
}

const initialDetectionInputs: DetectionInputs = {
  keyboard: null,
  mouse: {
    avgVelocity: 0,
    jitterIndex: 0,
    clickFrequency: 0,
    hoverHesitation: 0,
    scrollIntensity: 0,
  },
  posture: null,
  facial: null,
  context: {
    unreadEmails: 0,
    urgentTasks: 0,
    taskSwitchRate: 0,
    incompleteTasks: 0,
    deadlinePressure: 0,
    externalTaskRatio: 0,
    sessionDuration: 0,
    idleTime: 0,
    contextLoad: 0,
  },
};

export const useStressStore = create<StressStore>((set) => ({
  currentLevel: 0,
  stressResult: null,
  detectionInputs: initialDetectionInputs,
  facialBaseline: null,
  postureBaseline: null,
  keyboardBaseline: null,
  stressHistory: [],
  cameraAvailable: false,
  isManualOverride: false,
  selectedScenarioId: null,
  setStressResult: (result, isManual = false) => {
    set((state) => buildStateFromResult(state, result, isManual));
  },
  setManualStress: (result) => {
    if (!result) {
      set({ isManualOverride: false, selectedScenarioId: null });
      return;
    }

    set((state) => buildStateFromResult(state, result, true));
  },
  applyScenario: (id) => {
    const config = getScenarioConfig(id);
    if (!config) return;

    set((state) => {
      const updatedContext: ContextualLoad = {
        ...state.detectionInputs.context,
        ...config.contextPatch,
      };

      const updatedInputs: DetectionInputs = {
        ...state.detectionInputs,
        context: updatedContext,
      };

      return {
        ...buildStateFromResult(state, config.stressResult, true),
        detectionInputs: updatedInputs,
        selectedScenarioId: id,
      };
    });
  },
  setDetectionInputs: (inputs) => {
    set((state) => ({
      detectionInputs: {
        ...state.detectionInputs,
        ...inputs,
      },
    }));
  },
  setBaselines: (baselines) => {
    set((state) => ({
      facialBaseline: baselines.facial ?? state.facialBaseline,
      postureBaseline: baselines.posture ?? state.postureBaseline,
      keyboardBaseline: baselines.keyboard ?? state.keyboardBaseline,
    }));
  },
  setCameraAvailable: (available) => {
    set({ cameraAvailable: available });
  },
  reset: () => {
    set({
      currentLevel: 0,
      stressResult: null,
      detectionInputs: initialDetectionInputs,
      cameraAvailable: false,
      isManualOverride: false,
      stressHistory: [],
      selectedScenarioId: null,
    });
  },
}));
