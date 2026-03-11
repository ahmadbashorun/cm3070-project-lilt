"use client";

import { useMemo } from "react";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import { FaRegEnvelope, FaRegStar } from "react-icons/fa";
import { PiCalendarPlus } from "react-icons/pi";
import { VscSend } from "react-icons/vsc";
import { FaRegFileAlt } from "react-icons/fa";
import { RiSpam2Line, RiDeleteBin7Line } from "react-icons/ri";
import type { EmailFolder } from "@/types";
import styles from "./EmailSidebar.module.scss";

interface EmailSidebarProps {
  selectedFolder: EmailFolder | null;
  onFolderSelect: (folder: EmailFolder) => void;
}

export default function EmailSidebar({
  selectedFolder,
  onFolderSelect,
}: EmailSidebarProps) {
  const currentLevel = useStressStore((state) => state.currentLevel);
  const emails = useDataStore((state) => state.emails);

  const inboxCount = useMemo(() => {
    return emails.filter((email) => !email.read).length;
  }, [emails]);

  if (currentLevel >= 1) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Mail</h3>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "inbox" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("inbox");
            }}
          >
            <FaRegEnvelope className={styles.navIcon} />
            <span className={styles.navLabel}>Inbox</span>
            <span className={styles.count}>{inboxCount}</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "starred" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("starred");
            }}
          >
            <FaRegStar className={styles.navIcon} />
            <span className={styles.navLabel}>Starred</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "scheduled" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("scheduled");
            }}
          >
            <PiCalendarPlus className={styles.navIcon} />
            <span className={styles.navLabel}>Scheduled</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "sent" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("sent");
            }}
          >
            <VscSend className={styles.navIcon} />
            <span className={styles.navLabel}>Sent</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "drafts" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("drafts");
            }}
          >
            <FaRegFileAlt className={styles.navIcon} />
            <span className={styles.navLabel}>Drafts</span>
          </button>
        </nav>
      </section>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>More</h3>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "spam" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("spam");
            }}
          >
            <RiSpam2Line className={styles.navIcon} />
            <span className={styles.navLabel}>Spam</span>
          </button>
          <button
            className={`${styles.navItem} ${
              selectedFolder === "trash" ? styles.active : ""
            }`}
            type="button"
            onClick={() => {
              onFolderSelect("trash");
            }}
          >
            <RiDeleteBin7Line className={styles.navIcon} />
            <span className={styles.navLabel}>Trash</span>
          </button>
        </nav>
      </section>
    </aside>
  );
}
