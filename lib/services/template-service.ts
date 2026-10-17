/**
 * Message template helpers (presentation only).
 *
 * Templates are stored and approved on the API; these helpers filter the loaded
 * library, map `{{n}}` variables to their labels, and render a preview using a
 * real outlet record.
 */

import { extractVariables } from "@/lib/schemas/template";
import {
  TEMPLATE_VARIABLE_LIBRARY,
  type MessageTemplate,
  type TemplateLanguage,
  type TemplateStatus,
} from "@/types/template";
import type { Outlet } from "@/types/outlet";

export interface TemplateFilters {
  search: string;
  status: TemplateStatus | "all";
  language: TemplateLanguage | "all";
}

export function filterTemplates(
  templates: MessageTemplate[],
  filters: TemplateFilters,
): MessageTemplate[] {
  return templates.filter((template) => {
    if (filters.search) {
      const needle = filters.search.trim().toLowerCase();
      if (
        needle &&
        !template.name.toLowerCase().includes(needle) &&
        !template.body.toLowerCase().includes(needle) &&
        !template.category.toLowerCase().includes(needle)
      ) {
        return false;
      }
    }
    if (filters.status !== "all" && template.status !== filters.status) return false;
    if (filters.language !== "all" && template.language !== filters.language) return false;
    return true;
  });
}

export function variablesForBody(body: string) {
  const keys = extractVariables(body);
  return keys.map(
    (key) =>
      TEMPLATE_VARIABLE_LIBRARY.find((variable) => variable.key === key) ?? {
        key,
        label: "Unmapped variable",
        example: "—",
      },
  );
}

/**
 * Substitutes WhatsApp positional variables for a preview. Values come from the
 * outlet record or from campaign-level placeholders — never from invented
 * product information.
 */
export function renderTemplate(
  body: string,
  context: {
    outlet?: Outlet;
    promotionPeriod?: string;
    campaignReference?: string;
    contactNumber?: string;
  } = {},
): string {
  const { outlet } = context;
  const replacements: Record<string, string> = {
    "{{1}}": outlet?.name ?? "Sok Dee Mini Mart",
    "{{2}}": outlet?.ownerName ?? "Khamla S.",
    "{{3}}": outlet?.province ?? "Vientiane Capital",
    "{{4}}": context.promotionPeriod ?? "[promotion period]",
    "{{5}}": context.campaignReference ?? "PC-0000-0000",
    "{{6}}": context.contactNumber ?? "+856 20 5555 1188",
  };
  return body.replace(/\{\{\d+\}\}/g, (match) => replacements[match] ?? match);
}
