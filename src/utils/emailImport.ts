import type { Email, EmailFolder } from "@/types";

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
 * Calculate priority from email metadata
 */
function calculatePriority(
  senderImportance: number,
  projectRelevance: number,
  deadlineProximity: number
): number {
  return (
    senderImportance * 0.3 + projectRelevance * 0.4 + deadlineProximity * 0.3
  );
}

/**
 * Map CSV column names to Email fields
 */
interface EmailColumnMap {
  id?: string;
  from?: string;
  subject?: string;
  body?: string;
  timestamp?: string;
  read?: string;
  priority?: string;
  senderImportance?: string;
  projectRelevance?: string;
  deadlineProximity?: string;
  urgency?: string;
  folder?: string;
}

function detectEmailColumns(headers: string[]): EmailColumnMap {
  const map: EmailColumnMap = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // Common column name variations - map field names to possible header variations
  const columnMappings: Record<keyof EmailColumnMap, string[]> = {
    id: ["id"],
    from: ["from", "sender", "author", "email from"],
    subject: ["subject", "title", "topic"],
    body: ["body", "content", "message", "text"],
    timestamp: [
      "timestamp",
      "date",
      "time",
      "received",
      "sent",
      "created",
      "datetime",
    ],
    read: ["read", "isread", "read status", "unread"],
    priority: ["priority", "importance"],
    senderImportance: ["sender importance", "senderimportance"],
    projectRelevance: ["project relevance", "projectrelevance", "relevance"],
    deadlineProximity: [
      "deadline proximity",
      "deadlineproximity",
      "deadline",
      "due",
    ],
    urgency: ["urgency", "urgent"],
    folder: ["folder", "category", "label"],
  };

  for (const [field, variations] of Object.entries(columnMappings)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (!header) continue;
      if (variations.some((v) => header.includes(v))) {
        const headerValue = headers[i];
        if (headerValue) {
          map[field as keyof EmailColumnMap] = headerValue;
        }
        break;
      }
    }
  }

  return map;
}

/**
 * Parse emails from CSV with flexible column mapping
 */
