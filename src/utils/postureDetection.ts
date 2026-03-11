import type { PostureBaseline } from "@/types";
import type { NormalizedLandmark } from "@/types/mediapipe";

const POSE_LANDMARKS = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
};

function calculateDistance(
  point1: NormalizedLandmark,
  point2: NormalizedLandmark
): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateAngle(
  p1: NormalizedLandmark,
  p2: NormalizedLandmark,
  p3: NormalizedLandmark
): number {
  const a = calculateDistance(p2, p3);
  const b = calculateDistance(p1, p3);
  const c = calculateDistance(p1, p2);

  if (a === 0 || b === 0) return 0;

  const angle = Math.acos((a * a + b * b - c * c) / (2 * a * b));
  return angle * (180 / Math.PI);
}

export function extractPostureMetrics(landmarks: NormalizedLandmark[]): {
  shoulderY: number;
  noseY: number;
  leanAngle: number;
  spineAngle: number;
  shoulderAlignment: number;
} {
  const nose = landmarks[POSE_LANDMARKS.nose];
  const leftShoulder = landmarks[POSE_LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[POSE_LANDMARKS.rightShoulder];
  const leftHip = landmarks[POSE_LANDMARKS.leftHip];
  const rightHip = landmarks[POSE_LANDMARKS.rightHip];

  if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      shoulderY: 0.5,
      noseY: 0.3,
      leanAngle: 0,
      spineAngle: 90,
      shoulderAlignment: 0,
    };
  }

  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const noseY = nose.y;

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: shoulderY,
  };
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const leanAngle =
    Math.atan2(shoulderCenter.y - hipCenter.y, shoulderCenter.x - hipCenter.x) *
      (180 / Math.PI) -
    90;

  const spineAngle = calculateAngle(
    { x: shoulderCenter.x, y: shoulderCenter.y, z: 0, visibility: 1 },
    { x: hipCenter.x, y: hipCenter.y, z: 0, visibility: 1 },
    { x: hipCenter.x, y: hipCenter.y + 1, z: 0, visibility: 1 }
  );

  const shoulderAlignment = Math.abs(leftShoulder.y - rightShoulder.y);

  return {
    shoulderY,
    noseY,
    leanAngle,
    spineAngle,
    shoulderAlignment,
  };
}

export function calculatePostureBaseline(
  metricsArray: Array<{
    shoulderY: number;
    noseY: number;
    leanAngle: number;
    spineAngle: number;
    shoulderAlignment: number;
    landmarkPositions: number[][];
  }>
): PostureBaseline {
  const sortedShoulderY = metricsArray
    .map((m) => m.shoulderY)
    .sort((a, b) => a - b);
  const sortedNoseY = metricsArray.map((m) => m.noseY).sort((a, b) => a - b);
  const sortedLeanAngle = metricsArray
    .map((m) => m.leanAngle)
    .sort((a, b) => a - b);
  const sortedSpineAngle = metricsArray
    .map((m) => m.spineAngle)
    .sort((a, b) => a - b);
  const sortedShoulderAlignment = metricsArray
    .map((m) => m.shoulderAlignment)
    .sort((a, b) => a - b);

  const medianIndex = Math.floor(sortedShoulderY.length / 2);

  return {
    shoulderY: sortedShoulderY[medianIndex] ?? 0,
    noseY: sortedNoseY[medianIndex] ?? 0,
    leanAngle: sortedLeanAngle[medianIndex] ?? 0,
    spineAngle: sortedSpineAngle[medianIndex] ?? 0,
    shoulderAlignment: sortedShoulderAlignment[medianIndex] ?? 0,
    landmarkPositions: metricsArray[medianIndex]?.landmarkPositions || [],
    timestamp: new Date(),
  };
}
