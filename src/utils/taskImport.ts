import type { Task, TaskImportFormat, TaskColumnMap } from "@/types";

export type { TaskImportFormat, TaskColumnMap };

/**
 * Parse CSV row handling quoted fields
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === undefined) break;
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse various date formats
 */
function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === "") return null;

  // Try ISO format first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/, // ISO with time
    /(\d{2})\/(\d{2})\/(\d{4})/, // US format
    /(\d{2})-(\d{2})-(\d{4})/, // EU format
    /(\d{4})\/(\d{2})\/(\d{2})/, // ISO-like
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Normalize status to Task status type
 */
function normalizeStatus(status: string): Task["status"] {
  const normalized = status.toLowerCase().trim();
  const statusMap: Record<string, Task["status"]> = {
    todo: "todo",
    "to do": "todo",
    "in progress": "in-progress",
    "in-progress": "in-progress",
    done: "done",
    completed: "completed",
    backlog: "backlog",
    ready: "ready",
    review: "review",
    open: "todo",
    closed: "done",
    resolved: "done",
    cancelled: "done",
    blocked: "backlog",
    "to-do": "todo",
    "in development": "in-progress",
    "code review": "review",
    testing: "review",
  };
  return statusMap[normalized] || "todo";
}

/**
 * Normalize priority to Task priority type
 */
function normalizePriority(priority: string): Task["priority"] {
  const normalized = priority.toUpperCase().trim();
  if (
    normalized === "P0" ||
    normalized === "0" ||
    normalized === "CRITICAL" ||
    normalized === "BLOCKER" ||
    normalized === "HIGHEST"
  ) {
    return "P0";
  }
  if (
    normalized === "P1" ||
    normalized === "1" ||
    normalized === "HIGH" ||
    normalized === "URGENT"
  ) {
    return "P1";
  }
  if (
    normalized === "P2" ||
    normalized === "2" ||
    normalized === "MEDIUM" ||
    normalized === "NORMAL"
  ) {
    return "P2";
  }
  return "P3";
}

/**
 * Detect task format from CSV headers
 */
export function detectTaskFormat(headers: string[]): TaskImportFormat {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const headerStr = lowerHeaders.join(" ");

  // Jira indicators
  const jiraIndicators = [
    "issue key",
    "issue type",
    "summary",
    "assignee",
    "reporter",
    "status",
    "priority",
    "created",
    "updated",
    "resolution",
  ];
  const jiraMatches = jiraIndicators.filter((indicator) =>
    headerStr.includes(indicator)
  );
  if (jiraMatches.length >= 3) {
    return "jira";
  }

  // Linear indicators
  const linearIndicators = [
    "identifier",
    "title",
    "state",
    "priority",
    "assignee",
    "labels",
    "created at",
    "updated at",
  ];
  const linearMatches = linearIndicators.filter((indicator) =>
    headerStr.includes(indicator)
  );
  if (linearMatches.length >= 3) {
    return "linear";
  }

  // Asana indicators
  const asanaIndicators = [
    "task id",
    "name",
    "assignee",
    "due date",
    "completed",
    "created at",
    "modified at",
    "notes",
  ];
  const asanaMatches = asanaIndicators.filter((indicator) =>
    headerStr.includes(indicator)
  );
  if (asanaMatches.length >= 3) {
    return "asana";
  }

  return "generic";
}

/**
 * Detect column mapping for a format
 */
