import {
  FilesetResolver,
  FaceLandmarker,
  PoseLandmarker,
  type FaceLandmarkerOptions,
  type PoseLandmarkerOptions,
} from "@mediapipe/tasks-vision";

type WasmFileset = Awaited<
  ReturnType<(typeof FilesetResolver)["forVisionTasks"]>
>;

let visionFilesetResolver: WasmFileset | null = null;

async function getVisionFilesetResolver(): Promise<WasmFileset> {
  if (!visionFilesetResolver) {
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    visionFilesetResolver = fileset;
  }
  return visionFilesetResolver;
}

export async function createFaceLandmarker(): Promise<FaceLandmarker> {
  const vision = await getVisionFilesetResolver();

  const options: FaceLandmarkerOptions = {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: false,
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.3,
    minFacePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  };

  return FaceLandmarker.createFromOptions(vision, options);
}

export async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const vision = await getVisionFilesetResolver();

  const options: PoseLandmarkerOptions = {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };

  return PoseLandmarker.createFromOptions(vision, options);
}
