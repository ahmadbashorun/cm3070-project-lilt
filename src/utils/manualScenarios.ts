import type {
  ContextualLoad,
  StressLevel,
  StressResult,
  StressType,
} from "@/types";

export type ManualScenarioId =
  | "morningOverload"
  | "deadlinePressure"
  | "endOfDayRecovery";

export interface ManualScenarioConfig {
  id: ManualScenarioId;
  name: string;
  description: string;
  stressResult: StressResult;
  contextPatch: Partial<ContextualLoad>;
}

function createStressResult(
  level: StressLevel,
  type: StressType,
  score: number,
  signals: string[] = [],
  confidence: number = 0.8
): StressResult {
  return {
    level,
    type,
    score,
    confidence,
    signals,
  };
}

const SCENARIOS: Record<ManualScenarioId, ManualScenarioConfig> = {
  morningOverload: {
    id: "morningOverload",
    name: "Morning overload",
    description:
      "15 unread emails with 5 needing immediate attention, moderate task pressure. Targets S1-S2 overload.",
    stressResult: createStressResult(2, "overload", 55, [
      "high_contextual_load",
    ]),
    contextPatch: {
      unreadEmails: 15,
      urgentTasks: 5,
      incompleteTasks: 4,
      taskSwitchRate: 3,
      deadlinePressure: 25,
      externalTaskRatio: 0.3,
      sessionDuration: 60 * 60,
      idleTime: 60,
      contextLoad: 70,
    },
  },
  deadlinePressure: {
    id: "deadlinePressure",
    name: "Deadline pressure",
    description:
      "Two critical tasks due within 2 hours and several urgent emails. Targets S2 with anxiety, can be combined with higher manual level.",
    stressResult: createStressResult(2, "anxiety", 60, [
      "high_contextual_load",
      "temporal_fatigue",
    ]),
    contextPatch: {
      unreadEmails: 6,
      urgentTasks: 3,
      incompleteTasks: 5,
      taskSwitchRate: 4,
      deadlinePressure: 60,
      externalTaskRatio: 0.5,
      sessionDuration: 90 * 60,
      idleTime: 120,
      contextLoad: 75,
    },
  },
  endOfDayRecovery: {
    id: "endOfDayRecovery",
    name: "End of day recovery",
    description:
      "Long work session with accumulated fatigue and reduced activity. Targets S4 fatigue for recovery UI.",
    stressResult: createStressResult(4, "fatigue", 85, ["temporal_fatigue"]),
    contextPatch: {
      unreadEmails: 3,
      urgentTasks: 1,
      incompleteTasks: 2,
      taskSwitchRate: 2,
      deadlinePressure: 20,
      externalTaskRatio: 0.2,
      sessionDuration: 8 * 60 * 60,
      idleTime: 5 * 60,
      contextLoad: 50,
    },
  },
};

export const MANUAL_SCENARIOS: ManualScenarioConfig[] =
  Object.values(SCENARIOS);

export function getScenarioConfig(
  id: ManualScenarioId
): ManualScenarioConfig | undefined {
  return SCENARIOS[id];
}
