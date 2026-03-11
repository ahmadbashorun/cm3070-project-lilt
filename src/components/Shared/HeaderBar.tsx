"use client";

import { useStressStore } from "@/store/stressStore";
import styles from "./HeaderBar.module.scss";
import { IoSearchOutline } from "react-icons/io5";
import { PiPencilSimpleLineThin } from "react-icons/pi";
import { PiBellLight } from "react-icons/pi";
import Link from "next/link";

interface HeaderBarProps {
  selectedTab: "email" | "tasks";
  onTabChange: (tab: "email" | "tasks") => void;
  onComposeClick?: () => void;
  onSearchClick?: () => void;
}

export default function HeaderBar({
  selectedTab,
  onTabChange,
  onComposeClick,
  onSearchClick,
}: HeaderBarProps): React.ReactElement {
  const currentLevel = useStressStore((state) => state.currentLevel);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSearchClick?.();
    }
  };

  return (
    <header className={`${styles.header} ${styles[`level${currentLevel}`]}`}>
      <div className={styles.left}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              selectedTab === "email" ? styles.active : ""
            }`}
            onClick={() => {
              onTabChange("email");
            }}
            type="button"
          >
            Email
          </button>
          <button
            className={`${styles.tab} ${
              selectedTab === "tasks" ? styles.active : ""
            }`}
            onClick={() => {
              onTabChange("tasks");
            }}
            type="button"
          >
            Tasks
          </button>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>
            <IoSearchOutline />
          </span>
          <input
            type="search"
            id="search-input"
            name="search"
            className={styles.searchInput}
            value={undefined}
            autoComplete="off"
            aria-autocomplete="none"
            onChange={() => {}}
            onKeyDown={handleKeyDown}
            onFocus={onSearchClick}
          />
          <span className={styles.shortcutHint}>⌘K</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.rightTop}>
          <button
            className={styles.iconButton}
            onClick={onComposeClick}
            aria-label="Compose"
            type="button"
          >
            <PiPencilSimpleLineThin className={styles.icon} />
          </button>
          <button
            className={styles.iconButton}
            aria-label="Notifications"
            type="button"
          >
            <PiBellLight className={styles.icon} />
          </button>
          <Link href="/dashboard/settings">
            <button
              className={styles.avatarButton}
              aria-label="Profile"
              type="button"
            >
              <span className={styles.avatar}>A</span>
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
