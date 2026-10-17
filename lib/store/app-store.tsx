"use client";

/**
 * API-backed application store.
 *
 * Holds the bounded collections the dashboard shows everywhere (segments,
 * templates, team, the recent activity feed, outlet statistics, settings and
 * integration health) and exposes the write actions.
 *
 * Two things deliberately live outside this store:
 *  - **outlets**, because the register is paginated and never fully loaded; the
 *    outlet screens query `/outlets` directly and read counts from
 *    `outletStats`.
 *  - **campaigns**, because campaign screens filter and page server-side and the
 *    dashboard reads aggregated figures from `/reports/*`.
 *
 * Every mutation calls the API and then refreshes the collection(s) it affects,
 * so what is on screen always comes from the server.
 */

import * as React from "react";
import * as outletApi from "@/lib/api/outlets";
import * as segmentApi from "@/lib/api/segments";
import * as campaignApi from "@/lib/api/campaigns";
import * as templateApi from "@/lib/api/templates";
import * as userApi from "@/lib/api/users";
import * as settingsApi from "@/lib/api/settings";
import * as auditApi from "@/lib/api/audit";
import { ApiError } from "@/lib/api/client";
import type { Outlet, OutletStats } from "@/types/outlet";
import type { Segment } from "@/types/segment";
import type { Campaign } from "@/types/campaign";
import type { MessageTemplate } from "@/types/template";
import type { TeamMember, TeamMemberStatus, TeamRole } from "@/types/team";
import type { ActivityEvent } from "@/types/activity";
import type { ProviderHealth, SettingKey, SettingsMap } from "@/lib/api/settings";
import type { OutletFormValues } from "@/lib/schemas/outlet";
import type { SegmentFormValues } from "@/lib/schemas/segment";
import type { TemplateFormValues } from "@/lib/schemas/template";
import type { TeamMemberFormValues } from "@/lib/schemas/team";

const NO_SEGMENTS: Segment[] = [];
const NO_TEMPLATES: MessageTemplate[] = [];
const NO_TEAM: TeamMember[] = [];
const NO_ACTIVITY: ActivityEvent[] = [];

export interface AppStoreValue {
  /** True once the first load has finished (successfully or not). */
  ready: boolean;
  /** True while a load or refresh is in flight. */
  loading: boolean;
  error: string | null;

  outletStats: OutletStats | null;
  segments: Segment[];
  segmentsTotal: number;
  templates: MessageTemplate[];
  templatesTotal: number;
  team: TeamMember[];
  activity: ActivityEvent[];
  settings: SettingsMap | null;
  health: ProviderHealth | null;

  reload: () => Promise<void>;

  /* Outlets */
  createOutlet: (values: OutletFormValues) => Promise<Outlet>;
  updateOutlet: (id: string, values: OutletFormValues) => Promise<Outlet>;
  deleteOutlets: (ids: string[]) => Promise<void>;
  bulkCreateOutlets: (values: outletApi.OutletWriteValues[]) => Promise<number>;

  /* Segments */
  saveSegment: (values: SegmentFormValues, id?: string) => Promise<Segment>;
  deleteSegment: (id: string) => Promise<void>;
  duplicateSegment: (id: string) => Promise<Segment>;

  /* Campaigns (list data is queried directly by the campaign screens) */
  createCampaign: (values: campaignApi.CampaignCreateValues) => Promise<Campaign>;
  updateCampaign: (id: string, values: campaignApi.CampaignUpdateValues) => Promise<Campaign>;
  cancelCampaign: (id: string, reason?: string) => Promise<Campaign>;
  submitCampaign: (id: string) => Promise<Campaign>;
  approveCampaign: (id: string) => Promise<Campaign>;
  scheduleCampaign: (
    id: string,
    values: { scheduledAt: string | null; language: "en" | "lo" },
  ) => Promise<Campaign>;
  sendCampaign: (id: string) => Promise<Campaign>;
  duplicateCampaign: (id: string) => Promise<Campaign>;

  /* Templates */
  saveTemplate: (values: TemplateFormValues, id?: string) => Promise<MessageTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<MessageTemplate>;
  submitTemplate: (id: string) => Promise<MessageTemplate>;
  refreshTemplateStatus: (id: string) => Promise<MessageTemplate>;

