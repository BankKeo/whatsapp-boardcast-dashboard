/**
 * Audit-log endpoints.
 *
 * The server writes an entry for every administrative action, so the activity
 * feed is a read-only view of what actually happened — the client never invents
 * activity entries.
 */

import { apiRequest, toListResult, type ListResult } from "./client";
import type { ActivityEvent, ActivityType } from "@/types/activity";

interface AuditLogRecord {
  id: string;
  type: ActivityType;
  message: string;
  actorName: string;
  createdAt: string;
}

export interface ActivityQuery {
  type?: ActivityType | "all";
  search?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export function listActivity(query: ActivityQuery = {}): Promise<ListResult<ActivityEvent>> {
  const { page = 1, limit = 40, signal, ...rest } = query;
  return apiRequest<AuditLogRecord[]>("/audit-logs", {
    query: { ...rest, page, limit },
    signal,
  }).then(({ data, meta }) => {
    const list = toListResult(data, meta, page, limit);
    return {
      ...list,
      items: list.items.map((entry) => ({
        id: entry.id,
        type: entry.type,
        actor: entry.actorName,
        message: entry.message,
        at: entry.createdAt,
      })),
    };
  });
}
