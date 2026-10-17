"use client";

/**
 * Client-side demo data store.
 *
 * The dataset is generated in the browser after mount (so relative dates are
 * always current and prerendering stays deterministic) and changes are persisted
 * to localStorage. Nothing here talks to a backend or to WhatsApp.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import { CURRENT_USER } from "@/lib/data/constants";
import { getDemoDataset } from "@/lib/data/dataset";
import { segmentSchema } from "@/lib/schemas/segment";
import { campaignSchema } from "@/lib/schemas/campaign";
import { templateSchema } from "@/lib/schemas/template";
import { simulateMetrics, type CampaignFilters } from "@/lib/services/campaign-service";
import {
  computeOutletStats,
  createOutletRecord,
  updateOutletRecord,
  type CsvImportRow,
} from "@/lib/services/outlet-service";
import {
  createSegmentRecord,
  duplicateSegmentRecord,
} from "@/lib/services/segment-service";
import {
  createTemplateRecord,
  duplicateTemplateRecord,
  updateTemplateRecord,
} from "@/lib/services/template-service";
import { createTeamMember } from "@/lib/services/team-service";
import type { SegmentFormValues } from "@/lib/schemas/segment";
import type {
  CampaignAudienceValues,
  CampaignDetailsValues,
  CampaignMessageValues,
} from "@/lib/schemas/campaign";
import type { OutletFormValues } from "@/lib/schemas/outlet";
import type { TemplateFormValues } from "@/lib/schemas/template";
import type { TeamMemberFormValues } from "@/lib/schemas/team";
import type { ActivityEvent, ActivityType } from "@/types/activity";
import type { Campaign, CampaignStatus } from "@/types/campaign";
import type { Outlet, OutletStats } from "@/types/outlet";
import type { Segment } from "@/types/segment";
import type { MessageTemplate } from "@/types/template";
import type { TeamMember, TeamMemberStatus, TeamRole } from "@/types/team";

const STORAGE_KEY = "partner-club-demo-v1";

/* Stable empty collections, used while the dataset loads in the browser. */
const NO_OUTLETS: Outlet[] = [];
const NO_SEGMENTS: Segment[] = [];
const NO_CAMPAIGNS: Campaign[] = [];
const NO_TEMPLATES: MessageTemplate[] = [];
const NO_TEAM: TeamMember[] = [];
const NO_ACTIVITY: ActivityEvent[] = [];
const NO_OVERRIDES: OutletOverrides = { upserts: [], deletes: [] };

interface OutletOverrides {
  upserts: Outlet[];
  deletes: string[];
}

interface PersistedState {
  version: 1;
  savedAt: string;
  outlets: OutletOverrides;
  segments: Segment[];
  campaigns: Campaign[];
  templates: MessageTemplate[];
  team: TeamMember[];
  activity: ActivityEvent[];
}

export interface DemoState {
  outlets: Outlet[];
  segments: Segment[];
  campaigns: Campaign[];
  templates: MessageTemplate[];
  team: TeamMember[];
  activity: ActivityEvent[];
  outletOverrides: OutletOverrides;
}

export interface CampaignDraft {
  details: CampaignDetailsValues;
  audience: CampaignAudienceValues & { recipients: number };
  message: CampaignMessageValues & { templateName: string | null };
  scheduledAt: string | null;
}

