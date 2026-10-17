import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/campaign";
import type { DataQuality, OutletCategory } from "@/types/outlet";
import type { TemplateStatus } from "@/types/template";
import type { TeamMemberStatus } from "@/types/team";

type Variant = NonNullable<BadgeProps["variant"]>;

const CAMPAIGN_STATUS_VARIANT: Record<CampaignStatus, Variant> = {
  Draft: "secondary",
  "Pending Approval": "warning",
  Scheduled: "info",
  Sending: "info",
  Completed: "success",
  Cancelled: "outline",
  Failed: "destructive",
};

export function CampaignStatusBadge({
  status,
  className,
}: {
  status: CampaignStatus;
  className?: string;
}) {
  return (
    <Badge variant={CAMPAIGN_STATUS_VARIANT[status]} className={className}>
      {status}
    </Badge>
  );
}

const TEMPLATE_STATUS_VARIANT: Record<TemplateStatus, Variant> = {
  Approved: "success",
  "Pending Approval": "warning",
  Rejected: "destructive",
  Draft: "secondary",
};

export function TemplateStatusBadge({
  status,
  className,
}: {
  status: TemplateStatus;
  className?: string;
}) {
  return (
    <Badge variant={TEMPLATE_STATUS_VARIANT[status]} className={className}>
      {status}
    </Badge>
  );
}

export function EligibilityBadge({
  status,
  className,
}: {
  status: "Eligible" | "Not verified" | "Ineligible";
  className?: string;
}) {
  const variant: Variant =
    status === "Eligible" ? "success" : status === "Not verified" ? "secondary" : "destructive";
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}

const QUALITY_VARIANT: Record<DataQuality, Variant> = {
  Complete: "success",
  "Needs review": "warning",
  Incomplete: "destructive",
};

export function DataQualityBadge({
  quality,
  className,
}: {
  quality: DataQuality;
  className?: string;
}) {
  return (
    <Badge variant={QUALITY_VARIANT[quality]} className={className}>
      {quality}
    </Badge>
  );
}

const CATEGORY_VARIANT: Record<OutletCategory, Variant> = {
  "On-Trade": "default",
  "Off-Trade": "info",
  "Modern Trade": "secondary",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: OutletCategory;
  className?: string;
}) {
  return (
    <Badge variant={CATEGORY_VARIANT[category]} className={cn("font-medium", className)}>
      {category}
    </Badge>
  );
}

const TEAM_STATUS_VARIANT: Record<TeamMemberStatus, Variant> = {
  Active: "success",
  Invited: "warning",
  Deactivated: "outline",
};

export function TeamStatusBadge({
  status,
  className,
}: {
  status: TeamMemberStatus;
  className?: string;
}) {
  return (
    <Badge variant={TEAM_STATUS_VARIANT[status]} className={className}>
      {status}
    </Badge>
  );
}

export function ConsentBadge({
  consented,
  className,
}: {
  consented: boolean;
  className?: string;
}) {
  return (
    <Badge variant={consented ? "success" : "outline"} className={className}>
      {consented ? "Consented" : "No consent"}
    </Badge>
  );
}

/** Small status pill for integration / connection states. */
export function ConnectionBadge({
  status,
  className,
}: {
  status: "demo" | "connected" | "disconnected";
  className?: string;
}) {
  const label = status === "demo" ? "Demo mode" : status === "connected" ? "Connected" : "Not connected";
  const variant: Variant = status === "connected" ? "success" : status === "demo" ? "warning" : "outline";
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
