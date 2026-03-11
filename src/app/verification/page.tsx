"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VerificationCode from "@/components/Auth/VerificationCode";
import ProgressBar from "@/components/Onboarding/ProgressBar";
import { useAuthStore } from "@/store/authStore";
import styles from "./page.module.scss";

export default function VerificationPage(): React.ReactElement {
  const [code, setCode] = useState("");
  const router = useRouter();
  const { email, setAuthenticated } = useAuthStore();

  const handleSubmit = (): void => {
    if (code.length === 6) {
      setAuthenticated(true)
        .then(() => {
          router.push("/onboarding");
        })
        .catch((error: unknown) => {
          console.error("Failed to authenticate:", error);
        });
    }
  };

  const loginProgress = 100;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>Lilt</div>
        <ProgressBar
          progress={loginProgress}
          totalSteps={2}
          currentStep={2}
        />
        <div className={styles.verificationText}>
          <p>Enter verification code sent to</p>
          <p className={styles.email}>{email}</p>
        </div>
        <VerificationCode
          value={code}
          onChange={setCode}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
