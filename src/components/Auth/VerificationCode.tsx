"use client";

import { useState } from "react";
import styles from "./VerificationCode.module.scss";

interface VerificationCodeProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function VerificationCode({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: VerificationCodeProps): React.ReactElement {
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    onChange(newValue);
    if (newValue.length < 6 || newValue.length > 6) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
          <label htmlFor="verification-code-0" className={styles.label}>
            Verification code
          </label>
          <input
            name="verification-code-0"
            id="verification-code-0"
            type="number"
            value={value}
            onChange={handleChange}
            placeholder="Enter your email"
            className={`${styles.input} ${!isValid ? styles.invalid : ""}`}
            disabled={disabled}
            aria-label="Email address"
            aria-invalid={!isValid}
          />
          {!isValid && value.length > 0 && (
            <p className={styles.errorMessage}>
              Please enter a valid verification code
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || value.length !== 6}
          className={`${styles.button} ${
            value.length === 6 && !disabled ? styles.enabled : styles.disabled
          }`}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
