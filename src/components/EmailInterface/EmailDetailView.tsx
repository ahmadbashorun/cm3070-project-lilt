"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import { filterEmailsByStress } from "@/utils/emailUtils";
import GuidancePanel from "./GuidancePanel";
import styles from "./EmailDetailView.module.scss";
import { IoReturnDownForward } from "react-icons/io5";
import { HiOutlineDotsVertical } from "react-icons/hi";

interface EmailDetailViewProps {
  emailId?: string;
}

function formatDate(timestamp: Date): string {
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
}

export default function EmailDetailView({ emailId }: EmailDetailViewProps) {
  const router = useRouter();
  const currentLevel = useStressStore((state) => state.currentLevel);
  const allEmails = useDataStore((state) => state.emails);

  const emails = useMemo(() => {
    return filterEmailsByStress(allEmails, currentLevel);
  }, [currentLevel, allEmails]);

  const email = useMemo(() => {
    if (emailId) {
      return emails.find((e) => e.id === emailId);
    }
    return emails[0] || null;
  }, [emailId, emails]);

  const urgentEmailsCount = useMemo(() => {
    return emails.filter((e) => e.priority > 0.7).length;
  }, [emails]);

  const handleTakeBreak = (): void => {
    useStressStore.setState({ currentLevel: 0 });
  };

  const handleGuidedBreak = (): void => {
    useStressStore.setState({ currentLevel: 4 });
  };

  if (currentLevel !== 3) {
    return null;
  }

  const emailNotInFocusList = Boolean(emailId && !email && emails.length > 0);
  const noEmailsInFocusList = !email && emails.length === 0;

  if (emailNotInFocusList) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.backBar}>
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
          <div
            className={styles.emptyState}
            role="status"
            aria-live="polite"
          >
            <h2 className={styles.emptyStateTitle}>
              This email isn&apos;t in your focus list right now
            </h2>
            <p className={styles.emptyStateBody}>
              We&apos;ve detected high stress, so we&apos;re showing only your
              top 3 priority emails to reduce overload. This email is outside
              that list. You can view your focused emails or take a break to see
              more.
            </p>
            <div className={styles.emptyStateActions}>
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard?tab=email");
                }}
                className={styles.backButton}
                aria-label="View my focused emails"
              >
                View my focused emails
              </button>
              <button
                type="button"
                onClick={handleTakeBreak}
                className={styles.emptyStateSecondaryButton}
                aria-label="Take a break to lower stress"
              >
                Take a break
              </button>
            </div>
          </div>
        </div>
      <GuidancePanel
        urgentEmailsCount={urgentEmailsCount}
        onTakeBreak={handleTakeBreak}
        onGuidedBreak={handleGuidedBreak}
      />
    </div>
  );
  }

  if (noEmailsInFocusList) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.backBar}>
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
          <div
            className={styles.emptyState}
            role="status"
            aria-live="polite"
          >
            <h2 className={styles.emptyStateTitle}>
              No emails in your focus list
            </h2>
            <p className={styles.emptyStateBody}>
              At high stress we limit the view to your top 3 priority emails.
              There are none in your list right now. Consider taking a break or
              checking back later when you&apos;re ready.
            </p>
            <div className={styles.emptyStateActions}>
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard?tab=email");
                }}
                className={styles.backButton}
                aria-label="Back to Inbox"
              >
                Back to Inbox
              </button>
              <button
                type="button"
                onClick={handleTakeBreak}
                className={styles.emptyStateSecondaryButton}
                aria-label="Take a break to lower stress"
              >
                Take a break
              </button>
            </div>
          </div>
        </div>
      <GuidancePanel
        urgentEmailsCount={urgentEmailsCount}
        onTakeBreak={handleTakeBreak}
        onGuidedBreak={handleGuidedBreak}
      />
    </div>
  );
  }

  if (!email) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.backBar}>
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

      <GuidancePanel
        urgentEmailsCount={urgentEmailsCount}
        onTakeBreak={handleTakeBreak}
        onGuidedBreak={handleGuidedBreak}
      />
    </div>
  );
}
