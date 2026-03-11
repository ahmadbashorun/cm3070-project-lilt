"use client";

import { useState } from "react";
import { isValidEmail } from "@/utils/emailValidation";
import styles from "./EmailInput.module.scss";

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function EmailInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: EmailInputProps): React.ReactElement {
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    onChange(newValue);
    if (newValue.length > 0) {
      setIsValid(isValidEmail(newValue));
    } else {
      setIsValid(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (isValidEmail(value)) {
      onSubmit();
    }
  };

  const canSubmit = isValidEmail(value) && !disabled;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputContainer}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          name="email"
          id="email"
          type="email"
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
            Please enter a valid email address
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className={`${styles.button} ${
          canSubmit ? styles.enabled : styles.disabled
        }`}
      >
        Continue
      </button>
    </form>
  );
}
