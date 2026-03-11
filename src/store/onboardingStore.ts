import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OnboardingState,
  KeyboardBaseline,
  PostureBaseline,
  FacialBaseline,
  DetectionPreferences,
  User,
} from "@/types";

interface OnboardingStore extends OnboardingState {
  setUser: (user: Partial<User>) => void;
  setDetectionPreferences: (preferences: Partial<DetectionPreferences>) => void;
  setKeyboardBaseline: (baseline: KeyboardBaseline | null) => void;
  setPostureBaseline: (baseline: PostureBaseline | null) => void;
  setFacialBaseline: (baseline: FacialBaseline | null) => void;
  setKeyboardSkipped: (skipped: boolean) => void;
  setPostureSkipped: (skipped: boolean) => void;
  setFacialSkipped: (skipped: boolean) => void;
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  reset: () => void;
}

const initialUser: User = {
  id: "",
  name: "",
  email: "",
};

const initialPreferences: DetectionPreferences = {
  typingAndMouse: false,
  posture: false,
  facialExpression: false,
  emailContext: false,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      user: initialUser,
      detectionPreferences: initialPreferences,
      calibration: {
        keyboard: null,
        posture: null,
        facial: null,
        skipped: {
          keyboard: false,
          posture: false,
          facial: false,
        },
      },
      onboardingComplete: false,
      setUser: (userUpdate) => {
        set((state) => {
          const updatedUser = { ...state.user };
          if ("name" in userUpdate) {
            updatedUser.name = userUpdate.name ?? "";
          }
          if ("email" in userUpdate) {
            updatedUser.email = userUpdate.email ?? "";
          }
          if ("avatar" in userUpdate) {
            updatedUser.avatar = userUpdate.avatar;
          }
          return { user: updatedUser };
        });
      },
      setDetectionPreferences: (preferences) => {
        set((state) => ({
          detectionPreferences: {
            ...state.detectionPreferences,
            ...preferences,
          },
        }));
      },
      setKeyboardBaseline: (baseline) => {
        set((state) => ({
          calibration: {
            ...state.calibration,
            keyboard: baseline,
            skipped: { ...state.calibration.skipped, keyboard: false },
          },
        }));
      },
      setPostureBaseline: (baseline) => {
        set((state) => ({
          calibration: {
            ...state.calibration,
            posture: baseline,
            skipped: { ...state.calibration.skipped, posture: false },
          },
        }));
      },
      setFacialBaseline: (baseline) => {
        set((state) => ({
          calibration: {
            ...state.calibration,
            facial: baseline,
            skipped: { ...state.calibration.skipped, facial: false },
          },
        }));
      },
      setKeyboardSkipped: (skipped) => {
        set((state) => ({
          calibration: {
            ...state.calibration,
            skipped: { ...state.calibration.skipped, keyboard: skipped },
          },
        }));
      },
      setPostureSkipped: (skipped) => {
        set((state) => ({
          calibration: {
            ...state.calibration,
            skipped: { ...state.calibration.skipped, posture: skipped },
          },
        }));
      },
      setFacialSkipped: (skipped) => {
        set((state) => ({
          calibration: {
            ...state.calibration,
            skipped: { ...state.calibration.skipped, facial: skipped },
          },
        }));
      },
      setOnboardingComplete: async (complete) => {
        set({ onboardingComplete: complete });
        if (complete) {
          try {
            await fetch("/api/onboarding/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ complete: true }),
            });
          } catch (error) {
            console.error("Failed to set onboarding cookie:", error);
          }
        }
      },
      reset: () => {
        set({
          user: initialUser,
          detectionPreferences: initialPreferences,
          calibration: {
            keyboard: null,
            posture: null,
            facial: null,
            skipped: {
              keyboard: false,
              posture: false,
              facial: false,
            },
          },
          onboardingComplete: false,
        });
      },
    }),
    {
      name: "onboarding-storage",
      migrate: (persistedState: unknown) => {
        const state = persistedState as Partial<OnboardingStore>;
        if (state.calibration) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!state.calibration.skipped) {
            state.calibration.skipped = {
              keyboard: false,
              posture: false,
              facial: false,
            };
          }
        }
        return state as OnboardingStore;
      },
    }
  )
);
