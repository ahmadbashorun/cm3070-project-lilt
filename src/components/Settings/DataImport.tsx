"use client";

import { useState, useRef } from "react";
import { useDataStore } from "@/store/dataStore";
import {
  parseTaskCSV,
  detectTaskFormat,
  getDefaultColumnMap,
  type TaskColumnMap,
  type TaskImportFormat,
} from "@/utils/taskImport";
import {
  parseEmailCSV,
  parseEMLFile,
  parseMBOXFile,
} from "@/utils/emailImport";
import type { Task, Email } from "@/types";
import styles from "./DataImport.module.scss";
import { FaFileCsv, FaEnvelope, FaFileAlt } from "react-icons/fa";

type ImportType = "tasks" | "emails";

interface ParsedRow {
  [key: string]: string;
}

export default function DataImport(): React.ReactElement {
  const [importType, setImportType] = useState<ImportType>("tasks");
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<TaskImportFormat | null>(
    null
  );
  const [columnMap, setColumnMap] = useState<TaskColumnMap | null>(null);
  const [parsedTasks, setParsedTasks] = useState<Task[]>([]);
  const [parsedEmails, setParsedEmails] = useState<Email[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const handleFile = (file: File): void => {
    setFileName(file.name);
    setImportError(null);
    setParsedData([]);
    setHeaders([]);
    setDetectedFormat(null);
    setColumnMap(null);
    setParsedTasks([]);
    setParsedEmails([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const ext = getFileExtension(file.name);

        if (importType === "tasks") {
          if (ext === "csv") {
            parseTaskCSVFile(result);
          } else {
            setImportError("Task imports only support CSV files");
          }
        } else {
          // Email imports
          if (ext === "csv") {
            parseEmailCSVFile(result);
          } else if (ext === "eml") {
            parseEMLFileContent(result);
          } else if (ext === "mbox") {
            parseMBOXFileContent(result);
          } else {
            setImportError("Email imports support CSV, EML, or MBOX files");
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const parseTaskCSVFile = (text: string): void => {
    try {
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length === 0) {
        setImportError("File is empty");
        return;
      }

      const firstLine = lines[0];
      if (!firstLine) {
        setImportError("No headers found in CSV");
        return;
      }

      // Parse CSV row properly
      const parseCSVRow = (row: string): string[] => {
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
      };

      const csvHeaders = parseCSVRow(firstLine);
      setHeaders(csvHeaders);

      // Detect format
      const format = detectTaskFormat(csvHeaders);
      setDetectedFormat(format);

      // Get default column map
      const defaultMap = getDefaultColumnMap(csvHeaders, format);
      setColumnMap(defaultMap);

      // Parse preview rows
      const rows: ParsedRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const line = lines[i];
        if (!line) continue;

        const values = parseCSVRow(line);
        const row: ParsedRow = {};
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }
      setParsedData(rows);

      // Parse all tasks for preview
      const tasks = parseTaskCSV(text, defaultMap);
      setParsedTasks(tasks);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to parse task CSV"
      );
    }
  };

  const parseEmailCSVFile = (text: string): void => {
    try {
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length === 0) {
        setImportError("File is empty");
        return;
      }

      const firstLine = lines[0];
      if (!firstLine) {
        setImportError("No headers found in CSV");
        return;
      }

      // Parse CSV row properly
      const parseCSVRow = (row: string): string[] => {
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
      };

      const csvHeaders = parseCSVRow(firstLine);
      setHeaders(csvHeaders);

      // Parse preview rows
      const rows: ParsedRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const line = lines[i];
        if (!line) continue;

        const values = parseCSVRow(line);
        const row: ParsedRow = {};
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }
      setParsedData(rows);

      // Parse all emails for preview
      const emails = parseEmailCSV(text);
      setParsedEmails(emails);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to parse email CSV"
      );
    }
  };

  const parseEMLFileContent = (text: string): void => {
    try {
      const emails = parseEMLFile(text);
      setParsedEmails(emails);
      setHeaders(["From", "Subject", "Date", "Body"]);
      // Create preview data
      const preview: ParsedRow[] = emails.slice(0, 10).map((email) => ({
        From: email.from,
        Subject: email.subject,
        Date: email.timestamp.toISOString(),
        Body:
          email.body.substring(0, 100) + (email.body.length > 100 ? "..." : ""),
      }));
      setParsedData(preview);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to parse EML file"
      );
    }
  };

  const parseMBOXFileContent = (text: string): void => {
    try {
      const emails = parseMBOXFile(text);
      setParsedEmails(emails);
      setHeaders(["From", "Subject", "Date", "Body"]);
      // Create preview data
      const preview: ParsedRow[] = emails.slice(0, 10).map((email) => ({
        From: email.from,
        Subject: email.subject,
        Date: email.timestamp.toISOString(),
        Body:
          email.body.substring(0, 100) + (email.body.length > 100 ? "..." : ""),
      }));
      setParsedData(preview);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to parse MBOX file"
      );
    }
  };

  const handleImport = (): void => {
    try {
      if (importType === "tasks") {
        if (parsedTasks.length === 0) {
          setImportError("No valid tasks found to import");
          return;
        }

        const store = useDataStore.getState();
        store.importTasksFromCSV(parsedTasks);
        alert(`Successfully imported ${parsedTasks.length} tasks`);
      } else {
        if (parsedEmails.length === 0) {
          setImportError("No valid emails found to import");
          return;
        }

        const ext = getFileExtension(fileName);
        const store = useDataStore.getState();
        if (ext === "csv") {
          (store.importEmailsFromCSV as (emails: Email[]) => void)(
            parsedEmails
          );
        } else if (ext === "eml") {
          (store.importEmailsFromEML as (emails: Email[]) => void)(
            parsedEmails
          );
        } else if (ext === "mbox") {
          (store.importEmailsFromMBOX as (emails: Email[]) => void)(
            parsedEmails
          );
        }

        alert(`Successfully imported ${parsedEmails.length} emails`);
      }

      // Reset state
      setParsedData([]);
      setHeaders([]);
      setDetectedFormat(null);
      setColumnMap(null);
      setParsedTasks([]);
      setParsedEmails([]);
      setFileName("");
      setImportError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to import data"
      );
    }
  };

  const handleCancel = (): void => {
    setParsedData([]);
    setHeaders([]);
    setDetectedFormat(null);
    setColumnMap(null);
    setParsedTasks([]);
    setParsedEmails([]);
    setFileName("");
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDisplayName = (format: TaskImportFormat): string => {
    const names: Record<TaskImportFormat, string> = {
      jira: "Jira",
      linear: "Linear",
      asana: "Asana",
      generic: "Generic CSV",
    };
    return names[format];
  };

  const getAcceptTypes = (): string => {
    if (importType === "tasks") {
      return ".csv";
    }
    return ".csv,.eml,.mbox";
  };

  const getFileTypeDescription = (): string => {
    if (importType === "tasks") {
      return "CSV files from Jira, Linear, Asana, or generic CSV";
    }
    return "CSV, EML, or MBOX files";
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Import Data</h2>
      <p className={styles.description}>
        Import tasks or emails from various file formats. Tasks support CSV
        files from Jira, Linear, Asana, or generic CSV. Emails support CSV, EML,
        or MBOX formats.
      </p>

      {/* Import Type Selection */}
      <div className={styles.typeSelector}>
        <button
          className={`${styles.typeButton} ${
            importType === "tasks" ? styles.typeButtonActive : ""
          }`}
          onClick={() => {
            setImportType("tasks");
            handleCancel();
          }}
          type="button"
        >
          <FaFileAlt />
          Import Tasks
        </button>
        <button
          className={`${styles.typeButton} ${
            importType === "emails" ? styles.typeButtonActive : ""
          }`}
          onClick={() => {
            setImportType("emails");
            handleCancel();
          }}
          type="button"
        >
          <FaEnvelope />
          Import Emails
        </button>
      </div>

      {/* Format Detection Info */}
      {detectedFormat && (
        <div className={styles.formatInfo}>
          <span className={styles.formatLabel}>Detected format:</span>
          <span className={styles.formatValue}>
            {formatDisplayName(detectedFormat)}
          </span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${importType} file`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptTypes()}
          onChange={handleFileInput}
          className={styles.fileInput}
        />
        <div className={styles.dropZoneContent}>
          <div className={styles.dropIcon}>
            {importType === "tasks" ? <FaFileCsv /> : <FaEnvelope />}
          </div>
          <p className={styles.dropText}>
            {isDragging
              ? `Drop ${importType} file here`
              : `Drag & drop ${importType} file here`}
          </p>
          <p className={styles.dropHint}>
            {getFileTypeDescription()} or click to browse
          </p>
        </div>
      </div>

      {/* Error Display */}
      {importError && (
        <div className={styles.error} role="alert">
          {importError}
        </div>
      )}

      {/* Preview Section */}
      {parsedData.length > 0 && (
        <>
          <div className={styles.preview}>
            <h3 className={styles.previewTitle}>Preview</h3>
            <p className={styles.previewNote}>
              {importType === "tasks"
                ? `Showing first ${parsedData.length} rows (${parsedTasks.length} total tasks found)`
                : `Showing first ${parsedData.length} rows (${parsedEmails.length} total emails found)`}
            </p>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className={styles.th}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, index) => (
                    <tr key={index}>
                      {headers.map((header) => (
                        <td key={header} className={styles.td}>
                          {row[header] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column Mapping Info (for tasks) */}
          {importType === "tasks" && columnMap && (
            <div className={styles.columnMapping}>
              <h4 className={styles.columnMappingTitle}>Column Mapping</h4>
              <div className={styles.columnMappingGrid}>
                {Object.entries(columnMap).map(([field, column]) => (
                  <div key={field} className={styles.columnMappingItem}>
                    <span className={styles.columnMappingField}>{field}:</span>
                    <span className={styles.columnMappingColumn}>
                      {column || "(not mapped)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.importButton}
              onClick={handleImport}
              type="button"
            >
              Import{" "}
              {importType === "tasks"
                ? `${parsedTasks.length} Tasks`
                : `${parsedEmails.length} Emails`}
            </button>
            <button
              className={styles.cancelButton}
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
