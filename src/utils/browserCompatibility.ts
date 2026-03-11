"use client";

export function checkBrowserCompatibility(): {
  mediaPipeSupported: boolean;
  serviceWorkerSupported: boolean;
  cameraSupported: boolean;
  webGLSupported: boolean;
} {
  if (typeof window === "undefined") {
    return {
      mediaPipeSupported: false,
      serviceWorkerSupported: false,
      cameraSupported: false,
      webGLSupported: false,
    };
  }

  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  const hasMediaDevices =
    "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;

  return {
    mediaPipeSupported: true,
    serviceWorkerSupported: "serviceWorker" in navigator,
    cameraSupported: hasMediaDevices,
    webGLSupported: !!gl,
  };
}

export function loadPolyfills(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const needsPolyfills =
      typeof Array.from === "undefined" ||
      typeof Promise === "undefined" ||
      typeof Object.assign === "undefined" ||
      typeof String.prototype.includes === "undefined";

    if (!needsPolyfills) {
      resolve();
      return;
    }

    void Promise.all([
      // @ts-expect-error - core-js may not have types
      import("core-js/stable").catch(() => {
        /* Polyfill import failed, continue anyway */
      }),
      // @ts-expect-error - regenerator-runtime may not have types
      import("regenerator-runtime/runtime").catch(() => {
        /* Polyfill import failed, continue anyway */
      }),
    ]).then(() => {
      resolve();
    });
  });
}

export function isHTTPS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}
