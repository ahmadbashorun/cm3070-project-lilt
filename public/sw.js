self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", async (event) => {
  if (event.data.type === "CALCULATE_STRESS") {
    try {
      const { inputs, baselines } = event.data.payload;

      const result = calculateStress(inputs, baselines);

      event.ports[0].postMessage({
        type: "STRESS_RESULT",
        payload: result,
      });
    } catch (error) {
      event.ports[0].postMessage({
        type: "STRESS_ERROR",
        payload: { error: error.message },
      });
    }
  }
});

function calculateStress(inputs, baselines) {
  const WEIGHTS = {
    facial: 0.25,
    behavioral: 0.2,
    postural: 0.15,
    contextual: 0.3,
    temporal: 0.1,
  };

  const STRESS_THRESHOLDS = {
    S0_TO_S1: 25,
    S1_TO_S2: 45,
    S2_TO_S3: 65,
    S3_TO_S4: 80,
  };

  function calculateFacialStress(currentMetrics, baseline) {
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

  function calculatePosturalStress(currentMetrics, baseline) {
    if (!currentMetrics || !baseline) return 0;
    const leanDeviation = Math.abs(
      currentMetrics.leanAngle - baseline.leanAngle
    );
    const shoulderDeviation = Math.abs(
      currentMetrics.shoulderTension - baseline.shoulderAlignment
    );
    const leanStress = Math.min(leanDeviation * 2, 100);
    const shoulderStress = Math.min(shoulderDeviation * 100, 100);
    return (leanStress + shoulderStress) / 2;
  }

  function calculateBehavioralStress(keyboard, mouse) {
    let stress = 0;
    let factors = 0;
    if (keyboard) {
      const speedDeviation = Math.abs(keyboard.typingSpeed - 60) / 60;
      const errorStress = Math.min(keyboard.errorRate * 10, 100);
      stress += speedDeviation * 50 + errorStress;
      factors += 2;
    }
    if (mouse) {
      const jitterStress = Math.min(mouse.jitterIndex * 5, 100);
      const velocityStress = Math.min(mouse.avgVelocity / 10, 100);
      stress += jitterStress + velocityStress;
      factors += 2;
    }
    return factors > 0 ? stress / factors : 0;
  }

  function calculateContextualLoad(context) {
    const emailLoad = Math.min((context.unreadEmails / 50) * 100, 100);
    const taskLoad = Math.min((context.urgentTasks / 5) * 100, 100);
    const switchLoad = Math.min((context.taskSwitchRate / 10) * 100, 100);
    const incompleteLoad = Math.min((context.incompleteTasks / 10) * 100, 100);
    return (
      emailLoad * 0.3 + taskLoad * 0.3 + switchLoad * 0.2 + incompleteLoad * 0.2
    );
  }

  function calculateTemporalFactor(context) {
    const sessionStress = Math.min(context.sessionDuration / 360000, 100);
    const idleStress = Math.min(context.idleTime / 300000, 100);
    return (sessionStress + idleStress) / 2;
  }

  function determineStressLevel(score) {
    if (score >= STRESS_THRESHOLDS.S3_TO_S4) return 4;
    if (score >= STRESS_THRESHOLDS.S2_TO_S3) return 3;
    if (score >= STRESS_THRESHOLDS.S1_TO_S2) return 2;
    if (score >= STRESS_THRESHOLDS.S0_TO_S1) return 1;
    return 0;
  }

  const facialStress = calculateFacialStress(
    inputs.posture
      ? { eyeAspectRatio: 0, mouthAspectRatio: 0, browPosition: 0 }
      : null,
    baselines.facial
  );
  const posturalStress = calculatePosturalStress(
    inputs.posture,
    baselines.posture
  );
  const behavioralStress = calculateBehavioralStress(
    inputs.keyboard,
    inputs.mouse
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
  const signals = [];
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
    type: "early",
    confidence,
    signals,
  };
}
