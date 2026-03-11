export type StressLevel = 0 | 1 | 2 | 3 | 4;

export type StressType =
  | "none"
  | "early"
  | "overload"
  | "fatigue"
  | "anxiety"
  | "withdrawal";

export type EmailFolder =
  | "inbox"
  | "starred"
  | "scheduled"
  | "sent"
  | "drafts"
  | "spam"
  | "trash";

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
  priority: number;
  senderImportance: number;
  projectRelevance: number;
  deadlineProximity: number;
  urgency: number;
  folder?: EmailFolder;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status:
    | "todo"
    | "in-progress"
    | "done"
    | "completed"
    | "backlog"
    | "ready"
    | "review";
  priority: "P0" | "P1" | "P2" | "P3";
  dueDate: Date | null;
  source: "external" | "internal";
  project: string;
  assignee: string;
  subtasks?: Subtask[];
}

export interface KeyboardMetrics {
  typingSpeed: number;
  errorRate: number;
  pauseFrequency: number;
  rhythmVariance: number;
}

export interface KeyboardBaseline {
  avgWPM: number;
  avgInterKeyInterval: number;
  rhythmVariance: number;
  errorRate: number;
}

export interface MouseMetrics {
  avgVelocity: number;
  jitterIndex: number;
  clickFrequency: number;
  hoverHesitation: number;
  scrollIntensity: number;
}

export interface PostureMetrics {
  leanAngle: number;
  shoulderTension: number;
  headDrop: number;
  movementLevel: number;
}

export interface FacialBaseline {
  eyeAspectRatio: number;
  mouthAspectRatio: number;
  browPosition: number;
  headPose: { yaw: number; pitch: number; roll: number };
  landmarkPositions: number[][];
  timestamp: Date;
}

export interface PostureBaseline {
  shoulderY: number;
  noseY: number;
  leanAngle: number;
  spineAngle: number;
  shoulderAlignment: number;
  landmarkPositions: number[][];
  timestamp: Date;
}

export interface ContextualLoad {
  unreadEmails: number;
  urgentTasks: number;
  taskSwitchRate: number;
  incompleteTasks: number;
  deadlinePressure: number;
  externalTaskRatio: number;
  sessionDuration: number;
  idleTime: number;
  contextLoad: number;
}

export interface StressResult {
  level: StressLevel;
  score: number;
  type: StressType;
  confidence: number;
  signals: string[];
}

export interface FacialMetrics {
  eyeAspectRatio: number;
  mouthAspectRatio: number;
  browPosition: number;
  headPose: { yaw: number; pitch: number; roll: number };
}

export interface DetectionInputs {
  keyboard: KeyboardMetrics | null;
  mouse: MouseMetrics;
  posture: PostureMetrics | null;
  facial: FacialMetrics | null;
  context: ContextualLoad;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface DetectionPreferences {
  typingAndMouse: boolean;
  posture: boolean;
  facialExpression: boolean;
  emailContext: boolean;
}

export interface CalibrationState {
  keyboard: KeyboardBaseline | null;
  posture: PostureBaseline | null;
  facial: FacialBaseline | null;
  skipped: {
    keyboard: boolean;
    posture: boolean;
    facial: boolean;
  };
}

export interface OnboardingState {
  user: User;
  detectionPreferences: DetectionPreferences;
  calibration: CalibrationState;
  onboardingComplete: boolean;
}

export type TaskImportFormat = "jira" | "linear" | "asana" | "generic";

export interface TaskColumnMap {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  source?: string;
  project?: string;
  assignee?: string;
}
