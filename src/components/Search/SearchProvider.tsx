"use client";

import { GlobalSearchListener } from "./GlobalSearchListener";
import { SearchModal } from "./SearchModal";

/**
 * SearchProvider component that provides global search functionality.
 *
 * This component should be included in the root layout to enable
 * global search across the entire application.
 *
 * It includes:
 * - GlobalSearchListener: Handles Cmd/Ctrl+K keyboard shortcut
 * - SearchModal: Renders the search modal when opened
 */
export function SearchProvider() {
  return (
    <>
      <GlobalSearchListener />
      <SearchModal />
    </>
  );
}