function detectColumnsForFormat(
  headers: string[],
  format: TaskImportFormat
): TaskColumnMap {
  const map: TaskColumnMap = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  if (format === "jira") {
    // Jira column mappings
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (!header) continue;
      const headerValue = headers[i];
      if (!headerValue) continue;

      if (header.includes("issue key") || header.includes("key")) {
        map.id = headerValue;
      } else if (header.includes("summary") || header.includes("title")) {
        map.title = headerValue;
      } else if (header.includes("description")) {
        map.description = headerValue;
      } else if (header.includes("status")) {
        map.status = headerValue;
      } else if (header.includes("priority")) {
        map.priority = headerValue;
      } else if (
        header.includes("due date") ||
        header.includes("duedate") ||
        header.includes("due")
      ) {
        map.dueDate = headerValue;
      } else if (header.includes("project")) {
        map.project = headerValue;
      } else if (header.includes("assignee")) {
        map.assignee = headerValue;
      }
    }
    map.source = "external";
  } else if (format === "linear") {
    // Linear column mappings
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (!header) continue;
      const headerValue = headers[i];
      if (!headerValue) continue;

      if (header.includes("identifier") || header.includes("id")) {
        map.id = headerValue;
      } else if (header.includes("title") || header.includes("name")) {
        map.title = headerValue;
      } else if (header.includes("description")) {
        map.description = headerValue;
      } else if (header.includes("state")) {
        map.status = headerValue;
      } else if (header.includes("priority")) {
        map.priority = headerValue;
      } else if (header.includes("due date") || header.includes("due")) {
        map.dueDate = headerValue;
      } else if (header.includes("team") || header.includes("project")) {
        map.project = headerValue;
      } else if (header.includes("assignee")) {
        map.assignee = headerValue;
      }
    }
    map.source = "external";
  } else if (format === "asana") {
    // Asana column mappings
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (!header) continue;
      const headerValue = headers[i];
      if (!headerValue) continue;

      if (header.includes("task id") || header.includes("id")) {
        map.id = headerValue;
      } else if (header.includes("name") || header.includes("title")) {
        map.title = headerValue;
      } else if (header.includes("notes") || header.includes("description")) {
        map.description = headerValue;
      } else if (header.includes("completed")) {
        map.status = headerValue;
      } else if (header.includes("due date") || header.includes("due")) {
        map.dueDate = headerValue;
      } else if (header.includes("project") || header.includes("section")) {
        map.project = headerValue;
      } else if (header.includes("assignee")) {
        map.assignee = headerValue;
      }
    }
    map.source = "external";
  } else {
    // Generic column detection
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (!header) continue;
      const headerValue = headers[i];
      if (!headerValue) continue;

      if ((header.includes("id") || header.includes("key")) && !map.id) {
        map.id = headerValue;
      } else if (
        (header.includes("title") ||
          header.includes("name") ||
          header.includes("summary")) &&
        !map.title
      ) {
        map.title = headerValue;
      } else if (header.includes("description") && !map.description) {
        map.description = headerValue;
      } else if (header.includes("status") && !map.status) {
        map.status = headerValue;
      } else if (header.includes("priority") && !map.priority) {
        map.priority = headerValue;
      } else if (
        (header.includes("due") || header.includes("deadline")) &&
        !map.dueDate
      ) {
        map.dueDate = headerValue;
      } else if (header.includes("project") && !map.project) {
        map.project = headerValue;
      } else if (header.includes("assignee") && !map.assignee) {
        map.assignee = headerValue;
      }
    }
  }

  return map;
}

/**
 * Parse Jira CSV
 */
