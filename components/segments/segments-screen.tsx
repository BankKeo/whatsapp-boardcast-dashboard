"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Segment } from "@/types/segment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SegmentBuilder } from "./segment-builder";
import { SavedSegmentsTable } from "./saved-segments-table";

type SegmentTab = "builder" | "saved";

export function SegmentsScreen() {
  const store = useDemoStore();
  const [tab, setTab] = React.useState<SegmentTab>("builder");
  const [editing, setEditing] = React.useState<Segment | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Segment | null>(null);

  // Deep link support: /segments#segment=seg-001
  React.useEffect(() => {
    if (!store.ready) return;
    const match = window.location.hash.match(/^#segment=(seg-[\w-]+)$/i);
    if (!match) return;
    const segment = store.segments.find((item) => item.id === match[1]);
    if (segment) {
      setEditing(segment);
      setTab("builder");
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [store.ready, store.segments]);

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Audience Segments"
          description="Build reusable audiences from outlet attributes, then target them in campaigns."
        />
        <LoadingState label="Loading audience segments…" variant="page" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audience Segments"
        description="Filter the outlet database by province, category and consent to build audiences you can reuse across campaigns."
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                setEditing(null);
                setTab("builder");
              }}
            >
              <Plus aria-hidden="true" />
              New segment
            </Button>
            <Button asChild size="sm">
              <Link href="/campaigns/new">
                <Megaphone aria-hidden="true" />
                Create campaign
              </Link>
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{formatNumber(store.segments.length)} saved segments</Badge>
            <Badge variant="outline">
              {formatNumber(store.outletStats.eligible)} WhatsApp-eligible contacts
            </Badge>
            <Badge variant="outline">
              {formatNumber(store.outletStats.consented)} with consent on file
            </Badge>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as SegmentTab)}>
        <TabsList>
          <TabsTrigger value="builder">
            <Users aria-hidden="true" />
            Segment builder
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved segments
            <Badge variant="secondary">{store.segments.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <SegmentBuilder
            segment={editing}
            onSaved={(segment) => {
              setEditing(segment);
              setTab("saved");
            }}
            onCancelEdit={() => setEditing(null)}
          />
        </TabsContent>

        <TabsContent value="saved">
          <SavedSegmentsTable
            onEdit={(segment) => {
              setEditing(segment);
              setTab("builder");
            }}
            onDelete={(segment) => setDeleteTarget(segment)}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this segment?"
        description={
          <>
            “{deleteTarget?.name}” will be removed from the saved segments. Campaigns that already
            used it keep their own snapshot of the audience rules, so historical reports are not
            affected.
          </>
        }
        confirmLabel="Delete segment"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          store.deleteSegment(deleteTarget.id);
          if (editing?.id === deleteTarget.id) setEditing(null);
          toast.success("Segment deleted", { description: `“${deleteTarget.name}” was removed.` });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
