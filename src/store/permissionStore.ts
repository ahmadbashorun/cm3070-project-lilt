"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PermissionState = "granted" | "denied" | "prompt" | "unavailable";

interface PermissionStore {
  cameraPermission: PermissionState;
  lastChecked: number;
  checkCameraPermission: () => Promise<PermissionState>;
  setCameraPermission: (state: PermissionState) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      cameraPermission: "prompt",
      lastChecked: 0,
      checkCameraPermission: async (): Promise<PermissionState> => {
        const now = Date.now();
        const state = get();

        // Return cached value if recent
        if (
          now - state.lastChecked < CACHE_DURATION &&
          state.cameraPermission !== "prompt"
        ) {
          return state.cameraPermission;
        }

        // Check if browser supports permissions API
        if (
          typeof navigator !== "undefined" &&
          "permissions" in navigator &&
          "query" in navigator.permissions
        ) {
          try {
            const result = await navigator.permissions.query({
              name: "camera" as PermissionName,
            });
            const permissionState: PermissionState =
              result.state === "granted"
                ? "granted"
                : result.state === "denied"
                ? "denied"
                : "prompt";

            set({
              cameraPermission: permissionState,
              lastChecked: now,
            });

            // Listen for permission changes
            result.onchange = () => {
              const newState: PermissionState =
                result.state === "granted"
                  ? "granted"
                  : result.state === "denied"
                  ? "denied"
                  : "prompt";
              set({
                cameraPermission: newState,
                lastChecked: Date.now(),
              });
            };

            return permissionState;
          } catch {
            // Permissions API not supported or failed
          }
        }

        // Fallback: check if getUserMedia is available
        if (
          typeof navigator !== "undefined" &&
          "mediaDevices" in navigator &&
          "getUserMedia" in navigator.mediaDevices
        ) {
          try {
            // Try to get media stream (will trigger prompt if needed)
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            set({
              cameraPermission: "granted",
              lastChecked: now,
            });
            return "granted";
          } catch (err) {
            const error = err as DOMException;
            if (error.name === "NotAllowedError") {
              set({
                cameraPermission: "denied",
                lastChecked: now,
              });
              return "denied";
            }
            if (error.name === "NotFoundError") {
              set({
                cameraPermission: "unavailable",
                lastChecked: now,
              });
              return "unavailable";
            }
            set({
              cameraPermission: "prompt",
              lastChecked: now,
            });
            return "prompt";
          }
        }

        set({
          cameraPermission: "unavailable",
          lastChecked: now,
        });
        return "unavailable";
      },
      setCameraPermission: (state: PermissionState) => {
        set({
          cameraPermission: state,
          lastChecked: Date.now(),
        });
      },
    }),
    {
      name: "permission-storage",
      partialize: (state) => ({
        cameraPermission: state.cameraPermission,
        lastChecked: state.lastChecked,
      }),
    }
  )
);