export interface DemoStoreValue extends DemoState {
  ready: boolean;
  persisted: boolean;
  outletStats: OutletStats;
  createOutlet: (values: OutletFormValues) => Outlet;
  updateOutlet: (id: string, values: OutletFormValues) => void;
  deleteOutlets: (ids: string[]) => void;
  importOutlets: (rows: CsvImportRow[]) => number;
  saveSegment: (values: SegmentFormValues, id?: string) => Segment;
  deleteSegment: (id: string) => void;
  duplicateSegment: (id: string) => Segment | null;
  createCampaign: (draft: CampaignDraft, status: CampaignStatus, options?: { simulate?: boolean }) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  duplicateCampaign: (id: string) => Campaign | null;
  simulateSend: (id: string) => void;
  saveTemplate: (values: TemplateFormValues, id?: string) => MessageTemplate;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => MessageTemplate | null;
  inviteTeamMember: (values: TeamMemberFormValues) => TeamMember;
  updateTeamMember: (id: string, patch: { role?: TeamRole; status?: TeamMemberStatus }) => void;
  logActivity: (type: ActivityType, message: string, actor?: string) => void;
  resetDemoData: () => void;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

/* ------------------------------------------------------------------ */
/* Persistence                                                        */
/* ------------------------------------------------------------------ */

const outletSchemaForStorage = z.object({ id: z.string() }).passthrough();

function readPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.version !== 1) return null;
    const segments = z.array(segmentSchema).safeParse(parsed.segments);
    const campaigns = z.array(campaignSchema).safeParse(parsed.campaigns);
    const templates = z.array(templateSchema).safeParse(parsed.templates);
    const upserts = z.array(outletSchemaForStorage).safeParse(parsed.outlets?.upserts ?? []);
    const deletes = z.array(z.string()).safeParse(parsed.outlets?.deletes ?? []);
    if (
      !segments.success ||
      !campaigns.success ||
      !templates.success ||
      !upserts.success ||
      !deletes.success
    ) {
      return null;
    }
    return {
      version: 1,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
      segments: segments.data as Segment[],
      campaigns: campaigns.data as Campaign[],
      templates: templates.data as MessageTemplate[],
      team: Array.isArray(parsed.team) ? parsed.team : [],
      activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      outlets: {
        upserts: upserts.data as unknown as Outlet[],
        deletes: deletes.data,
      },
    };
  } catch {
    return null;
  }
}

function applyOverrides(base: Outlet[], overrides: OutletOverrides): Outlet[] {
  if (overrides.upserts.length === 0 && overrides.deletes.length === 0) return base;
  const deleted = new Set(overrides.deletes);
  const upserts = new Map(overrides.upserts.map((outlet) => [outlet.id, outlet]));
  const result: Outlet[] = [];
  for (const outlet of base) {
    if (deleted.has(outlet.id)) continue;
    result.push(upserts.get(outlet.id) ?? outlet);
    upserts.delete(outlet.id);
  }
  for (const outlet of upserts.values()) result.unshift(outlet);
  return result;
}

function buildInitialState(): { state: DemoState; persisted: boolean } {
  const dataset = getDemoDataset();
  const stored = readPersisted();
  if (!stored) {
    return {
      persisted: false,
      state: {
        outlets: dataset.outlets,
        segments: dataset.segments,
        campaigns: dataset.campaigns,
        templates: dataset.templates,
        team: dataset.team,
        activity: dataset.activity,
        outletOverrides: { upserts: [], deletes: [] },
      },
    };
  }
  return {
    persisted: true,
    state: {
      outlets: applyOverrides(dataset.outlets, stored.outlets),
      segments: stored.segments.length > 0 ? stored.segments : dataset.segments,
      campaigns: stored.campaigns.length > 0 ? stored.campaigns : dataset.campaigns,
      templates: stored.templates.length > 0 ? stored.templates : dataset.templates,
      team: stored.team.length > 0 ? stored.team : dataset.team,
      activity: stored.activity.length > 0 ? stored.activity : dataset.activity,
      outletOverrides: stored.outlets,
    },
  };
}

function persist(state: DemoState) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedState = {
      version: 1,
      savedAt: new Date().toISOString(),
      outlets: state.outletOverrides,
      segments: state.segments,
      campaigns: state.campaigns,
      templates: state.templates,
      team: state.team,
      activity: state.activity.slice(0, 40),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Demo persistence is best-effort: sandboxed or full storage is not fatal.
  }
}