  /* Team */
  inviteTeamMember: (values: TeamMemberFormValues) => Promise<TeamMember>;
  updateTeamMemberRole: (id: string, role: TeamRole) => Promise<TeamMember>;
  updateTeamMemberStatus: (id: string, status: TeamMemberStatus) => Promise<TeamMember>;

  /* Settings */
  updateSettingSection: (key: SettingKey, value: Record<string, unknown>) => Promise<void>;
}

const AppStoreContext = React.createContext<AppStoreValue | null>(null);

/** Read an error into a short, user-facing message. */
function messageOf(cause: unknown): string {
  if (cause instanceof ApiError) return cause.message;
  return "Something went wrong talking to the server.";
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [outletStats, setOutletStats] = React.useState<OutletStats | null>(null);
  const [segments, setSegments] = React.useState<Segment[]>(NO_SEGMENTS);
  const [segmentsTotal, setSegmentsTotal] = React.useState(0);
  const [templates, setTemplates] = React.useState<MessageTemplate[]>(NO_TEMPLATES);
  const [templatesTotal, setTemplatesTotal] = React.useState(0);
  const [team, setTeam] = React.useState<TeamMember[]>(NO_TEAM);
  const [activity, setActivity] = React.useState<ActivityEvent[]>(NO_ACTIVITY);
  const [settings, setSettings] = React.useState<SettingsMap | null>(null);
  const [health, setHealth] = React.useState<ProviderHealth | null>(null);
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshOutlets = React.useCallback(async () => {
    setOutletStats(await outletApi.fetchOutletStats());
  }, []);

  const refreshSegments = React.useCallback(async () => {
    const result = await segmentApi.listSegments({ limit: 100 });
    setSegments(result.items);
    setSegmentsTotal(result.total);
  }, []);

  const refreshTemplates = React.useCallback(async () => {
    const result = await templateApi.listTemplates({ limit: 100 });
    setTemplates(result.items);
    setTemplatesTotal(result.total);
  }, []);

  /**
   * Team and settings are Administrator-only. A non-administrator gets 403,
   * which is an expected outcome rather than a failure: the related screens are
   * hidden for them, so the store simply leaves those collections empty.
   */
  const refreshTeam = React.useCallback(async () => {
    try {
      const result = await userApi.listTeamMembers({ limit: 100 });
      setTeam(result.items);
    } catch (cause) {
      if (cause instanceof ApiError && cause.isPermissionError) {
        setTeam(NO_TEAM);
        return;
      }
      throw cause;
    }
  }, []);

  const refreshActivity = React.useCallback(async () => {
    const result = await auditApi.listActivity({ limit: 40 });
    setActivity(result.items);
  }, []);

  const refreshSettings = React.useCallback(async () => {
    try {
      setSettings(await settingsApi.getSettings());
    } catch (cause) {
      if (cause instanceof ApiError && cause.isPermissionError) {
        setSettings(null);
        return;
      }
      throw cause;
    }
  }, []);

  const refreshHealth = React.useCallback(async () => {
    try {
      setHealth(await settingsApi.whatsappHealth());
    } catch (cause) {
      if (cause instanceof ApiError && cause.isPermissionError) {
        setHealth(null);
        return;
      }
      throw cause;
    }
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshOutlets(),
        refreshSegments(),
        refreshTemplates(),
        refreshTeam(),
        refreshActivity(),
        refreshSettings(),
        refreshHealth(),
      ]);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [
    refreshOutlets,
    refreshSegments,
    refreshTemplates,
    refreshTeam,
    refreshActivity,
    refreshSettings,
    refreshHealth,
  ]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /* ------------------------------- Outlets ------------------------------- */

  const createOutlet = React.useCallback<AppStoreValue["createOutlet"]>(
    async (values) => {
      const outlet = await outletApi.createOutlet(values);
      await Promise.all([refreshOutlets(), refreshActivity()]);
      return outlet;
    },
    [refreshOutlets, refreshActivity],
  );

  const updateOutlet = React.useCallback<AppStoreValue["updateOutlet"]>(
    async (id, values) => {
      const outlet = await outletApi.updateOutlet(id, values);
      await Promise.all([refreshOutlets(), refreshActivity()]);
      return outlet;
    },
    [refreshOutlets, refreshActivity],
  );

  const deleteOutlets = React.useCallback<AppStoreValue["deleteOutlets"]>(
    async (ids) => {
      await Promise.all(ids.map((id) => outletApi.deleteOutlet(id)));
      await Promise.all([refreshOutlets(), refreshActivity()]);
    },
    [refreshOutlets, refreshActivity],
  );

  const bulkCreateOutlets = React.useCallback<AppStoreValue["bulkCreateOutlets"]>(
    async (values) => {
      const result = await outletApi.bulkCreateOutlets(values);
      await Promise.all([refreshOutlets(), refreshActivity()]);
      return result.created;
    },
    [refreshOutlets, refreshActivity],
  );

  /* ------------------------------- Segments ------------------------------ */

  const saveSegment = React.useCallback<AppStoreValue["saveSegment"]>(
    async (values, id) => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        filters: values.filters,
      };
      const saved = id
        ? await segmentApi.updateSegment(id, payload)
        : await segmentApi.createSegment(payload);
      await Promise.all([refreshSegments(), refreshActivity()]);
      return saved;
    },
    [refreshSegments, refreshActivity],
  );

  const deleteSegment = React.useCallback<AppStoreValue["deleteSegment"]>(
    async (id) => {
      await segmentApi.deleteSegment(id);
      await Promise.all([refreshSegments(), refreshActivity()]);
    },
    [refreshSegments, refreshActivity],
  );

  const duplicateSegment = React.useCallback<AppStoreValue["duplicateSegment"]>(
    async (id) => {
      const source = await segmentApi.getSegment(id);
      const copy = await segmentApi.createSegment({
        name: `${source.name} (copy)`,
        description: source.description,
        filters: source.filters,
      });
      await Promise.all([refreshSegments(), refreshActivity()]);
      return copy;
    },
    [refreshSegments, refreshActivity],
  );

  /* ------------------------------ Campaigns ------------------------------ */

  const createCampaign = React.useCallback<AppStoreValue["createCampaign"]>(
    async (values) => {
      const campaign = await campaignApi.createCampaign(values);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const updateCampaign = React.useCallback<AppStoreValue["updateCampaign"]>(
    async (id, values) => {
      const campaign = await campaignApi.updateCampaign(id, values);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const cancelCampaign = React.useCallback<AppStoreValue["cancelCampaign"]>(
    async (id, reason) => {
      const campaign = await campaignApi.cancelCampaign(id, reason);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const submitCampaign = React.useCallback<AppStoreValue["submitCampaign"]>(
    async (id) => {
      const campaign = await campaignApi.submitCampaign(id);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const approveCampaign = React.useCallback<AppStoreValue["approveCampaign"]>(
    async (id) => {
      const campaign = await campaignApi.approveCampaign(id);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const scheduleCampaign = React.useCallback<AppStoreValue["scheduleCampaign"]>(
    async (id, values) => {
      const campaign = await campaignApi.scheduleCampaign(id, values);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const sendCampaign = React.useCallback<AppStoreValue["sendCampaign"]>(
    async (id) => {
      const campaign = await campaignApi.sendCampaign(id);
      await refreshActivity();
      return campaign;
    },
    [refreshActivity],
  );

  const duplicateCampaign = React.useCallback<AppStoreValue["duplicateCampaign"]>(
    async (id) => {
      const copy = await campaignApi.duplicateCampaign(id);
      await refreshActivity();
      return copy;
    },
    [refreshActivity],
  );

  /* ------------------------------ Templates ------------------------------ */

  const saveTemplate = React.useCallback<AppStoreValue["saveTemplate"]>(
    async (values, id) => {
      const saved = id
        ? await templateApi.updateTemplate(id, values)
        : await templateApi.createTemplate(values);
      await Promise.all([refreshTemplates(), refreshActivity()]);
      return saved;
    },
    [refreshTemplates, refreshActivity],
  );

  const deleteTemplate = React.useCallback<AppStoreValue["deleteTemplate"]>(
    async (id) => {
      await templateApi.deleteTemplate(id);
      await Promise.all([refreshTemplates(), refreshActivity()]);
    },
    [refreshTemplates, refreshActivity],
  );

  const duplicateTemplate = React.useCallback<AppStoreValue["duplicateTemplate"]>(
    async (id) => {
      const source = await templateApi.getTemplate(id);
      const copy = await templateApi.createTemplate({
        name: `${source.name} (copy)`,
        category: source.category,
        language: source.language,
        body: source.body,
        notes: source.notes,
      });
      await Promise.all([refreshTemplates(), refreshActivity()]);
      return copy;
    },
    [refreshTemplates, refreshActivity],
  );

  const submitTemplate = React.useCallback<AppStoreValue["submitTemplate"]>(
    async (id) => {
      const template = await templateApi.submitTemplateForApproval(id);
      await Promise.all([refreshTemplates(), refreshActivity()]);
      return template;
    },
    [refreshTemplates, refreshActivity],
  );

  const refreshTemplateStatus = React.useCallback<AppStoreValue["refreshTemplateStatus"]>(
    async (id) => {
      const template = await templateApi.refreshTemplateStatus(id);
      await Promise.all([refreshTemplates(), refreshActivity()]);
      return template;
    },
    [refreshTemplates, refreshActivity],
  );

  /* --------------------------------- Team -------------------------------- */

  const inviteTeamMember = React.useCallback<AppStoreValue["inviteTeamMember"]>(
    async (values) => {
      const member = await userApi.inviteTeamMember(values);
      await Promise.all([refreshTeam(), refreshActivity()]);
      return member;
    },
    [refreshTeam, refreshActivity],
  );

  const updateTeamMemberRole = React.useCallback<AppStoreValue["updateTeamMemberRole"]>(
    async (id, role) => {
      const member = await userApi.updateTeamMember(id, { role });
      await Promise.all([refreshTeam(), refreshActivity()]);
      return member;
    },
    [refreshTeam, refreshActivity],
  );

  const updateTeamMemberStatus = React.useCallback<AppStoreValue["updateTeamMemberStatus"]>(
    async (id, status) => {
      const member = await userApi.updateTeamMemberStatus(id, status);
      await Promise.all([refreshTeam(), refreshActivity()]);
      return member;
    },
    [refreshTeam, refreshActivity],
  );

  /* ------------------------------- Settings ------------------------------ */

  const updateSettingSection = React.useCallback<AppStoreValue["updateSettingSection"]>(
    async (key, value) => {
      await settingsApi.updateSetting(key, value);
      await Promise.all([refreshSettings(), refreshActivity()]);
    },
    [refreshSettings, refreshActivity],
  );

  const value = React.useMemo<AppStoreValue>(
    () => ({
      ready,
      loading,
      error,
      outletStats,
      segments,
      segmentsTotal,
      templates,
      templatesTotal,
      team,
      activity,
      settings,
      health,
      reload: load,
      createOutlet,
      updateOutlet,
      deleteOutlets,
      bulkCreateOutlets,
      saveSegment,
      deleteSegment,
      duplicateSegment,
      createCampaign,
      updateCampaign,
      cancelCampaign,
      submitCampaign,
      approveCampaign,
      scheduleCampaign,
      sendCampaign,
      duplicateCampaign,
      saveTemplate,
      deleteTemplate,
      duplicateTemplate,
      submitTemplate,
      refreshTemplateStatus,
      inviteTeamMember,
      updateTeamMemberRole,
      updateTeamMemberStatus,
      updateSettingSection,
    }),
    [
      ready,
      loading,
      error,
      outletStats,
      segments,
      segmentsTotal,
      templates,
      templatesTotal,
      team,
      activity,
      settings,
      health,
      load,
      createOutlet,
      updateOutlet,
      deleteOutlets,
      bulkCreateOutlets,
      saveSegment,
      deleteSegment,
      duplicateSegment,
      createCampaign,
      updateCampaign,
      cancelCampaign,
      submitCampaign,
      approveCampaign,
      scheduleCampaign,
      sendCampaign,
      duplicateCampaign,
      saveTemplate,
      deleteTemplate,
      duplicateTemplate,
      submitTemplate,
      refreshTemplateStatus,
      inviteTeamMember,
      updateTeamMemberRole,
      updateTeamMemberStatus,
      updateSettingSection,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const context = React.useContext(AppStoreContext);
  if (!context) throw new Error("useAppStore must be used inside <AppStoreProvider>.");
  return context;
}
