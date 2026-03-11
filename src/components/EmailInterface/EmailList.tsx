"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStressStore } from "@/store/stressStore";
import { useDataStore } from "@/store/dataStore";
import {
  filterEmailsByStress,
  groupEmailsByUrgency,
  getCategoryFromEmail,
} from "@/utils/emailUtils";
import { useDashboardLayoutContext } from "@/contexts/DashboardLayoutContext";
import EmailCard from "./EmailCard";
import styles from "./EmailList.module.scss";
import { useRouter } from "next/navigation";

type CategoryTab = "Primary" | "Social" | "Promotions";
type UrgencyTab = "needsAttention" | "canWait";

export default function EmailList() {
  const router = useRouter();
  const currentLevel = useStressStore((state) => state.currentLevel);
  const emails = useDataStore((state) => state.emails);
  const { selectedEmailFolder } = useDashboardLayoutContext();
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryTab>("Primary");
  const [selectedUrgency, setSelectedUrgency] =
    useState<UrgencyTab>("needsAttention");

  const filteredEmails = useMemo(() => {
    // First filter by folder (default to "inbox" if folder is undefined)
    let filtered = emails.filter(
      (email) => (email.folder || "inbox") === (selectedEmailFolder || "inbox")
    );

    // Then filter by stress level
    filtered = filterEmailsByStress(filtered, currentLevel);

    if (currentLevel <= 1) {
      if (selectedCategory !== "Primary") {
        filtered = filtered.filter(
          (email) => getCategoryFromEmail(email) === selectedCategory
        );
      }
    }

    return filtered;
  }, [currentLevel, selectedCategory, emails, selectedEmailFolder]);

  const groupedEmails = useMemo(() => {
    if (currentLevel === 2) {
      return groupEmailsByUrgency(filteredEmails);
    }
    return null;
  }, [currentLevel, filteredEmails]);

  const displayedEmails =
    currentLevel === 2
      ? selectedUrgency === "needsAttention"
        ? groupedEmails?.needsAttention || []
        : groupedEmails?.canWait || []
      : filteredEmails;

  const handleEmailClick = (emailId: string): void => {
    router.push(`/emails/${emailId}`);
  };

  if (currentLevel === 3) {
    return null;
  }

  return (
    <div className={`${styles.container} ${styles[`level${currentLevel}`]}`}>
      {currentLevel <= 1 && selectedEmailFolder === "inbox" && (
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${
              selectedCategory === "Primary" ? styles.active : ""
            }`}
            onClick={() => {
              setSelectedCategory("Primary");
            }}
            type="button"
          >
            Primary
          </button>
          <button
            className={`${styles.categoryTab} ${
              selectedCategory === "Social" ? styles.active : ""
            }`}
            onClick={() => {
              setSelectedCategory("Social");
            }}
            type="button"
          >
            Social
          </button>
          <button
            className={`${styles.categoryTab} ${
              selectedCategory === "Promotions" ? styles.active : ""
            }`}
            onClick={() => {
              setSelectedCategory("Promotions");
            }}
            type="button"
          >
            Promotions
          </button>
        </div>
      )}

      {currentLevel === 2 && (
        <>
          <p className={styles.noticeBanner}>
            You may be getting stressed, so we&apos;re surfacing only what
            matters
          </p>
          <div className={styles.urgencyTabs}>
            <button
              className={`${styles.urgencyTab} ${
                selectedUrgency === "needsAttention" ? styles.active : ""
              }`}
              onClick={() => {
                setSelectedUrgency("needsAttention");
              }}
              type="button"
            >
              Needs attention
            </button>
            <button
              className={`${styles.urgencyTab} ${
                selectedUrgency === "canWait" ? styles.active : ""
              }`}
              onClick={() => {
                setSelectedUrgency("canWait");
              }}
              type="button"
            >
              Can wait
            </button>
          </div>
        </>
      )}

      <motion.div
        className={styles.emailList}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="popLayout">
          {displayedEmails.length === 0 ? (
            <motion.div
              key="empty"
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No emails to display
            </motion.div>
          ) : (
            displayedEmails.map((email) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.3,
                  // delay: index * 0.05,
                  ease: "easeInOut",
                }}
              >
                <EmailCard
                  email={email}
                  onClick={() => {
                    handleEmailClick(email.id);
                  }}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
