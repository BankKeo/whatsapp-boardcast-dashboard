/** WhatsApp message template types. */

export const TEMPLATE_CATEGORIES = [
  "Seasonal Promotion",
  "New Product Announcement",
  "Partner Club Update",
  "Promotional Reminder",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_STATUSES = [
  "Approved",
  "Pending Approval",
  "Rejected",
  "Draft",
] as const;

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export type TemplateLanguage = "en" | "lo";

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  /**
   * Template body. Variables use WhatsApp's `{{1}}` positional syntax and are
   * mapped through `variables`.
   */
  body: string;
  variables: TemplateVariable[];
  status: TemplateStatus;
  /** Only set when the template is locally Approved in this prototype. */
  externalApprovalId: string | null;
  updatedAt: string;
  usageCount: number;
  notes: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
}

/** Variables available to campaign message composition. */
export const TEMPLATE_VARIABLE_LIBRARY: TemplateVariable[] = [
  { key: "{{1}}", label: "Outlet name", example: "Sok Dee Minimart" },
  { key: "{{2}}", label: "Owner name", example: "Khamla S." },
  { key: "{{3}}", label: "Province", example: "Vientiane Capital" },
  { key: "{{4}}", label: "Promotion period", example: "1–15 Nov 2026" },
  { key: "{{5}}", label: "Campaign reference", example: "PC-2026-0184" },
  { key: "{{6}}", label: "Contact number", example: "+856 20 5555 1188" },
];