function parseJiraCSV(csv: string, headers: string[]): Task[] {
  const rows = csv.split("\n").filter((row) => row.trim());
  if (rows.length < 2) return [];

  const columnMap = detectColumnsForFormat(headers, "jira");
  const tasks: Task[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.trim()) continue;

    try {
      const cols = parseCSVRow(row);
      if (cols.length === 0) continue;

      const getValue = (field: keyof TaskColumnMap): string => {
        const columnName = columnMap[field];
        if (!columnName) return "";
        const index = headers.indexOf(columnName);
        return index >= 0 && index < cols.length ? cols[index] || "" : "";
      };

      const id = getValue("id") || `jira-${Date.now()}-${i}`;
      const title = getValue("title") || "Untitled Task";
      const descriptionValue = getValue("description");
      const status = normalizeStatus(getValue("status") || "todo");
      const priority = normalizePriority(getValue("priority") || "P3");
      const dueDateStr = getValue("dueDate");
      const dueDate = dueDateStr ? parseDate(dueDateStr) : null;
      const project = getValue("project") || "Uncategorized";
      const assignee = getValue("assignee") || "Unassigned";

      const task: Task = {
        id,
        title,
        status,
        priority,
        dueDate,
        source: "external",
        project,
        assignee,
      };

      if (descriptionValue) {
        task.description = descriptionValue;
      }

      tasks.push(task);
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  if (errors.length > 0 && tasks.length === 0) {
    throw new Error(`Failed to parse Jira CSV: ${errors.join("; ")}`);
  }

  return tasks;
}

/**
 * Parse Linear CSV
 */
function parseLinearCSV(csv: string, headers: string[]): Task[] {
  const rows = csv.split("\n").filter((row) => row.trim());
  if (rows.length < 2) return [];

  const columnMap = detectColumnsForFormat(headers, "linear");
  const tasks: Task[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.trim()) continue;

    try {
      const cols = parseCSVRow(row);
      if (cols.length === 0) continue;

      const getValue = (field: keyof TaskColumnMap): string => {
        const columnName = columnMap[field];
        if (!columnName) return "";
        const index = headers.indexOf(columnName);
        return index >= 0 && index < cols.length ? cols[index] || "" : "";
      };

      const id = getValue("id") || `linear-${Date.now()}-${i}`;
      const title = getValue("title") || "Untitled Task";
      const descriptionValue = getValue("description");
      const status = normalizeStatus(getValue("status") || "todo");
      const priority = normalizePriority(getValue("priority") || "P3");
      const dueDateStr = getValue("dueDate");
      const dueDate = dueDateStr ? parseDate(dueDateStr) : null;
      const project = getValue("project") || "Uncategorized";
      const assignee = getValue("assignee") || "Unassigned";

      const task: Task = {
        id,
        title,
        status,
        priority,
        dueDate,
        source: "external",
        project,
        assignee,
      };

      if (descriptionValue) {
        task.description = descriptionValue;
      }

      tasks.push(task);
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  if (errors.length > 0 && tasks.length === 0) {
    throw new Error(`Failed to parse Linear CSV: ${errors.join("; ")}`);
  }

  return tasks;
}

/**
 * Parse Asana CSV
 */
function parseAsanaCSV(csv: string, headers: string[]): Task[] {
  const rows = csv.split("\n").filter((row) => row.trim());
  if (rows.length < 2) return [];

  const columnMap = detectColumnsForFormat(headers, "asana");
  const tasks: Task[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.trim()) continue;

    try {
      const cols = parseCSVRow(row);
      if (cols.length === 0) continue;

      const getValue = (field: keyof TaskColumnMap): string => {
        const columnName = columnMap[field];
        if (!columnName) return "";
        const index = headers.indexOf(columnName);
        return index >= 0 && index < cols.length ? cols[index] || "" : "";
      };

      const id = getValue("id") || `asana-${Date.now()}-${i}`;
      const title = getValue("title") || "Untitled Task";
      const descriptionValue = getValue("description");
      const completedStr = getValue("status");
      const status =
        completedStr.toLowerCase() === "true" ||
        completedStr.toLowerCase() === "yes" ||
        completedStr.toLowerCase() === "completed"
          ? "done"
          : normalizeStatus(completedStr || "todo");
      const priority = normalizePriority(getValue("priority") || "P3");
      const dueDateStr = getValue("dueDate");
      const dueDate = dueDateStr ? parseDate(dueDateStr) : null;
      const project = getValue("project") || "Uncategorized";
      const assignee = getValue("assignee") || "Unassigned";

      const task: Task = {
        id,
        title,
        status,
        priority,
        dueDate,
        source: "external",
        project,
        assignee,
      };

      if (descriptionValue) {
        task.description = descriptionValue;
      }

      tasks.push(task);
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  if (errors.length > 0 && tasks.length === 0) {
    throw new Error(`Failed to parse Asana CSV: ${errors.join("; ")}`);
  }

  return tasks;
}

/**
 * Parse generic CSV with column mapping
 */
export function parseGenericCSV(
  csv: string,
  headers: string[],
  columnMap: TaskColumnMap
): Task[] {
  const rows = csv.split("\n").filter((row) => row.trim());
  if (rows.length < 2) return [];

  const tasks: Task[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.trim()) continue;

    try {
      const cols = parseCSVRow(row);
      if (cols.length === 0) continue;

      const getValue = (field: keyof TaskColumnMap): string => {
        const columnName = columnMap[field];
        if (!columnName) return "";
        const index = headers.indexOf(columnName);
        return index >= 0 && index < cols.length ? cols[index] || "" : "";
      };

      const id = getValue("id") || `task-${Date.now()}-${i}`;
      const title = getValue("title") || "Untitled Task";
      const descriptionValue = getValue("description");
      const status = normalizeStatus(getValue("status") || "todo");
      const priority = normalizePriority(getValue("priority") || "P3");
      const dueDateStr = getValue("dueDate");
      const dueDate = dueDateStr ? parseDate(dueDateStr) : null;
      const sourceStr = getValue("source");
      const source =
        sourceStr.toLowerCase().includes("jira") ||
        sourceStr.toLowerCase().includes("linear") ||
        sourceStr.toLowerCase().includes("asana")
          ? "external"
          : "internal";
      const project = getValue("project") || "Uncategorized";
      const assignee = getValue("assignee") || "Unassigned";

      const task: Task = {
        id,
        title,
        status,
        priority,
        dueDate,
        source,
        project,
        assignee,
      };

      if (descriptionValue) {
        task.description = descriptionValue;
      }

      tasks.push(task);
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  if (errors.length > 0 && tasks.length === 0) {
    throw new Error(`Failed to parse CSV: ${errors.join("; ")}`);
  }

  return tasks;
}

/**
 * Main function to parse task CSV with auto-detection
 */
export function parseTaskCSV(csv: string, columnMap?: TaskColumnMap): Task[] {
  const rows = csv.split("\n").filter((row) => row.trim());
  if (rows.length < 2) return [];

  const headerRow = rows[0];
  if (!headerRow) return [];

  const headers = parseCSVRow(headerRow);
  const format = detectTaskFormat(headers);

  if (format === "jira") {
    return parseJiraCSV(csv, headers);
  } else if (format === "linear") {
    return parseLinearCSV(csv, headers);
  } else if (format === "asana") {
    return parseAsanaCSV(csv, headers);
  } else {
    // Generic format - use provided column map or auto-detect
    const detectedMap = columnMap || detectColumnsForFormat(headers, "generic");
    return parseGenericCSV(csv, headers, detectedMap);
  }
}

/**
 * Get default column map for a format
 */
export function getDefaultColumnMap(
  headers: string[],
  format: TaskImportFormat
): TaskColumnMap {
  return detectColumnsForFormat(headers, format);
}
