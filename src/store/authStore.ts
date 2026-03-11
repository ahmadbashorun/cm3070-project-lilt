"use client";

import { create } from "zustand";

interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  verificationCodeSent: boolean;
  isLoading: boolean;
  setEmail: (email: string) => Promise<void>;
  setAuthenticated: (authenticated: boolean) => Promise<void>;
  setVerificationCodeSent: (sent: boolean) => void;
  setAuthState: (email: string | null, isAuthenticated: boolean) => void;
  reset: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  email: null,
  isAuthenticated: false,
  verificationCodeSent: false,
  isLoading: true,
  setEmail: async (email) => {
    try {
      await fetch("/api/auth/set-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      set({ email });
    } catch (error) {
      console.error("Failed to set email:", error);
    }
  },
  setAuthenticated: async (authenticated) => {
    try {
      if (authenticated) {
        const state = useAuthStore.getState();
        if (state.email) {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: state.email }),
          });
          set({ isAuthenticated: true });
        }
      } else {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
        set({
          isAuthenticated: false,
          email: null,
          verificationCodeSent: false,
        });
      }
    } catch (error) {
      console.error("Failed to set authentication:", error);
    }
  },
  setVerificationCodeSent: (sent) => {
    set({ verificationCodeSent: sent });
  },
  setAuthState: (email, isAuthenticated) => {
    set({ email, isAuthenticated, isLoading: false });
  },
  reset: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      set({
        email: null,
        isAuthenticated: false,
        verificationCodeSent: false,
      });
    } catch (error) {
      console.error("Failed to reset auth:", error);
    }
  },
  checkAuth: async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = (await response.json()) as {
        email: string | null;
        isAuthenticated: boolean;
      };
      set({
        email: data.email,
        isAuthenticated: data.isAuthenticated,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to check auth:", error);
      set({ isLoading: false });
    }
  },
}));
