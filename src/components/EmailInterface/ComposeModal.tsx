"use client";

import { useState, useEffect } from "react";
import { useStressStore } from "@/store/stressStore";
import styles from "./ComposeModal.module.scss";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (to: string, subject: string, body: string) => void;
}

export default function ComposeModal({
  isOpen,
  onClose,
  onSend,
}: ComposeModalProps): React.ReactElement | null {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSend = (): void => {
    if (to && subject && body) {
      onSend?.(to, subject, body);
      setTo("");
      setSubject("");
      setBody("");
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={-1}
      aria-label="Close modal"
    >
      <div
        className={`${styles.modal} ${styles[`level${currentLevel}`]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-modal-title"
      >
        <div className={styles.header}>
          <h2 id="compose-modal-title" className={styles.title}>
            Compose Email
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="to">
              To
            </label>
            <input
              id="to"
              type="email"
              className={styles.input}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
              }}
              placeholder="recipient@example.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              className={styles.input}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
              }}
              placeholder="Email subject"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="body">
              Message
            </label>
            <textarea
              id="body"
              className={styles.textarea}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
              placeholder={
                currentLevel >= 2
                  ? "Type your message..."
                  : "Type your message here. Keep it concise and clear."
              }
              rows={currentLevel >= 2 ? 8 : 12}
            />
          </div>

          {currentLevel >= 3 && (
            <div className={styles.assistance}>
              💡 Take a moment to breathe. We can help you draft this later.
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={!to || !subject || !body}
            type="button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
