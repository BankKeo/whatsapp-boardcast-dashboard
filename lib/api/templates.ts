/**
 * Message template endpoints.
 *
 * Templates move through their own approval workflow on the API; the dashboard
 * submits and refreshes status rather than flipping `status` locally.
 */

import { apiData, apiRequest, toListResult, type ListResult } from "./client";
import type { MessageTemplate, TemplateCategory, TemplateLanguage, TemplateStatus } from "@/types/template";

export interface TemplateListQuery {
  search?: string;
  status?: TemplateStatus | "all";
  language?: TemplateLanguage | "all";
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export function listTemplates(query: TemplateListQuery = {}): Promise<ListResult<MessageTemplate>> {
  const { page = 1, limit = 100, signal, ...rest } = query;
  return apiRequest<MessageTemplate[]>("/templates", { query: { ...rest, page, limit }, signal }).then(
    ({ data, meta }) => toListResult(data, meta, page, limit),
  );
}

export function getTemplate(id: string, signal?: AbortSignal): Promise<MessageTemplate> {
  return apiData<MessageTemplate>(`/templates/${id}`, { signal });
}

export interface TemplateWriteValues {
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  body: string;
  notes: string;
}

export function createTemplate(values: TemplateWriteValues): Promise<MessageTemplate> {
  return apiData<MessageTemplate>("/templates", { method: "POST", body: values });
}

export function updateTemplate(
  id: string,
  values: Partial<TemplateWriteValues>,
): Promise<MessageTemplate> {
  return apiData<MessageTemplate>(`/templates/${id}`, { method: "PATCH", body: values });
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiRequest<void>(`/templates/${id}`, { method: "DELETE" });
}

/** Submit a draft template for WhatsApp approval. */
export function submitTemplateForApproval(id: string): Promise<MessageTemplate> {
  return apiData<MessageTemplate>(`/templates/${id}/submit-for-approval`, { method: "POST" });
}

/** Re-read the approval state from the WhatsApp provider. */
export function refreshTemplateStatus(id: string): Promise<MessageTemplate> {
  return apiData<MessageTemplate>(`/templates/${id}/refresh-status`, { method: "POST" });
}
