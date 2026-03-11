import type {
  StressLevel,
  StressType,
  StressResult,
  DetectionInputs,
  FacialBaseline,
  PostureBaseline,
  PostureMetrics,
  FacialMetrics,
} from "@/types";
import { STRESS_THRESHOLDS } from "./constants";

const WEIGHTS = {
  facial: 0.25,
  behavioral: 0.2,
  postural: 0.15,
  contextual: 0.3,
  temporal: 0.1,
};

export function calculateFacialStress(
  currentMetrics: FacialMetrics | null,
  baseline: FacialBaseline | null
): number {
  if (!currentMetrics || !baseline) return 0;

  const eyeDeviation = Math.abs(
    currentMetrics.eyeAspectRatio - baseline.eyeAspectRatio
  );
  const mouthDeviation = Math.abs(
    currentMetrics.mouthAspectRatio - baseline.mouthAspectRatio
  );
  const browDeviation = Math.abs(
    currentMetrics.browPosition - baseline.browPosition
  );

  const eyeStress = Math.min(eyeDeviation * 200, 100);
  const mouthStress = Math.min(mouthDeviation * 300, 100);
  const browStress = Math.min(browDeviation * 500, 100);

  return (eyeStress + mouthStress + browStress) / 3;
}

export function calculatePosturalStress(
  currentMetrics: PostureMetrics | null,
  baseline: PostureBaseline | null
): number {
  if (!currentMetrics || !baseline) return 0;

  const leanDeviation = Math.abs(currentMetrics.leanAngle - baseline.leanAngle);
  const shoulderDeviation = Math.abs(
    currentMetrics.shoulderTension - baseline.shoulderAlignment
  );

  const leanStress = Math.min(leanDeviation * 2, 100);
  const shoulderStress = Math.min(shoulderDeviation * 100, 100);

  return (leanStress + shoulderStress) / 2;
}

export function calculateBehavioralStress(
  keyboard: DetectionInputs["keyboard"],
  mouse: DetectionInputs["mouse"],
  keyboardBaseline: { avgWPM: number } | null
): number {
  let stress = 0;
  let factors = 0;

  if (keyboard) {
    if (keyboardBaseline && keyboardBaseline.avgWPM > 0) {
      const speedDeviation = Math.abs(keyboard.typingSpeed - 100) / 100;
      const errorStress = Math.min(keyboard.errorRate * 10, 100);
      stress += speedDeviation * 50 + errorStress;
      factors += 2;
    } else {
      const baselineWPM = 60;
      const speedDeviation =
        Math.abs(keyboard.typingSpeed - baselineWPM) / baselineWPM;
      const errorStress = Math.min(keyboard.errorRate * 10, 100);
      stress += speedDeviation * 50 + errorStress;
      factors += 2;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (mouse) {
    const jitterStress = Math.min(mouse.jitterIndex * 5, 100);
    const velocityStress = Math.min(mouse.avgVelocity / 10, 100);
    stress += jitterStress + velocityStress;
    factors += 2;
  }

  return factors > 0 ? stress / factors : 0;
}

export function calculateContextualLoad(
  context: DetectionInputs["context"]
): number {
  const emailLoad = Math.min((context.unreadEmails / 50) * 100, 100);
  const taskLoad = Math.min((context.urgentTasks / 5) * 100, 100);
  const switchLoad = Math.min((context.taskSwitchRate / 10) * 100, 100);
  const incompleteLoad = Math.min((context.incompleteTasks / 10) * 100, 100);

  return (
    emailLoad * 0.3 + taskLoad * 0.3 + switchLoad * 0.2 + incompleteLoad * 0.2
  );
}

export function calculateTemporalFactor(
  context: DetectionInputs["context"]
): number {
  const sessionStress = Math.min(context.sessionDuration / 360000, 100);
  const idleStress = Math.min(context.idleTime / 300000, 100);

  return (sessionStress + idleStress) / 2;
}

function determineStressLevel(score: number): StressLevel {
  if (score >= STRESS_THRESHOLDS.S3_TO_S4) return 4;
  if (score >= STRESS_THRESHOLDS.S2_TO_S3) return 3;
  if (score >= STRESS_THRESHOLDS.S1_TO_S2) return 2;
  if (score >= STRESS_THRESHOLDS.S0_TO_S1) return 1;
  return 0;
}

function determineStressType(
  inputs: DetectionInputs,
  score: number
): StressType {
  const { keyboard, mouse, posture, context } = inputs;

  if (score < STRESS_THRESHOLDS.S0_TO_S1) return "none";

  if (
    keyboard &&
    keyboard.typingSpeed < 30 &&
    context.sessionDuration > 7200000
  ) {
    return "fatigue";
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (mouse && mouse.jitterIndex > 15 && context.urgentTasks > 3) {
    return "anxiety";
  }

  if (
    context.unreadEmails > 30 &&
    context.urgentTasks > 3 &&
    context.taskSwitchRate > 5
  ) {
    return "overload";
  }

  if (posture && posture.leanAngle < -10 && context.idleTime > 300000) {
    return "withdrawal";
  }

  return "early";
}

export function calculateStress(
  inputs: DetectionInputs,
  baselines: {
    facial: FacialBaseline | null;
    posture: PostureBaseline | null;
    keyboard: { avgWPM: number } | null;
  }
): StressResult {
  const facialStress = calculateFacialStress(inputs.facial, baselines.facial);

  const posturalStress = calculatePosturalStress(
    inputs.posture,
    baselines.posture
  );

  const behavioralStress = calculateBehavioralStress(
    inputs.keyboard,
    inputs.mouse,
    baselines.keyboard
  );
  const contextualLoad = calculateContextualLoad(inputs.context);
  const temporalFactor = calculateTemporalFactor(inputs.context);

  const stressScore =
    facialStress * WEIGHTS.facial +
    behavioralStress * WEIGHTS.behavioral +
    posturalStress * WEIGHTS.postural +
    contextualLoad * WEIGHTS.contextual +
    temporalFactor * WEIGHTS.temporal;

  const level = determineStressLevel(stressScore);
  const type = determineStressType(inputs, stressScore);

  const signals: string[] = [];
  if (facialStress > 50) signals.push("facial_tension");
  if (posturalStress > 50) signals.push("posture_deviation");
  if (behavioralStress > 50) signals.push("behavioral_change");
  if (contextualLoad > 70) signals.push("high_contextual_load");
  if (temporalFactor > 60) signals.push("temporal_fatigue");

  const confidence = Math.min(
    (signals.length / 5) * 0.3 + (stressScore / 100) * 0.7,
    1.0
  );

  return {
    level,
    score: stressScore,
    type,
    confidence,
    signals,
  };
}
