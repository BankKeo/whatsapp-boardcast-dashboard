"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Copy,
  Megaphone,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import {
  buildDuplicatePhoneIndex,
  findPhoneDuplicates,
  getDataQuality,
  isEligible,
} from "@/lib/services/outlet-service";
import { getPhoneStatus } from "@/lib/phone";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Outlet } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CategoryBadge,
  ConsentBadge,
  DataQualityBadge,
  EligibilityBadge,
} from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-[13px]">{children}</dd>
    </div>
  );
}

export interface OutletDetailSheetProps {
  outlet: Outlet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (outlet: Outlet) => void;
}

export function OutletDetailSheet({
  outlet,
  open,
  onOpenChange,
  onEdit,
}: OutletDetailSheetProps) {
  const store = useDemoStore();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const duplicates = React.useMemo(
    () => (outlet ? findPhoneDuplicates(outlet, store.outlets) : []),
    [outlet, store.outlets],
  );

  const campaignsForProvince = React.useMemo(() => {
    if (!outlet) return [];
    return store.campaigns
      .filter((campaign) => campaign.audience.provinces.includes(outlet.province))
      .slice(0, 4);
  }, [outlet, store.campaigns]);

  if (!outlet) return null;

  const phoneStatus = getPhoneStatus(outlet.phone);
  const quality = getDataQuality(outlet, buildDuplicatePhoneIndex(store.outlets));
  const eligible = isEligible(outlet);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="max-w-xl">
          <SheetHeader>
            <SheetTitle className="pr-2">{outlet.name}</SheetTitle>
            <SheetDescription>
              {outlet.category} · {outlet.district}, {outlet.province}
            </SheetDescription>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <EligibilityBadge
                status={eligible ? "Eligible" : phoneStatus !== "Valid" ? "Ineligible" : "Not verified"}
              />
              <ConsentBadge consented={outlet.marketingConsent} />
              <DataQualityBadge quality={quality} />
              {duplicates.length > 0 ? (
                <Badge variant="warning">
                  <Copy aria-hidden="true" />
                  Duplicate phone
                </Badge>
              ) : null}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Outlet ID">
                <span className="tabular-nums text-muted-foreground">{outlet.id}</span>
              </Field>
              <Field label="Owner">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  {outlet.ownerName}
                </span>
              </Field>
              <Field label="Phone number">
                <span className="tabular-nums">
                  {formatPhone(outlet.phone)}
                  {phoneStatus !== "Valid" ? (
                    <Badge variant="warning" className="ml-2">
                      <AlertTriangle aria-hidden="true" />
                      {phoneStatus === "Missing" ? "Missing" : "Invalid"}
                    </Badge>
                  ) : null}
                </span>
              </Field>
              <Field label="Status">{outlet.status}</Field>
              <Field label="Province">{outlet.province}</Field>
              <Field label="District">{outlet.district}</Field>
              <Field label="Village">{outlet.village || "—"}</Field>
              <Field label="Category">
                <CategoryBadge category={outlet.category} />
              </Field>
              <Field label="WhatsApp verified">
                {outlet.whatsappVerified ? "Yes — verified on WhatsApp" : "Not verified"}
              </Field>
              <Field label="Marketing consent">
                {outlet.marketingConsent
                  ? `Recorded ${formatDate(outlet.consentRecordedAt)}`
                  : "Not recorded"}
              </Field>
              <Field label="Record source">{outlet.channel}</Field>
              <Field label="Created">{formatDateTime(outlet.createdAt)}</Field>
              <Field label="Last updated">{formatRelative(outlet.lastUpdated)}</Field>
              <Field label="Duplicates">
                {duplicates.length === 0 ? (
                  "None"
                ) : (
                  <span>
                    {duplicates.length} other record{duplicates.length === 1 ? "" : "s"} share this
                    number
                  </span>
                )}
              </Field>
            </dl>

            {duplicates.length > 0 ? (
              <div className="mt-4 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning">
                <p className="font-medium">Duplicate phone number detected</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {duplicates.slice(0, 4).map((duplicate) => (
                    <li key={duplicate.id}>
                      {duplicate.name} — {duplicate.district}, {duplicate.province}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Separator className="my-4" />

            <section aria-labelledby="outlet-notes-heading" className="flex flex-col gap-1.5">
              <h3 id="outlet-notes-heading" className="text-[12px] font-semibold">
                Notes
              </h3>
              <p className="text-[13px] leading-5 text-muted-foreground">
                {outlet.notes || "No notes recorded for this outlet."}
              </p>
            </section>

            <Separator className="my-4" />

            <section aria-labelledby="outlet-campaigns-heading" className="flex flex-col gap-2">
              <h3 id="outlet-campaigns-heading" className="text-[12px] font-semibold">
                Campaigns targeting {outlet.province}
              </h3>
              {campaignsForProvince.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No demo campaigns target this province yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {campaignsForProvince.map((campaign) => (
                    <li key={campaign.id}>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-[12px] transition-colors hover:bg-accent"
                      >
                        <Megaphone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="line-clamp-1 flex-1">{campaign.name}</span>
                        <Badge variant="outline">{campaign.status}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
            <Button type="button" size="sm" onClick={() => onEdit(outlet)}>
              <Pencil aria-hidden="true" />
              Edit outlet
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this outlet?"
        description={
          <>
            “{outlet.name}” will be removed from the demo outlet database in this browser. Outlets
            with recorded consent are also removed from audiences built from this dataset. You can
            restore the original sample data with “Reset demo data”.
          </>
        }
        confirmLabel="Delete outlet"
        destructive
        onConfirm={() => {
          store.deleteOutlets([outlet.id]);
          onOpenChange(false);
        }}
      />
    </>
  );
}
