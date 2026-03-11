import { Email, Task } from "@/types";

/**
 * Represents a search result with relevance scoring
 */
export interface SearchResult {
  type: "email" | "task";
  item: Email | Task;
  relevanceScore: number;
  matchedFields: string[];
}

/**
 * SearchEngine module for processing search queries and ranking results
 */
export class SearchEngine {
  /**
   * Search across emails and tasks with relevance scoring
   * @param query - The search query string
   * @param emails - Array of emails to search
   * @param tasks - Array of tasks to search
   * @returns Array of search results sorted by relevance (top 20)
   */
  search(query: string, emails: Email[], tasks: Task[]): SearchResult[] {
    // Handle empty query - return empty results
    if (!query || typeof query !== "string") {
      return [];
    }

    // Truncate queries longer than 200 characters
    const truncatedQuery = query.length > 200 ? query.slice(0, 200) : query;

    // Normalize query
    const normalizedQuery = this.normalizeQuery(truncatedQuery);

    // If query is empty after normalization, return empty results
    if (!normalizedQuery) {
      return [];
    }

    // Handle empty datasets - return empty results
    if (!Array.isArray(emails)) {
      emails = [];
    }
    if (!Array.isArray(tasks)) {
      tasks = [];
    }

    const results: SearchResult[] = [];

    // Search emails with error handling for malformed data
    for (const email of emails) {
      try {
        // Skip invalid email objects
        if (!this.isValidEmail(email)) {
          console.warn("Skipping invalid email:", email);
          continue;
        }

        const emailResult = this.searchEmail(normalizedQuery, email);
        if (emailResult) {
          results.push(emailResult);
        }
      } catch (error) {
        console.warn("Error searching email:", email, error);
        continue;
      }
    }

    // Search tasks with error handling for malformed data
    for (const task of tasks) {
      try {
        // Skip invalid task objects
        if (!this.isValidTask(task)) {
          console.warn("Skipping invalid task:", task);
          continue;
        }

        const taskResult = this.searchTask(normalizedQuery, task);
        if (taskResult) {
          results.push(taskResult);
        }
      } catch (error) {
        console.warn("Error searching task:", task, error);
        continue;
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top 20 results
    return results.slice(0, 20);
  }

  /**
   * Normalize query string (lowercase, trim)
   * @param query - Raw query string
   * @returns Normalized query string
   */
  private normalizeQuery(query: string): string {
    return query.trim().toLowerCase();
  }

  /**
   * Search a single email and calculate relevance score
   * @param query - Normalized query string
   * @param email - Email to search
   * @returns SearchResult if match found, null otherwise
   */
  private searchEmail(query: string, email: Email): SearchResult | null {
    let totalScore = 0;
    const matchedFields: string[] = [];

    // Search subject (weight: 3)
    const subjectScore = this.calculateFieldScore(
      query,
      (email.subject || "").toLowerCase(),
      3
    );
    if (subjectScore > 0) {
      totalScore += subjectScore;
      matchedFields.push("subject");
    }

    // Search sender (weight: 2)
    const senderScore = this.calculateFieldScore(
      query,
      (email.from || "").toLowerCase(),
      2
    );
    if (senderScore > 0) {
      totalScore += senderScore;
      matchedFields.push("sender");
    }

    // Search body (weight: 1)
    const bodyScore = this.calculateFieldScore(
      query,
      (email.body || "").toLowerCase(),
      1
    );
    if (bodyScore > 0) {
      totalScore += bodyScore;
      matchedFields.push("body");
    }

    // Return result if any matches found
    if (totalScore > 0) {
      return {
        type: "email",
        item: email,
        relevanceScore: totalScore,
        matchedFields,
      };
    }

    return null;
  }

  /**
   * Search a single task and calculate relevance score
   * @param query - Normalized query string
   * @param task - Task to search
   * @returns SearchResult if match found, null otherwise
   */
  private searchTask(query: string, task: Task): SearchResult | null {
    let totalScore = 0;
    const matchedFields: string[] = [];

    // Search title (weight: 3)
    const titleScore = this.calculateFieldScore(
      query,
      (task.title || "").toLowerCase(),
      3
    );
    if (titleScore > 0) {
      totalScore += titleScore;
      matchedFields.push("title");
    }

    // Search description (weight: 2)
    if (task.description) {
      const descriptionScore = this.calculateFieldScore(
        query,
        task.description.toLowerCase(),
        2
      );
      if (descriptionScore > 0) {
        totalScore += descriptionScore;
        matchedFields.push("description");
      }
    }

    // Search project (weight: 2)
    const projectScore = this.calculateFieldScore(
      query,
      (task.project || "").toLowerCase(),
      2
    );
    if (projectScore > 0) {
      totalScore += projectScore;
      matchedFields.push("project");
    }

    // Return result if any matches found
    if (totalScore > 0) {
      return {
        type: "task",
        item: task,
        relevanceScore: totalScore,
        matchedFields,
      };
    }

    return null;
  }

  /**
   * Calculate relevance score for a field based on match type
   * @param query - Normalized query string
   * @param fieldValue - Normalized field value to search
   * @param weight - Field weight multiplier
   * @returns Relevance score for this field
   */
  private calculateFieldScore(
    query: string,
    fieldValue: string,
    weight: number
  ): number {
    // No match if field doesn't contain query
    if (!fieldValue.includes(query)) {
      return 0;
    }

    let baseScore = 0;

    // Exact match: +10 points
    if (fieldValue === query) {
      baseScore = 10;
    }
    // Starts with query: +7 points
    else if (fieldValue.startsWith(query)) {
      baseScore = 7;
    }
    // Contains query: +3 points
    else {
      baseScore = 3;
    }

    // Apply field weight
    let score = baseScore * weight;

    // Word boundary match bonus: +2 points
    if (this.hasWordBoundaryMatch(query, fieldValue)) {
      score += 2;
    }

    return score;
  }

  /**
   * Check if query matches at a word boundary
   * @param query - Normalized query string
   * @param fieldValue - Normalized field value
   * @returns True if query matches at word boundary
   */
  private hasWordBoundaryMatch(query: string, fieldValue: string): boolean {
    // Create regex pattern with word boundaries
    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escapedQuery}\\b`, "i");
    return pattern.test(fieldValue);
  }

  /**
   * Validate email object has required fields
   * @param email - Email object to validate
   * @returns True if email is valid
   */
  private isValidEmail(email: Email | null | undefined): email is Email {
    return (
      !!email &&
      typeof email === "object" &&
      typeof email.id === "string" &&
      typeof email.subject === "string" &&
      typeof email.from === "string" &&
      typeof email.body === "string"
    );
  }

  /**
   * Validate task object has required fields
   * @param task - Task object to validate
   * @returns True if task is valid
   */
  private isValidTask(task: unknown): task is Task {
    return (
      !!task &&
      typeof task === "object" &&
      "id" in task &&
      typeof task.id === "string" &&
      "title" in task &&
      typeof task.title === "string" &&
      "project" in task &&
      typeof task.project === "string"
    );
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();
