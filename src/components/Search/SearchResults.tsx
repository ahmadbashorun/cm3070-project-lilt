"use client";

import { Email, Task } from "@/types";
import { SearchResult } from "@/utils/searchEngine";
import { ResultItem } from "./ResultItem";
import styles from "./SearchResults.module.scss";

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  recentItems: Array<{
    item: Email | Task;
    type: "email" | "task";
    timestamp: number;
  }>;
  onItemClick: (item: Email | Task, type: "email" | "task") => void;
  focusedIndex: number;
  isLoading?: boolean;
  error?: string | null;
}

export function SearchResults({
  query,
  results,
  recentItems,
  onItemClick,
  focusedIndex,
  isLoading = false,
  error = null,
}: SearchResultsProps) {
  // If there's an error, show error message
  if (error) {
    return (
      <div className={styles.searchResults}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorHint}>
            Please try again or contact support if the problem persists
          </p>
        </div>
      </div>
    );
  }

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className={styles.searchResults}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="90 30"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 20 20"
                  to="360 20 20"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
          <p className={styles.loadingMessage}>Searching...</p>
        </div>
      </div>
    );
  }

  // If query is empty, show recent items
  if (!query || query.trim() === "") {
    return (
      <div className={styles.searchResults}>
        {recentItems.length > 0 ? (
          <>
            <div className={styles.sectionHeader}>Recent</div>
            <div className={styles.resultsList}>
              {recentItems.map((recentItem, index) => (
                <ResultItem
                  key={`${recentItem.type}-${recentItem.item.id}`}
                  type={recentItem.type}
                  item={recentItem.item}
                  onClick={() => {
                    onItemClick(recentItem.item, recentItem.type);
                  }}
                  isFocused={index === focusedIndex}
                />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>No recent items</p>
            <p className={styles.emptyStateHint}>
              Start searching to find emails and tasks
            </p>
          </div>
        )}
      </div>
    );
  }

  // If query has value, show search results
  if (results.length === 0) {
    return (
      <div className={styles.searchResults}>
        <div className={styles.emptyState}>
          <p>No results found</p>
          <p className={styles.emptyStateHint}>
            Try searching with different keywords
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.searchResults}>
      <div className={styles.sectionHeader}>
        {results.length} {results.length === 1 ? "result" : "results"}
      </div>
      <div className={styles.resultsList}>
        {results.map((result, index) => (
          <ResultItem
            key={`${result.type}-${result.item.id}`}
            type={result.type}
            item={result.item}
            query={query}
            onClick={() => {
              onItemClick(result.item, result.type);
            }}
            isFocused={index === focusedIndex}
          />
        ))}
      </div>
    </div>
  );
}