export function parseEmailCSV(csv: string): Email[] {
  const rows = csv.split("\n").filter((row) => row.trim());
  if (rows.length < 2) return [];

  const headerRow = rows[0];
  if (!headerRow) return [];

  const headers = parseCSVRow(headerRow);
  const columnMap = detectEmailColumns(headers);

  const emails: Email[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.trim()) continue;

    try {
      const cols = parseCSVRow(row);
      if (cols.length === 0) continue;

      const getValue = (field: keyof EmailColumnMap): string => {
        const columnName = columnMap[field];
        if (!columnName) return "";
        const index = headers.indexOf(columnName);
        return index >= 0 && index < cols.length ? cols[index] || "" : "";
      };

      const id = getValue("id") || `email-${Date.now()}-${i}`;
      const from = getValue("from") || "unknown@example.com";
      const subject = getValue("subject") || "(No Subject)";
      const body = getValue("body") || "";
      const timestampStr = getValue("timestamp");
      const timestamp = timestampStr
        ? parseDate(timestampStr) || new Date()
        : new Date();
      const readStr = getValue("read");
      const read =
        readStr.toLowerCase() === "true" ||
        readStr === "1" ||
        readStr.toLowerCase() === "yes" ||
        readStr.toLowerCase() === "read";

      const senderImportanceStr = getValue("senderImportance");
      const senderImportance = senderImportanceStr
        ? parseFloat(senderImportanceStr) || 0.5
        : 0.5;

      const projectRelevanceStr = getValue("projectRelevance");
      const projectRelevance = projectRelevanceStr
        ? parseFloat(projectRelevanceStr) || 0.5
        : 0.5;

      const deadlineProximityStr = getValue("deadlineProximity");
      const deadlineProximity = deadlineProximityStr
        ? parseFloat(deadlineProximityStr) || 0.5
        : 0.5;

      const priorityStr = getValue("priority");
      const priority = priorityStr
        ? parseFloat(priorityStr)
        : calculatePriority(
            senderImportance,
            projectRelevance,
            deadlineProximity
          );

      const urgencyStr = getValue("urgency");
      const urgency = urgencyStr ? parseFloat(urgencyStr) : priority;

      const folderStr = getValue("folder");
      const folder = folderStr
        ? (folderStr.toLowerCase() as EmailFolder)
        : ("inbox" as EmailFolder);

      emails.push({
        id,
        from,
        subject,
        body,
        timestamp,
        read,
        priority: Math.max(0, Math.min(1, priority)),
        senderImportance: Math.max(0, Math.min(1, senderImportance)),
        projectRelevance: Math.max(0, Math.min(1, projectRelevance)),
        deadlineProximity: Math.max(0, Math.min(1, deadlineProximity)),
        urgency: Math.max(0, Math.min(1, urgency)),
        folder: [
          "inbox",
          "starred",
          "scheduled",
          "sent",
          "drafts",
          "spam",
          "trash",
        ].includes(folder)
          ? folder
          : "inbox",
      });
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  if (errors.length > 0 && emails.length === 0) {
    throw new Error(`Failed to parse emails: ${errors.join("; ")}`);
  }

  return emails;
}

/**
 * Parse EML file (RFC 822 format)
 */
export function parseEMLFile(content: string): Email[] {
  const emails: Email[] = [];
  const errors: string[] = [];

  try {
    // Split by message boundaries if multiple emails
    const emailBlocks = content
      .split(/^From\s+/m)
      .filter((block) => block.trim());

    for (let i = 0; i < emailBlocks.length; i++) {
      const block = emailBlocks[i] || "";
      try {
        // Extract headers
        const headerEnd = block.indexOf("\n\n");
        const headersSection =
          headerEnd > 0 ? block.substring(0, headerEnd) : block;
        const bodySection =
          headerEnd > 0 ? block.substring(headerEnd + 2).trim() : "";

        // Parse headers
        const headers: Record<string, string> = {};
        const headerLines = headersSection.split("\n");
        let currentHeader = "";

        for (const line of headerLines) {
          if (/^\s/.test(line) && currentHeader) {
            // Continuation of previous header
            const existingValue = headers[currentHeader];
            headers[currentHeader] = (existingValue || "") + " " + line.trim();
          } else {
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match && match[1] && match[2]) {
              currentHeader = match[1].toLowerCase();
              headers[currentHeader] = match[2].trim();
            }
          }
        }

        const id = headers["message-id"] || `eml-${Date.now()}-${i}`;
        const from =
          headers["from"] || headers["sender"] || "unknown@example.com";
        const subject = headers["subject"] || "(No Subject)";
        const body = bodySection || "";
        const dateStr = headers["date"] || headers["received"];
        const timestamp = dateStr
          ? parseDate(dateStr) || new Date()
          : new Date();

        // Extract email address from "Name <email@domain.com>" format
        const fromEmailMatch =
          from.match(/<([^>]+)>/) || from.match(/([\w.-]+@[\w.-]+)/);
        const fromAddress =
          fromEmailMatch && fromEmailMatch[1] ? fromEmailMatch[1] : from;

        // Calculate metadata (simplified - could be enhanced)
        const senderImportance = 0.5;
        const projectRelevance = 0.5;
        const deadlineProximity = 0.5;
        const priority = calculatePriority(
          senderImportance,
          projectRelevance,
          deadlineProximity
        );

        emails.push({
          id,
          from: fromAddress,
          subject,
          body,
          timestamp,
          read: false,
          priority,
          senderImportance,
          projectRelevance,
          deadlineProximity,
          urgency: priority,
          folder: "inbox",
        });
      } catch (error) {
        errors.push(
          `Email ${i + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to parse EML file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  if (emails.length === 0 && errors.length > 0) {
    throw new Error(`No valid emails found: ${errors.join("; ")}`);
  }

  return emails;
}

/**
 * Parse MBOX file (mailbox archive format)
 */
export function parseMBOXFile(content: string): Email[] {
  const emails: Email[] = [];
  const errors: string[] = [];

  try {
    // MBOX format: messages start with "From " line
    const messageSeparator = /^From\s+/m;
    const messages = content
      .split(messageSeparator)
      .filter((msg) => msg.trim());

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message || !message.trim()) continue;

      try {
        // Find header/body separation
        const headerEnd = message.indexOf("\n\n");
        const headersSection =
          headerEnd > 0 ? message.substring(0, headerEnd) : message;
        const bodySection =
          headerEnd > 0 ? message.substring(headerEnd + 2).trim() : "";

        // Parse headers
        const headers: Record<string, string> = {};
        const headerLines = headersSection.split("\n");
        let currentHeader = "";

        for (const line of headerLines) {
          if (/^\s/.test(line) && currentHeader) {
            // Continuation of previous header
            const existingValue = headers[currentHeader];
            headers[currentHeader] = (existingValue || "") + " " + line.trim();
          } else {
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match && match[1] && match[2]) {
              currentHeader = match[1].toLowerCase();
              headers[currentHeader] = match[2].trim();
            }
          }
        }

        const id = headers["message-id"] || `mbox-${Date.now()}-${i}`;
        const from =
          headers["from"] || headers["sender"] || "unknown@example.com";
        const subject = headers["subject"] || "(No Subject)";
        const body = bodySection || "";
        const dateStr = headers["date"] || headers["received"];
        const timestamp = dateStr
          ? parseDate(dateStr) || new Date()
          : new Date();

        // Extract email address
        const fromEmailMatch =
          from.match(/<([^>]+)>/) || from.match(/([\w.-]+@[\w.-]+)/);
        const fromAddress =
          fromEmailMatch && fromEmailMatch[1] ? fromEmailMatch[1] : from;

        // Calculate metadata
        const senderImportance = 0.5;
        const projectRelevance = 0.5;
        const deadlineProximity = 0.5;
        const priority = calculatePriority(
          senderImportance,
          projectRelevance,
          deadlineProximity
        );

        emails.push({
          id,
          from: fromAddress,
          subject,
          body,
          timestamp,
          read: false,
          priority,
          senderImportance,
          projectRelevance,
          deadlineProximity,
          urgency: priority,
          folder: "inbox",
        });
      } catch (error) {
        errors.push(
          `Message ${i + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to parse MBOX file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  if (emails.length === 0 && errors.length > 0) {
    throw new Error(`No valid emails found: ${errors.join("; ")}`);
  }

  return emails;
}
