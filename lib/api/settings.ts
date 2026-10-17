/**
 * Application settings and integration status.
 *
 * Settings are stored per section on the API. `isDefault` tells the UI whether
 * a section has ever been changed, which is what the Settings screen shows
 * instead of hard-coded demo values.
 */

import { apiData } from "./client";

export const SETTING_KEYS = [
  "company.profile",
  "whatsapp.connection",
  "outlet.database",
  "provinces.categories",
  "user.permissions",
  "approval.workflow",
  "messaging.limits",
  "contact.consent",
  "reporting.pricing",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export interface SettingSection<T = unknown> {
  key: SettingKey;
  value: T;
  /** True until an administrator changes the section. */
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type SettingsMap = Record<SettingKey, SettingSection>;

/** Typed shapes of each settings section, as validated by the API. */
export interface SettingSectionValues {
  "company.profile": {
    legalName: string;
    group: string;
    programme: string;
    country: string;
    dialCode: string;
  };
  "whatsapp.connection": {
    businessAccountId: string | null;
    phoneNumberId: string | null;
    displayName: string | null;
    sendWindowStart: string;
    sendWindowEnd: string;
  };
  "outlet.database": {
    duplicatePolicy: "flag" | "block";
    defaultChannel: string;
    defaultStatus: string;
  };
  "provinces.categories": { provinces: string[]; categories: string[] };
  "user.permissions": { approverRoles: string[]; exportRoles: string[] };
  "approval.workflow": { requireApproval: boolean; approverRoles: string[] };
  "messaging.limits": { dailyCapPerContact: number; maxRecipientsPerCampaign: number };
  "contact.consent": {
    requireExplicitConsent: boolean;
    allowImportWithoutConsent: boolean;
    consentSourceRequired: boolean;
  };
  "reporting.pricing": { configured: boolean; currency: string; costPerMessage: number };
}

/** Read one section's value, falling back when the user cannot see settings. */
export function sectionValue<K extends SettingKey>(
  settings: SettingsMap | null,
  key: K,
): SettingSectionValues[K] | null {
  const section = settings?.[key];
  if (!section) return null;
  return section.value as SettingSectionValues[K];
}

export function getSettings(signal?: AbortSignal): Promise<SettingsMap> {
  return apiData<SettingsMap>("/settings", { signal });
}

export function updateSetting<K extends SettingKey>(
  key: K,
  value: Partial<SettingsMap[K]["value"]>,
): Promise<SettingSection> {
  return apiData<SettingSection>("/settings", { method: "PATCH", body: { key, value } });
}

/* --------------------------- Integration status --------------------------- */

export interface ProviderHealth {
  provider: string;
  connected: boolean;
  /** True when no real WhatsApp credentials are configured. */
  simulated: boolean;
  message: string;
  queue?: Record<string, unknown>;
}

export interface ServiceHealth {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  database: "connected" | "disconnected";
  environment: string;
  whatsapp: { provider: string; simulated: boolean };
}

export function apiHealth(signal?: AbortSignal): Promise<ServiceHealth> {
  return apiData<ServiceHealth>("/health", { signal, auth: false });
}

export function whatsappHealth(signal?: AbortSignal): Promise<ProviderHealth> {
  return apiData<ProviderHealth>("/whatsapp/health", { signal });
}
