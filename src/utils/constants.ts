import type { StressLevel } from "@/types";

export const STRESS_THRESHOLDS = {
  S0_TO_S1: 25,
  S1_TO_S2: 45,
  S2_TO_S3: 65,
  S3_TO_S4: 80,
  RECOVERY_THRESHOLD: 20,
} as const;

export const STRESS_LEVEL_LIMITS = {
  0: 24,
  1: 3,
  2: 1,
  3: 1,
  4: 0,
} as const satisfies Record<StressLevel, number>;

export const STATE_TRANSITION_DURATION = 30000;

export const DETECTION_WEIGHTS = {
  keyboard: 0.25,
  mouse: 0.25,
  posture: 0.15,
  context: 0.35,
} as const;

export const CONTEXT_LOAD_WEIGHTS = {
  unreadEmails: 0.3,
  urgentTasks: 0.3,
  taskSwitchRate: 0.2,
  incompleteTasks: 0.2,
} as const;

export const KEYBOARD_STRESS_SIGNALS = {
  BASELINE_SPEED: 100,
  MILD_STRESS_SPEED_MIN: 70,
  MILD_STRESS_SPEED_MAX: 85,
  HIGH_STRESS_SPEED_MAX: 70,
  BASELINE_ERROR_RATE: 3,
  MILD_STRESS_ERROR_MIN: 3,
  MILD_STRESS_ERROR_MAX: 8,
  HIGH_STRESS_ERROR_MIN: 8,
  BASELINE_PAUSE_FREQ: 2,
  MILD_STRESS_PAUSE_MIN: 2,
  MILD_STRESS_PAUSE_MAX: 5,
  HIGH_STRESS_PAUSE_MIN: 5,
} as const;

export const MOUSE_STRESS_SIGNALS = {
  CALM_JITTER_MAX: 5,
  STRESSED_JITTER_MIN: 5,
  STRESSED_JITTER_MAX: 15,
  HIGHLY_STRESSED_JITTER_MIN: 15,
  RAGE_CLICK_THRESHOLD: 3,
} as const;

export const ANIMATION_DURATIONS = {
  FADE_OUT: 300,
  COLOR_SHIFT: 500,
  SCALE_UP: 400,
  MESSAGE_FADE_IN: 600,
  PAGE_TRANSITION: 300,
  BREATHING_INHALE: 4000,
  BREATHING_RETENTION: 7000,
  BREATHING_EXHALE: 8000,
} as const;
