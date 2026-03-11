"use client";

import { create } from "zustand";
import type { User } from "@/types";

interface UserStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/user");
      if (!response.ok) {
        if (response.status === 401) {
          set({ user: null, isLoading: false, error: null });
          return;
        }
        throw new Error("Failed to fetch user");
      }
      const user = (await response.json()) as User;
      set({ user, isLoading: false, error: null });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      set({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
      });
    }
  },
  clearUser: () => {
    set({ user: null, error: null });
  },
}));
