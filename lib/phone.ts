/** Lao phone number helpers (formatting and validation). */

import type { PhoneStatus } from "@/types/outlet";

/** Lao mobile numbers: +856 20 followed by 8 digits. */
export const LAO_MOBILE_PATTERN = /^\+85620\d{8}$/;

/**
 * Normalises a user-entered Lao mobile number.
 * Accepts local (`020 …`), international (`+856 20 …`) and loose spacing.
 * Returns a display-formatted number, or `null` when it cannot be reconciled.
 */
export function normalizeLaoPhone(raw: string): string | null {
  if (!raw) return null;
  let value = raw.trim().replace(/[\s\-().]/g, "");
  if (!value) return null;
  if (value.startsWith("++")) value = value.slice(1);
  if (value.startsWith("00")) value = `+${value.slice(2)}`;

  if (value.startsWith("+")) {
    // Already international — keep as is.
  } else if (/^856\d{8,10}$/.test(value)) {
    value = `+${value}`;
  } else if (/^0\d{9,10}$/.test(value)) {
    // Local format, e.g. 020 5555 1188 → +856 20 5555 1188
    value = `+856${value.slice(1)}`;
  } else if (/^20\d{8}$/.test(value)) {
    // Subscriber format without the country or trunk prefix.
    value = `+856${value}`;
  }

  if (!LAO_MOBILE_PATTERN.test(value)) return null;
  const subscriber = value.slice(6);
  return `+856 20 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
}

export function getPhoneStatus(phone: string): PhoneStatus {
  if (!phone || !phone.trim()) return "Missing";
  return normalizeLaoPhone(phone) ? "Valid" : "Invalid";
}

/** Display helper: keeps invalid values visible so staff can fix them. */
export function formatPhone(phone: string): string {
  if (!phone || !phone.trim()) return "—";
  return normalizeLaoPhone(phone) ?? phone;
}

/** Digits only, used for duplicate detection and search. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
