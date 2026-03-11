"use client";

import { useGlobalSearch } from "@/store/searchStore";
import { useEffect } from "react";

/**
 * GlobalSearchListener component that registers a global keyboard shortcut
 * for opening the search modal (Cmd+K on macOS, Ctrl+K on Windows/Linux).
 *
 * This component should be mounted at the root level of the application
 * to ensure the keyboard shortcut works from any page.
 */
export function GlobalSearchListener() {
  const { isOpen, openSearch } = useGlobalSearch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (macOS) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); // Prevent browser's default behavior

        // Only open if not already open (idempotent behavior)
        if (!isOpen) {
          openSearch();
        }
      }
    };

    // Register global keyboard listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, openSearch]);

  // This component doesn't render anything
  return null;
}
