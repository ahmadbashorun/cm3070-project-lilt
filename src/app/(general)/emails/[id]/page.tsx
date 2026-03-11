"use client";

import EmailDetailView from "@/components/EmailInterface/EmailDetailView";
import { useDataStore } from "@/store/dataStore";
import { useStressStore } from "@/store/stressStore";
import { addItem as addRecentItem } from "@/utils/recentItemsTracker";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import styles from "./page.module.scss";
import { IoReturnDownForward } from "react-icons/io5";
import { HiOutlineDotsVertical } from "react-icons/hi";

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  const emails = useDataStore((state) => state.emails);
  const currentLevel = useStressStore((state) => state.currentLevel);

  const email = useMemo(() => {
    return emails.find((e) => e.id === emailId);
  }, [emails, emailId]);

  useEffect(() => {
    if (email) {
      addRecentItem(email, "email");
    }
  }, [email]);

  if (!email) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Email Not Found</h1>
          <p>
            The email you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <button
            type="button"
            onClick={() => {
              router.push("/dashboard?tab=email");
            }}
            className={styles.backButton}
            aria-label="Return to Inbox"
          >
            ← Back to Inbox
          </button>
        </div>
      </div>
    );
  }

  if (currentLevel === 3) {
    return <EmailDetailView emailId={emailId} />;
  }

  // For other stress levels (0, 1, 2, 4), render a simplified detail view
  const formatDate = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      return timestamp.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    }

    return timestamp.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <button
          type="button"
          onClick={() => {
            router.push("/dashboard?tab=email");
          }}
          className={styles.backButton}
          aria-label="Back to Inbox"
        >
          ← Back to Inbox
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.subject}>{email.subject}</h1>
          <div className={styles.meta}>
            <div className={styles.from}>
              <span className={styles.fromName}>{email.from}</span>
              <span className={styles.to}>to me</span>
            </div>
            <div className={styles.dateInfo}>
              <span className={styles.date}>
                {formatDate(email.timestamp)}, {formatDate(email.timestamp)}
              </span>
              <span className={styles.relativeDate}>4 days ago</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.actionButton} type="button">
                <IoReturnDownForward />
              </button>
              <button className={styles.actionButton} type="button">
                <HiOutlineDotsVertical />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.bodyText}>{email.body}</p>
        </div>

        <div className={styles.footer}>
          <button className={styles.forwardButton} type="button">
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
