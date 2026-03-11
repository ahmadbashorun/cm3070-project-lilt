import React from "react";

/**
 * Highlights matching text in a string by wrapping matches in a <mark> element
 * @param text - The text to search and highlight
 * @param query - The search query to highlight
 * @returns React elements with highlighted matches
 */
export function highlightText(
  text: string,
  query: string | undefined
): React.ReactNode {
  // If no query or empty query, return text as-is
  if (!query || query.trim() === "") {
    return text;
  }

  // Escape special regex characters in query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create case-insensitive regex to find all matches
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  // Split text by matches
  const parts = text.split(regex);

  // Map parts to React elements, highlighting matches
  return parts.map((part, index) => {
    // Check if this part matches the query (case-insensitive)
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={index}
          style={{
            backgroundColor: "rgba(255, 235, 59, 0.5)",
            padding: "0 2px",
            borderRadius: "2px",
            fontWeight: 500,
          }}
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
