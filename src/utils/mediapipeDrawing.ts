import type { NormalizedLandmark } from "@/types/mediapipe";

/**
 * Converts normalized coordinates (0-1) to canvas pixel coordinates
 */
function normalizedToCanvas(
  normalized: NormalizedLandmark,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: normalized.x * canvasWidth,
    y: normalized.y * canvasHeight,
  };
}

/**
 * Draws a circle at the given point
 */
function drawPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 2,
  color: string = "#00ff00"
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

/**
 * Draws a line between two points
 */
function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = "#00ff00",
  lineWidth: number = 1
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Face landmark indices for key features
const FACE_CONTOUR_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

const LEFT_EYE_INDICES = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];

const RIGHT_EYE_INDICES = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
  398,
];

const MOUTH_OUTLINE_INDICES = [
  61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318,
];

const LEFT_BROW_INDICES = [107, 55, 65, 52, 53, 46];
const RIGHT_BROW_INDICES = [336, 296, 334, 293, 300, 276];

/**
 * Draws face landmarks on the canvas
 */
export function drawFaceLandmarks(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  videoWidth: number,
  videoHeight: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || landmarks.length === 0) return;

  // Scale canvas to match video dimensions
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw face contour
  if (FACE_CONTOUR_INDICES.length > 0) {
    const firstIdx = FACE_CONTOUR_INDICES[0];
    const firstLandmark =
      firstIdx !== undefined ? landmarks[firstIdx] : undefined;
    if (firstLandmark) {
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const firstPoint = normalizedToCanvas(
        firstLandmark,
        canvas.width,
        canvas.height
      );
      ctx.moveTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < FACE_CONTOUR_INDICES.length; i++) {
        const idx = FACE_CONTOUR_INDICES[i];
        const landmark = idx !== undefined ? landmarks[idx] : undefined;
        if (landmark) {
          const point = normalizedToCanvas(
            landmark,
            canvas.width,
            canvas.height
          );
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Draw left eye
  for (let i = 0; i < LEFT_EYE_INDICES.length; i++) {
    const idx = LEFT_EYE_INDICES[i];
    const landmark = idx !== undefined ? landmarks[idx] : undefined;
    if (landmark) {
      const point = normalizedToCanvas(landmark, canvas.width, canvas.height);
      drawPoint(ctx, point.x, point.y, 2, "#00ffff");
    }
  }

  // Draw right eye
  for (let i = 0; i < RIGHT_EYE_INDICES.length; i++) {
    const idx = RIGHT_EYE_INDICES[i];
    const landmark = idx !== undefined ? landmarks[idx] : undefined;
    if (landmark) {
      const point = normalizedToCanvas(landmark, canvas.width, canvas.height);
      drawPoint(ctx, point.x, point.y, 2, "#00ffff");
    }
  }

  // Draw mouth outline
  if (MOUTH_OUTLINE_INDICES.length > 0) {
    const firstIdx = MOUTH_OUTLINE_INDICES[0];
    const firstLandmark =
      firstIdx !== undefined ? landmarks[firstIdx] : undefined;
    if (firstLandmark) {
      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const firstPoint = normalizedToCanvas(
        firstLandmark,
        canvas.width,
        canvas.height
      );
      ctx.moveTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < MOUTH_OUTLINE_INDICES.length; i++) {
        const idx = MOUTH_OUTLINE_INDICES[i];
        const landmark = idx !== undefined ? landmarks[idx] : undefined;
        if (landmark) {
          const point = normalizedToCanvas(
            landmark,
            canvas.width,
            canvas.height
          );
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Draw brows
  for (let i = 0; i < LEFT_BROW_INDICES.length; i++) {
    const idx = LEFT_BROW_INDICES[i];
    const landmark = idx !== undefined ? landmarks[idx] : undefined;
    if (landmark) {
      const point = normalizedToCanvas(landmark, canvas.width, canvas.height);
      drawPoint(ctx, point.x, point.y, 2, "#ffff00");
    }
  }

  for (let i = 0; i < RIGHT_BROW_INDICES.length; i++) {
    const idx = RIGHT_BROW_INDICES[i];
    const landmark = idx !== undefined ? landmarks[idx] : undefined;
    if (landmark) {
      const point = normalizedToCanvas(landmark, canvas.width, canvas.height);
      drawPoint(ctx, point.x, point.y, 2, "#ffff00");
    }
  }
}

// Pose landmark connections (skeleton structure)
// Based on MediaPipe Pose landmarker standard connections
const POSE_CONNECTIONS = [
  // Face (simplified - nose to eyes)
  [0, 2], // Nose to left eye
  [0, 5], // Nose to right eye
  [2, 4], // Left eye to left eye outer
  [5, 7], // Right eye to right eye outer
  // Upper body
  [11, 12], // Shoulders
  [11, 13], // Left shoulder to left elbow
  [13, 15], // Left elbow to left wrist
  [12, 14], // Right shoulder to right elbow
  [14, 16], // Right elbow to right wrist
  // Torso
  [11, 23], // Left shoulder to left hip
  [12, 24], // Right shoulder to right hip
  [23, 24], // Hips
  // Lower body
  [23, 25], // Left hip to left knee
  [25, 27], // Left knee to left ankle
  [24, 26], // Right hip to right knee
  [26, 28], // Right knee to right ankle
] as const;

/**
 * Draws pose landmarks on the canvas
 */
export function drawPoseLandmarks(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  videoWidth: number,
  videoHeight: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || landmarks.length === 0) return;

  // Scale canvas to match video dimensions
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connections (skeleton)
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 2;
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (start && end && start.visibility && end.visibility) {
      const startPoint = normalizedToCanvas(start, canvas.width, canvas.height);
      const endPoint = normalizedToCanvas(end, canvas.width, canvas.height);
      drawLine(
        ctx,
        startPoint.x,
        startPoint.y,
        endPoint.x,
        endPoint.y,
        "#00ff00",
        2
      );
    }
  }

  // Draw key points
  const keyPoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  for (const idx of keyPoints) {
    const landmark = landmarks[idx];
    if (landmark && landmark.visibility && landmark.visibility > 0.5) {
      const point = normalizedToCanvas(landmark, canvas.width, canvas.height);
      const color = idx === 0 ? "#ff0000" : "#00ffff"; // Red for nose, cyan for others
      drawPoint(ctx, point.x, point.y, 4, color);
    }
  }
}

/**
 * Clears the canvas
 */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
