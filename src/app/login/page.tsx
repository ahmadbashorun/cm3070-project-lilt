"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmailInput from "@/components/Auth/EmailInput";
import ProgressBar from "@/components/Onboarding/ProgressBar";
import { useAuthStore } from "@/store/authStore";
import styles from "./page.module.scss";

export default function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { setEmail: setAuthEmail, setVerificationCodeSent } = useAuthStore();

  const handleSubmit = (): void => {
    void setAuthEmail(email).then(() => {
      setVerificationCodeSent(true);
      router.push("/verification");
    });
  };

  const loginProgress = 50;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>Lilt</div>
        <ProgressBar
          progress={loginProgress}
          totalSteps={2}
          currentStep={1}
        />
        <p className={styles.description}>
          Enter your email to get started or log in to your account.
        </p>
        <h1 className={styles.title}>Welcome to Lilt</h1>
        <EmailInput value={email} onChange={setEmail} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
