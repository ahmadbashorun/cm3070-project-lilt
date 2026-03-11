import type { Email, StressLevel } from "@/types";

export function calculateEmailPriority(email: Email): number {
  return (
    email.urgency * 0.4 +
    email.senderImportance * 0.3 +
    email.projectRelevance * 0.2 +
    email.deadlineProximity * 0.1
  );
}

export function getCategoryFromEmail(
  email: Email
): "Primary" | "Social" | "Promotions" {
  const domain = email.from.split("@")[1]?.toLowerCase() || "";
  const subject = email.subject.toLowerCase();

  if (
    domain.includes("social") ||
    domain.includes("facebook") ||
    domain.includes("twitter") ||
    domain.includes("linkedin") ||
    subject.includes("social")
  ) {
    return "Social";
  }

  if (
    domain.includes("promo") ||
    domain.includes("marketing") ||
    domain.includes("deal") ||
    subject.includes("sale") ||
    subject.includes("promo") ||
    subject.includes("discount")
  ) {
    return "Promotions";
  }

  return "Primary";
}

export function filterEmailsByStress(
  emails: Email[],
  level: StressLevel
): Email[] {
  switch (level) {
    case 0:
      return emails;
    case 1:
      return emails.filter(
        (email) => getCategoryFromEmail(email) === "Primary"
      );
    case 2:
    case 3:
    case 4:
      return emails
        .map((email) => ({
          email,
          priority: calculateEmailPriority(email),
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, level === 2 ? 10 : level === 3 ? 3 : 0)
        .map((item) => item.email);
    default:
      return emails;
  }
}

export function groupEmailsByUrgency(emails: Email[]): {
  needsAttention: Email[];
  canWait: Email[];
} {
  const needsAttention: Email[] = [];
  const canWait: Email[] = [];

  emails.forEach((email) => {
    const priority = calculateEmailPriority(email);
    if (priority > 0.7) {
      needsAttention.push(email);
    } else {
      canWait.push(email);
    }
  });

  return {
    needsAttention: needsAttention.sort(
      (a, b) => calculateEmailPriority(b) - calculateEmailPriority(a)
    ),
    canWait: canWait.sort(
      (a, b) => calculateEmailPriority(b) - calculateEmailPriority(a)
    ),
  };
}
