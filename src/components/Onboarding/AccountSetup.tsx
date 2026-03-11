"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AccountSetup.module.scss";
import Image from "next/image";

interface AccountSetupProps {
  name: string;
  avatar?: string;
  onSubmit: (data: { name: string; avatar?: string }) => void;
}

export default function AccountSetup({
  name: initialName,
  avatar: initialAvatar,
  onSubmit,
}: AccountSetupProps): React.ReactElement {
  const [localName, setLocalName] = useState(initialName);
  const [preview, setPreview] = useState<string | undefined>(initialAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalName(initialName);
    setPreview(initialAvatar);
  }, [initialName, initialAvatar]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (localName.trim().length > 0) {
      onSubmit({ name: localName, ...(preview ? { avatar: preview } : {}) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Setup your Lilt account</h1>
      <div className={styles.formContainer}>
        <div className={styles.avatarSection}>
          <button
            type="button"
            onClick={handleAvatarClick}
            className={styles.avatarButton}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Avatar preview"
                width={96}
                height={96}
                className={styles.avatarButton}
              />
            ) : (
              <div className={styles.avatarGradient} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </div>
        <div className={styles.nameSection}>
          <label htmlFor="name" className={styles.nameLabel}>
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
            }}
            placeholder="Enter full name"
            className={styles.nameInput}
            required
          />
        </div>
        <button
          type="submit"
          disabled={localName.trim().length === 0}
          className={`${styles.submitButton} ${
            localName.trim().length > 0 ? styles.enabled : styles.disabled
          }`}
        >
          Continue
        </button>
      </div>
    </form>
  );
}