/* ------------------------------------------------------------------ */
/* Provider                                                          */
/* ------------------------------------------------------------------ */

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [persisted, setPersisted] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const stateRef = useRef<DemoState | null>(null);

  useEffect(() => {
    const { state: initial, persisted: restored } = buildInitialState();
    stateRef.current = initial;
    setState(initial);
    setPersisted(restored);
  }, []);

  useEffect(() => {
    if (!state) {
      try {
        window.localStorage.setItem(`${STORAGE_KEY}-probe`, "1");
        window.localStorage.removeItem(`${STORAGE_KEY}-probe`);
      } catch {
        setStorageBlocked(true);
      }
      return;
    }
    stateRef.current = state;
    persist(state);
  }, [state]);

  const pushActivity = useCallback(
    (current: DemoState, type: ActivityType, message: string, actor: string): ActivityEvent[] => {
      const event: ActivityEvent = {
        id: `act-${crypto.randomUUID().slice(0, 8)}`,
        type,
        actor,
        message,
        at: new Date().toISOString(),
      };
      return [event, ...current.activity].slice(0, 40);
    },
    [],
  );

  const createOutlet = useCallback((values: OutletFormValues) => {
    const record = createOutletRecord(values, { id: `out-${crypto.randomUUID().slice(0, 8)}` });
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        outlets: [record, ...current.outlets],
        outletOverrides: {
          upserts: [record, ...current.outletOverrides.upserts],
          deletes: current.outletOverrides.deletes,
        },
        activity: pushActivity(
          current,
          "outlet",
          `Outlet “${record.name}” was added to the demo database.`,
          CURRENT_USER.name,
        ),
      };
    });
    return record;
  }, [pushActivity]);

  const updateOutlet = useCallback((id: string, values: OutletFormValues) => {
    setState((current) => {
      if (!current) return current;
      const existing = current.outlets.find((outlet) => outlet.id === id);
      if (!existing) return current;
      const updated = updateOutletRecord(existing, values);
      const upserts = current.outletOverrides.upserts.some((outlet) => outlet.id === id)
        ? current.outletOverrides.upserts.map((outlet) => (outlet.id === id ? updated : outlet))
        : [...current.outletOverrides.upserts, updated];
      return {
        ...current,
        outlets: current.outlets.map((outlet) => (outlet.id === id ? updated : outlet)),
        outletOverrides: { upserts, deletes: current.outletOverrides.deletes },
        activity: pushActivity(
          current,
          "outlet",
          `Outlet “${updated.name}” was updated (${updated.province}).`,
          CURRENT_USER.name,
        ),
      };
    });
  }, [pushActivity]);

  const deleteOutlets = useCallback((ids: string[]) => {
    setState((current) => {
      if (!current || ids.length === 0) return current;
      const idSet = new Set(ids);
      const removedNames = current.outlets
        .filter((outlet) => idSet.has(outlet.id))
        .map((outlet) => outlet.name);
      const baseIds = new Set(getDemoDataset().outlets.map((outlet) => outlet.id));
      const deletes = Array.from(
        new Set([
          ...current.outletOverrides.deletes,
          ...ids.filter((id) => baseIds.has(id)),
        ]),
      );
      return {
        ...current,
        outlets: current.outlets.filter((outlet) => !idSet.has(outlet.id)),
        outletOverrides: {
          upserts: current.outletOverrides.upserts.filter((outlet) => !idSet.has(outlet.id)),
          deletes,
        },
        activity: pushActivity(
          current,
          "outlet",
          `${ids.length} outlet record${ids.length === 1 ? "" : "s"} deleted${
            removedNames.length === 1 ? ` (${removedNames[0]})` : ""
          }. Deleted records can be restored by resetting the demo data.`,
          CURRENT_USER.name,
        ),
      };
    });
  }, [pushActivity]);

  const importOutlets = useCallback((rows: CsvImportRow[]) => {
    const importable = rows.filter((row) => row.values !== null);
    const records = importable.map((row) =>
      createOutletRecord(row.values!, { id: `out-${crypto.randomUUID().slice(0, 8)}` }),
    );
    if (records.length === 0) return 0;
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        outlets: [...records, ...current.outlets],
        outletOverrides: {
          upserts: [...records, ...current.outletOverrides.upserts],
          deletes: current.outletOverrides.deletes,
        },
        activity: pushActivity(
          current,
          "outlet",
          `${records.length.toLocaleString("en-US")} outlet${
            records.length === 1 ? "" : "s"
          } imported from CSV.`,
          CURRENT_USER.name,
        ),
      };
    });
    return records.length;
  }, [pushActivity]);

  const saveSegment = useCallback((values: SegmentFormValues, id?: string) => {
    const existing = id
      ? stateRef.current?.segments.find((segment) => segment.id === id)
      : undefined;
    const saved: Segment = existing
      ? {
          ...existing,
          name: values.name.trim(),
          description: values.description.trim(),
          filters: values.filters,
          updatedAt: new Date().toISOString(),
        }
      : createSegmentRecord(values, CURRENT_USER.name);

    setState((current) => {
      if (!current) return current;
      const segments = existing
        ? current.segments.map((segment) => (segment.id === saved.id ? saved : segment))
        : [saved, ...current.segments];
      return {
        ...current,
        segments,
        activity: pushActivity(
          current,
          "segment",
          `Segment “${saved.name}” ${existing ? "updated" : "saved"}.`,
          CURRENT_USER.name,
        ),
      };
    });
    return saved;
  }, [pushActivity]);

  const deleteSegment = useCallback((id: string) => {
    setState((current) => {
      if (!current) return current;
      const segment = current.segments.find((item) => item.id === id);
      return {
        ...current,
        segments: current.segments.filter((item) => item.id !== id),
        activity: pushActivity(
          current,
          "segment",
          `Segment${segment ? ` “${segment.name}”` : ""} deleted. Campaigns that used it keep their snapshot of audience rules.`,
          CURRENT_USER.name,
        ),
      };
    });
  }, [pushActivity]);

  const duplicateSegment = useCallback((id: string) => {
    const segment = stateRef.current?.segments.find((item) => item.id === id);
    if (!segment) return null;
    const copy = duplicateSegmentRecord(segment);
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        segments: [copy, ...current.segments],
        activity: pushActivity(current, "segment", `Segment “${segment.name}” duplicated.`, CURRENT_USER.name),
      };
    });
    return copy;
  }, [pushActivity]);

  const createCampaign = useCallback(
    (
      draft: CampaignDraft,
      status: CampaignStatus,
      options?: { simulate?: boolean },
    ) => {
      const now = new Date();
      const simulated = options?.simulate === true;
      const campaign: Campaign = {
        id: `cmp-${crypto.randomUUID().slice(0, 8)}`,
        name: draft.details.name.trim(),
        objective: draft.details.objective,
        description: draft.details.description.trim(),
        owner: draft.details.owner.trim(),
        segmentId: draft.audience.segmentId,
        segmentName: draft.audience.segmentName,
        audience: draft.audience.filters,
        recipients: draft.audience.recipients,
        templateId: draft.message.templateId || null,
        templateName: draft.message.templateName ?? null,
        language: draft.message.language,
        message: draft.message.message,
        status: simulated ? "Completed" : status,
        createdAt: now.toISOString(),
        createdBy: CURRENT_USER.name,
        scheduledAt: draft.scheduledAt,
        sentAt: simulated ? now.toISOString() : null,
        metrics: simulated ? simulateMetrics(Math.max(draft.audience.recipients, 1)) : null,
      };
      setState((current) => {
        if (!current) return current;
        return {
          ...current,
          campaigns: [campaign, ...current.campaigns],
          activity: pushActivity(
            current,
            "campaign",
            simulated
              ? `Demo send simulated for “${campaign.name}” — ${(
                  campaign.metrics?.delivered ?? 0
                ).toLocaleString(
                  "en-US",
                )} messages reported as delivered. No real WhatsApp messages were sent.`
              : `Campaign “${campaign.name}” saved as ${status}.${
                  status === "Scheduled" && campaign.scheduledAt
                    ? ` Scheduled for ${campaign.scheduledAt.slice(0, 16).replace("T", " ")}.`
                    : ""
                }`,
            CURRENT_USER.name,
          ),
        };
      });
      return campaign;
    },
    [pushActivity],
  );

  const updateCampaign = useCallback((id: string, patch: Partial<Campaign>) => {
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        campaigns: current.campaigns.map((campaign) =>
          campaign.id === id ? { ...campaign, ...patch } : campaign,
        ),
      };
    });
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setState((current) => {
      if (!current) return current;
      const campaign = current.campaigns.find((item) => item.id === id);
      return {
        ...current,
        campaigns: current.campaigns.filter((item) => item.id !== id),
        activity: pushActivity(
          current,
          "campaign",
          `Draft campaign${campaign ? ` “${campaign.name}”` : ""} deleted.`,
          CURRENT_USER.name,
        ),
      };
    });
  }, [pushActivity]);

  const duplicateCampaign = useCallback((id: string) => {
    const campaign = stateRef.current?.campaigns.find((item) => item.id === id);
    if (!campaign) return null;
    const copy: Campaign = {
      ...campaign,
      id: `cmp-${crypto.randomUUID().slice(0, 8)}`,
      name: `${campaign.name} (copy)`,
      status: "Draft",
      createdAt: new Date().toISOString(),
      createdBy: CURRENT_USER.name,
      scheduledAt: null,
      sentAt: null,
      metrics: null,
    };
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        campaigns: [copy, ...current.campaigns],
        activity: pushActivity(current, "campaign", `Campaign “${campaign.name}” duplicated as a draft.`, CURRENT_USER.name),
      };
    });
    return copy;
  }, [pushActivity]);

  const simulateSend = useCallback((id: string) => {
    const campaign = stateRef.current?.campaigns.find((item) => item.id === id);
    if (!campaign) return;
    const metrics = simulateMetrics(Math.max(campaign.recipients, 1));
    const updated: Campaign = {
      ...campaign,
      status: "Completed",
      sentAt: new Date().toISOString(),
      metrics,
    };
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        campaigns: current.campaigns.map((item) => (item.id === id ? updated : item)),
        activity: pushActivity(
          current,
          "campaign",
          `Demo send simulated for “${campaign.name}” — ${metrics.delivered.toLocaleString(
            "en-US",
          )} messages reported as delivered. No real WhatsApp messages were sent.`,
          CURRENT_USER.name,
        ),
      };
    });
  }, [pushActivity]);

  const saveTemplate = useCallback((values: TemplateFormValues, id?: string) => {
    const existing = id
      ? stateRef.current?.templates.find((template) => template.id === id)
      : undefined;
    const saved: MessageTemplate = existing
      ? updateTemplateRecord(existing, values)
      : createTemplateRecord(values);

    setState((current) => {
      if (!current) return current;
      const templates = existing
        ? current.templates.map((template) => (template.id === saved.id ? saved : template))
        : [saved, ...current.templates];
      return {
        ...current,
        templates,
        activity: pushActivity(
          current,
          "template",
          `Template “${saved.name}” ${existing ? "updated" : "created as a draft"}.`,
          CURRENT_USER.name,
        ),
      };
    });
    return saved;
  }, [pushActivity]);

  const deleteTemplate = useCallback((id: string) => {
    setState((current) => {
      if (!current) return current;
      const template = current.templates.find((item) => item.id === id);
      return {
        ...current,
        templates: current.templates.filter((item) => item.id !== id),
        activity: pushActivity(
          current,
          "template",
          `Template${template ? ` “${template.name}”` : ""} deleted.`,
          CURRENT_USER.name,
        ),
      };
    });
  }, [pushActivity]);

  const duplicateTemplate = useCallback((id: string) => {
    const template = stateRef.current?.templates.find((item) => item.id === id);
    if (!template) return null;
    const copy = duplicateTemplateRecord(template);
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        templates: [copy, ...current.templates],
        activity: pushActivity(current, "template", `Template “${template.name}” duplicated.`, CURRENT_USER.name),
      };
    });
    return copy;
  }, [pushActivity]);

  const inviteTeamMember = useCallback((values: TeamMemberFormValues) => {
    const member = createTeamMember(values);
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        team: [...current.team, member],
        activity: pushActivity(
          current,
          "team",
          `Invitation sent to ${member.name} (${member.role}).`,
          CURRENT_USER.name,
        ),
      };
    });
    return member;
  }, [pushActivity]);

  const updateTeamMember = useCallback(
    (id: string, patch: { role?: TeamRole; status?: TeamMemberStatus }) => {
      setState((current) => {
        if (!current) return current;
        const member = current.team.find((item) => item.id === id);
        if (!member) return current;
        const updated = { ...member, ...patch };
        const detail =
          patch.status === "Deactivated"
            ? `${updated.name} was deactivated.`
            : patch.role
              ? `${updated.name} was moved to the ${patch.role} role.`
              : `${updated.name} was reactivated.`;
        return {
          ...current,
          team: current.team.map((item) => (item.id === id ? updated : item)),
          activity: pushActivity(current, "team", detail, CURRENT_USER.name),
        };
      });
    },
    [pushActivity],
  );

  const logActivity = useCallback(
    (type: ActivityType, message: string) => {
      setState((current) => {
        if (!current) return current;
        return { ...current, activity: pushActivity(current, type, message, CURRENT_USER.name) };
      });
    },
    [pushActivity],
  );

  const resetDemoData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    const { state: initial } = buildInitialState();
    setState(initial);
    setPersisted(false);
  }, []);

  const outletStats = useMemo<OutletStats>(
    () => computeOutletStats(state?.outlets ?? []),
    [state?.outlets],
  );

  const value = useMemo<DemoStoreValue>(() => {
    return {
      outlets: state?.outlets ?? NO_OUTLETS,
      segments: state?.segments ?? NO_SEGMENTS,
      campaigns: state?.campaigns ?? NO_CAMPAIGNS,
      templates: state?.templates ?? NO_TEMPLATES,
      team: state?.team ?? NO_TEAM,
      activity: state?.activity ?? NO_ACTIVITY,
      outletOverrides: state?.outletOverrides ?? NO_OVERRIDES,
      ready: state !== null,
      persisted,
      outletStats,
      createOutlet,
      updateOutlet,
      deleteOutlets,
      importOutlets,
      saveSegment,
      deleteSegment,
      duplicateSegment,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      duplicateCampaign,
      simulateSend,
      saveTemplate,
      deleteTemplate,
      duplicateTemplate,
      inviteTeamMember,
      updateTeamMember,
      logActivity,
      resetDemoData,
    };
  }, [
    state,
    persisted,
    outletStats,
    createOutlet,
    updateOutlet,
    deleteOutlets,
    importOutlets,
    saveSegment,
    deleteSegment,
    duplicateSegment,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    simulateSend,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    inviteTeamMember,
    updateTeamMember,
    logActivity,
    resetDemoData,
  ]);

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
      {storageBlocked ? (
        <p role="status" className="sr-only">
          Browser storage is unavailable, so demo changes will not persist.
        </p>
      ) : null}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore(): DemoStoreValue {
  const context = useContext(DemoStoreContext);
  if (!context) {
    throw new Error("useDemoStore must be used inside <DemoStoreProvider>.");
  }
  return context;
}

export type { CampaignFilters };
