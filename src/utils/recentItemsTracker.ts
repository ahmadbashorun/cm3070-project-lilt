import { Email, Task } from "@/types";

export interface RecentItem {
  id: string;
  type: "email" | "task";
  timestamp: number;
}

const RECENT_ITEMS_KEY = "global-search-recent-items";
const MAX_RECENT_ITEMS = 9;

// In-memory fallback storage when localStorage is unavailable
let inMemoryStorage: RecentItem[] = [];
let useInMemoryFallback = false;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load recent items from storage (localStorage or in-memory fallback)
 */
function loadFromStorage(): RecentItem[] {
  // Check if we should use in-memory fallback
  if (!isLocalStorageAvailable()) {
    if (!useInMemoryFallback) {
      console.warn(
        "localStorage is unavailable. Recent items will not persist across sessions."
      );
      useInMemoryFallback = true;
    }
    return inMemoryStorage;
  }

  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) {
      return [];
    }

    const items = JSON.parse(stored) as unknown;

    // Validate the data structure
    if (!Array.isArray(items)) {
      throw new Error("Invalid data structure: expected array");
    }

    // Validate each item has required fields
    for (const item of items) {
      if (
        !item ||
        typeof item !== "object" ||
        typeof (item as { id?: unknown }).id !== "string" ||
        ((item as { type?: unknown }).type !== "email" &&
          (item as { type?: unknown }).type !== "task") ||
        typeof (item as { timestamp?: unknown }).timestamp !== "number"
      ) {
        throw new Error("Invalid item structure");
      }
    }

    return items as RecentItem[];
  } catch (error) {
    console.warn("Failed to load recent items (corrupted data):", error);
    // Clear corrupted data and reinitialize
    try {
      localStorage.removeItem(RECENT_ITEMS_KEY);
    } catch {
      // Ignore errors when clearing
    }
    return [];
  }
}

/**
 * Save recent items to storage (localStorage or in-memory fallback)
 */
function saveToStorage(items: RecentItem[]): void {
  if (useInMemoryFallback) {
    inMemoryStorage = items;
    return;
  }

  try {
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to save recent items to localStorage:", error);
    // Fall back to in-memory storage
    useInMemoryFallback = true;
    inMemoryStorage = items;
  }
}

/**
 * Add an item to the recent items list
 * - Prepends the item to the list
 * - Removes duplicates (same id and type)
 * - Trims the list to MAX_RECENT_ITEMS (9)
 */
export function addItem(item: Email | Task, type: "email" | "task"): void {
  const newItem: RecentItem = {
    id: item.id,
    type,
    timestamp: Date.now(),
  };

  // Load current items
  let items = loadFromStorage();

  // Remove duplicates (same id and type)
  items = items.filter(
    (i) => !(i.id === newItem.id && i.type === newItem.type)
  );

  // Prepend new item
  items.unshift(newItem);

  // Trim to max items
  items = items.slice(0, MAX_RECENT_ITEMS);

  // Save to storage
  saveToStorage(items);
}

/**
 * Get recent items, hydrated with current data from the data store
 * - Loads from localStorage (or in-memory fallback)
 * - Filters out items that no longer exist in the dataset
 * - Returns items ordered by recency (most recent first)
 */
export function getRecentItems(
  emails: Email[],
  tasks: Task[]
): Array<{ item: Email | Task; type: "email" | "task"; timestamp: number }> {
  const items = loadFromStorage();

  // Filter out items that no longer exist in the dataset and hydrate with full data
  const hydratedItems: Array<{
    item: Email | Task;
    type: "email" | "task";
    timestamp: number;
  }> = [];

  for (const recentItem of items) {
    if (recentItem.type === "email") {
      const email = emails.find((e) => e.id === recentItem.id);
      if (email) {
        hydratedItems.push({
          item: email,
          type: "email",
          timestamp: recentItem.timestamp,
        });
      }
    } else {
      const task = tasks.find((t) => t.id === recentItem.id);
      if (task) {
        hydratedItems.push({
          item: task,
          type: "task",
          timestamp: recentItem.timestamp,
        });
      }
    }
  }

  return hydratedItems;
}

/**
 * Clear all recent items from storage
 */
export function clearRecentItems(): void {
  if (useInMemoryFallback) {
    inMemoryStorage = [];
    return;
  }

  try {
    localStorage.removeItem(RECENT_ITEMS_KEY);
  } catch (error) {
    console.warn("Failed to clear recent items:", error);
  }
}

/**
 * Get raw recent items (without hydration) - useful for testing
 */
export function getRawRecentItems(): RecentItem[] {
  return loadFromStorage();
}
