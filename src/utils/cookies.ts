"use server";

import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "auth-token";
const EMAIL_COOKIE_NAME = "auth-email";

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value ?? null;
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function setEmailCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(EMAIL_COOKIE_NAME, email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getEmailCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get(EMAIL_COOKIE_NAME);
  return email?.value ?? null;
}

export async function removeEmailCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(EMAIL_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthCookie();
  return token !== null;
}

const ONBOARDING_COOKIE_NAME = "onboarding-complete";

export async function setOnboardingCookie(complete: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_COOKIE_NAME, complete ? "true" : "false", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function getOnboardingCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ONBOARDING_COOKIE_NAME);
  return cookie?.value === "true";
}

const PREFERENCES_COOKIE_NAME = "detection-preferences";

export async function setPreferencesCookie(preferences: {
  typingAndMouse: boolean;
  posture: boolean;
  facialExpression: boolean;
  emailContext: boolean;
}): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PREFERENCES_COOKIE_NAME, JSON.stringify(preferences), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function getPreferencesCookie(): Promise<{
  typingAndMouse: boolean;
  posture: boolean;
  facialExpression: boolean;
  emailContext: boolean;
} | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PREFERENCES_COOKIE_NAME);
  if (!cookie?.value) {
    return null;
  }
  try {
    return JSON.parse(cookie.value) as {
      typingAndMouse: boolean;
      posture: boolean;
      facialExpression: boolean;
      emailContext: boolean;
    };
  } catch {
    return null;
  }
}
