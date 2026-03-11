import type { FacialBaseline } from "@/types";
import type { NormalizedLandmark } from "@/types/mediapipe";

const EYE_INDICES = {
  left: [
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  ],
  right: [
    362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
    398,
  ],
};

const MOUTH_INDICES = {
  top: [13, 14, 15, 16, 17, 18],
  bottom: [17, 18, 19, 20, 21, 22],
  left: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308],
  right: [291, 409, 270, 269, 267, 0, 269, 267, 0, 37],
};

const BROW_INDICES = {
  left: [107, 55, 65, 52, 53, 46],
  right: [336, 296, 334, 293, 300, 276],
};

function calculateDistance(
  point1: NormalizedLandmark,
  point2: NormalizedLandmark
): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateEyeAspectRatio(
  landmarks: NormalizedLandmark[],
  eyeIndices: number[]
): number {
  const eyePoints = eyeIndices
    .map((idx) => landmarks[idx])
    .filter((p): p is NormalizedLandmark => p !== undefined);
  if (eyePoints.length < 6) return 0;

  const p1 = eyePoints[1];
  const p2 = eyePoints[5];
  const p3 = eyePoints[2];
  const p4 = eyePoints[4];
  const p0 = eyePoints[0];
  const p5 = eyePoints[3];

  if (!p1 || !p2 || !p3 || !p4 || !p0 || !p5) return 0;

  const vertical1 = calculateDistance(p1, p2);
  const vertical2 = calculateDistance(p3, p4);
  const horizontal = calculateDistance(p0, p5);

  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2 * horizontal);
}

function calculateMouthAspectRatio(landmarks: NormalizedLandmark[]): number {
  const topPoints = MOUTH_INDICES.top
    .map((idx) => landmarks[idx])
    .filter((p): p is NormalizedLandmark => p !== undefined);
  const bottomPoints = MOUTH_INDICES.bottom
    .map((idx) => landmarks[idx])
    .filter((p): p is NormalizedLandmark => p !== undefined);

  if (topPoints.length === 0 || bottomPoints.length === 0) return 0;

  const topCenter = {
    x: topPoints.reduce((sum, p) => sum + p.x, 0) / topPoints.length,
    y: topPoints.reduce((sum, p) => sum + p.y, 0) / topPoints.length,
  };
  const bottomCenter = {
    x: bottomPoints.reduce((sum, p) => sum + p.x, 0) / bottomPoints.length,
    y: bottomPoints.reduce((sum, p) => sum + p.y, 0) / bottomPoints.length,
  };
  const leftMouthIndex = MOUTH_INDICES.left[0];
  const rightMouthIndex = MOUTH_INDICES.right[0];
  if (!leftMouthIndex || !rightMouthIndex) return 0;

  const leftMouth = landmarks[leftMouthIndex];
  const rightMouth = landmarks[rightMouthIndex];
  if (!leftMouth || !rightMouth) return 0;

  const vertical = Math.abs(topCenter.y - bottomCenter.y);
  const horizontal = calculateDistance(leftMouth, rightMouth);

  if (horizontal === 0) return 0;
  return vertical / horizontal;
}

function calculateBrowPosition(landmarks: NormalizedLandmark[]): number {
  const leftBrow = BROW_INDICES.left.map((idx) => landmarks[idx]);
  const rightBrow = BROW_INDICES.right.map((idx) => landmarks[idx]);

  if (leftBrow.length === 0 || rightBrow.length === 0) return 0;

  const leftAvg =
    leftBrow.reduce((sum, p) => sum + (p?.y ?? 0), 0) / leftBrow.length;
  const rightAvg =
    rightBrow.reduce((sum, p) => sum + (p?.y ?? 0), 0) / rightBrow.length;

  return (leftAvg + rightAvg) / 2;
}

function calculateHeadPose(landmarks: NormalizedLandmark[]): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  const noseTip = landmarks[1];
  const chin = landmarks[175];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  if (!noseTip || !chin || !leftEye || !rightEye) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };

  const yaw =
    Math.atan2(rightEye.x - leftEye.x, rightEye.y - leftEye.y) *
    (180 / Math.PI);

  const pitch =
    Math.atan2(noseTip.y - eyeCenter.y, Math.abs(noseTip.x - eyeCenter.x)) *
    (180 / Math.PI);

  const roll =
    Math.atan2(chin.y - noseTip.y, chin.x - noseTip.x) * (180 / Math.PI);

  return { yaw, pitch, roll };
}

export function extractFacialMetrics(landmarks: NormalizedLandmark[]): {
  eyeAspectRatio: number;
  mouthAspectRatio: number;
  browPosition: number;
  headPose: { yaw: number; pitch: number; roll: number };
} {
  const leftEAR = calculateEyeAspectRatio(landmarks, EYE_INDICES.left);
  const rightEAR = calculateEyeAspectRatio(landmarks, EYE_INDICES.right);
  const eyeAspectRatio = (leftEAR + rightEAR) / 2;

  const mouthAspectRatio = calculateMouthAspectRatio(landmarks);
  const browPosition = calculateBrowPosition(landmarks);
  const headPose = calculateHeadPose(landmarks);

  return {
    eyeAspectRatio,
    mouthAspectRatio,
    browPosition,
    headPose,
  };
}

export function calculateFacialBaseline(
  metricsArray: Array<{
    eyeAspectRatio: number;
    mouthAspectRatio: number;
    browPosition: number;
    headPose: { yaw: number; pitch: number; roll: number };
    landmarkPositions: number[][];
  }>
): FacialBaseline {
  const sortedEAR = metricsArray
    .map((m) => m.eyeAspectRatio)
    .sort((a, b) => a - b);
  const sortedMAR = metricsArray
    .map((m) => m.mouthAspectRatio)
    .sort((a, b) => a - b);
  const sortedBrow = metricsArray
    .map((m) => m.browPosition)
    .sort((a, b) => a - b);

  const medianIndex = Math.floor(sortedEAR.length / 2);

  const sortedYaw = metricsArray
    .map((m) => m.headPose.yaw)
    .sort((a, b) => a - b);
  const sortedPitch = metricsArray
    .map((m) => m.headPose.pitch)
    .sort((a, b) => a - b);
  const sortedRoll = metricsArray
    .map((m) => m.headPose.roll)
    .sort((a, b) => a - b);

  const medianYaw = sortedYaw[medianIndex] ?? 0;
  const medianPitch = sortedPitch[medianIndex] ?? 0;
  const medianRoll = sortedRoll[medianIndex] ?? 0;

  return {
    eyeAspectRatio: sortedEAR[medianIndex] ?? 0,
    mouthAspectRatio: sortedMAR[medianIndex] ?? 0,
    browPosition: sortedBrow[medianIndex] ?? 0,
    headPose: {
      yaw: medianYaw,
      pitch: medianPitch,
      roll: medianRoll,
    },
    landmarkPositions: metricsArray[medianIndex]?.landmarkPositions || [],
    timestamp: new Date(),
  };
}
