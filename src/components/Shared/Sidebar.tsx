"use client";

import { useStressStore } from "@/store/stressStore";
import styles from "./Sidebar.module.scss";
import { FaRegEnvelope } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { PiCalendarPlus } from "react-icons/pi";
import { VscSend } from "react-icons/vsc";
import { FaRegFileAlt } from "react-icons/fa";
import { RiSpam2Line } from "react-icons/ri";
import { RiDeleteBin7Line } from "react-icons/ri";

export default function Sidebar() {
  const currentLevel = useStressStore((state) => state.currentLevel);

  if (currentLevel >= 1) {
    return null;
  }

  const folders = [
    { name: "Inbox", icon: <FaRegEnvelope />, count: 5 },
    { name: "Starred", icon: <FaRegStar />, count: null },
    { name: "Scheduled", icon: <PiCalendarPlus />, count: null },
    { name: "Sent", icon: <VscSend />, count: null },
    { name: "Drafts", icon: <FaRegFileAlt />, count: null },
    { name: "Spam", icon: <RiSpam2Line />, count: null },
    { name: "Trash", icon: <RiDeleteBin7Line />, count: null },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {folders.map((folder) => (
          <button key={folder.name} className={styles.folderItem} type="button">
            <span className={styles.folderIcon}>{folder.icon}</span>
            <span className={styles.folderName}>{folder.name}</span>
            {folder.count !== null && (
              <span className={styles.folderCount}>{folder.count}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
