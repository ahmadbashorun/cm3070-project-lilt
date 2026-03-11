"use client";

import { useState, useEffect } from "react";
import type { Email } from "@/types";
import styles from "./EmailCard.module.scss";

interface EmailCardProps {
  email: Email;
  onClick?: () => void;
}

function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    if (hours === 0) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return minutes === 0 ? "Just now" : `${minutes}m ago`;
    }
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diffDays < 7) {
    const days = Math.floor(diffDays);
    return days === 1 ? "Yesterday" : `${days}d ago`;
  }

  return timestamp.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function EmailCard({
  email,
  onClick,
}: EmailCardProps): React.ReactElement {
  const [formattedTime, setFormattedTime] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setFormattedTime(formatTimestamp(email.timestamp));
  }, [email.timestamp]);

  const snippet =
    email.body.slice(0, 80) + (email.body.length > 80 ? "..." : "");

  return (
    <div
      className={`${styles.card} ${email.read ? styles.read : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={styles.fromContainer}>
        {!email.read && <div className={styles.unreadDot} />}
        <span className={styles.from}>{email.from}</span>
      </div>
      <span className={styles.subject}>{email.subject}</span>
      <span className={styles.snippet}>{snippet}</span>
      <span className={styles.timestamp}>{isMounted ? formattedTime : ""}</span>
    </div>
  );
}
