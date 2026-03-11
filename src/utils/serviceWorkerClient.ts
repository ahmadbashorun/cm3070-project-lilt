"use client";

import type {
  DetectionInputs,
  StressResult,
  FacialBaseline,
  PostureBaseline,
} from "@/types";

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    serviceWorkerRegistration = registration;
    return registration;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

export function sendToServiceWorker(
  inputs: DetectionInputs,
  baselines: { facial: FacialBaseline | null; posture: PostureBaseline | null },
  onResult: (result: StressResult) => void,
  onError?: (error: Error) => void
): void {
  if (!serviceWorkerRegistration?.active) {
    onError?.(new Error("Service worker not active"));
    return;
  }

  const messageChannel = new MessageChannel();

  messageChannel.port1.onmessage = (event: MessageEvent) => {
    const data = event.data as
      | { type: "STRESS_RESULT"; payload: StressResult }
      | { type: "STRESS_ERROR"; payload: { error: string } };

    if (data.type === "STRESS_RESULT") {
      onResult(data.payload);
    } else {
      onError?.(new Error(data.payload.error));
    }
  };

  serviceWorkerRegistration.active.postMessage(
    {
      type: "CALCULATE_STRESS",
      payload: { inputs, baselines },
    },
    [messageChannel.port2]
  );
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (!serviceWorkerRegistration) {
    return Promise.resolve(false);
  }

  return serviceWorkerRegistration.unregister().then((success) => {
    serviceWorkerRegistration = null;
    return success;
  });
}
