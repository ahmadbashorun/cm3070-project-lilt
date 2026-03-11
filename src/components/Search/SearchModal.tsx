"use client";

import { useDataStore } from "@/store/dataStore";
import { useGlobalSearch } from "@/store/searchStore";
import { Email, Task } from "@/types";
import {
  addItem as addRecentItem,
  getRecentItems,
} from "@/utils/recentItemsTracker";
import { searchEngine } from "@/utils/searchEngine";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchInput } from "./SearchInput";
import styles from "./SearchModal.module.scss";
import { SearchResults } from "./SearchResults";

export function SearchModal() {
  const { isOpen, closeSearch } = useGlobalSearch();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentItemsData, setRecentItemsData] = useState<
    Array<{ item: Email | Task; type: "email" | "task"; timestamp: number }>
  >([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Get emails and tasks from data store
  const emails = useDataStore((state) => state.emails);
  const tasks = useDataStore((state) => state.tasks);

  // Stress level awareness (Requirements 7.1-7.5):
  // The modal works consistently across all stress levels (0-4) without special handling.
  // It maintains state when stress level changes and functions identically at all levels.
  // No stress-specific UI adaptations are needed for the search modal.
  // The stress level is available via useStressStore if needed in the future.

  // Load recent items from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const items = getRecentItems(emails, tasks);
      setRecentItemsData(items);
    }
  }, [isOpen, emails, tasks]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      setIsSearching(false);
      setSearchError(null);
      return [];
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const results = searchEngine.search(searchQuery, emails, tasks);
      setIsSearching(false);
      return results;
    } catch (error) {
      setIsSearching(false);
      setSearchError("An error occurred while searching. Please try again.");
      console.error("Search error:", error);
      return [];
    }
  }, [searchQuery, emails, tasks]);

  const handleItemClick = useCallback(
    (item: Email | Task, type: "email" | "task") => {
      addRecentItem(item, type);

      if (type === "email") {
        router.push(`/emails/${item.id}`);
      } else {
        router.push(`/tasks/${item.id}`);
      }

      closeSearch();
    },
    [router, closeSearch]
  );

  // Handle ESC key to close modal and arrow keys for navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the current list of items (either search results or recent items)
      const currentItems =
        searchQuery.trim() !== ""
          ? searchResults
          : recentItemsData.map((r) => ({
              type: r.type,
              item: r.item,
            }));

      if (e.key === "Escape") {
        closeSearch();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          if (currentItems.length === 0) return -1;
          return prev < currentItems.length - 1 ? prev + 1 : prev;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          if (currentItems.length === 0) return -1;
          return prev > 0 ? prev - 1 : 0;
        });
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const currentItem = currentItems[focusedIndex];
        if (currentItem) {
          const { item, type } = currentItem;
          handleItemClick(item, type);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    closeSearch,
    searchQuery,
    searchResults,
    recentItemsData,
    focusedIndex,
    handleItemClick,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };

    // Use setTimeout to avoid closing immediately on the same click that opened the modal
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeSearch]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Clear search query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Reset focused index when search query changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery]);

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.backdrop}>
      <div className={styles.modal} ref={modalRef}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search any tasks or emails"
        />
        <SearchResults
          query={searchQuery}
          results={searchResults}
          recentItems={recentItemsData}
          onItemClick={handleItemClick}
          focusedIndex={focusedIndex}
          isLoading={isSearching}
          error={searchError}
        />
      </div>
    </div>
  );

  // Render as portal to document.body
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
