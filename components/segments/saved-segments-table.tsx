"use client";

import * as React from "react";
import Link from "next/link";
import {
  Copy,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { formatNumber, formatRelative } from "@/lib/format";
import { toast } from "sonner";
import { describeFilters } from "@/lib/services/outlet-service";
import { useAppStore } from "@/lib/store/app-store";
import { ApiError } from "@/lib/api/client";
import type { Segment } from "@/types/segment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";

export interface SavedSegmentsTableProps {
  onEdit: (segment: Segment) => void;
  onDelete: (segment: Segment) => void;
  isLoading?: boolean;
}

export function SavedSegmentsTable({
  onEdit,
  onDelete,
  isLoading = false,
}: SavedSegmentsTableProps) {
  const store = useAppStore();
  const [search, setSearch] = React.useState("");

  const segments = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return store.segments;
    return store.segments.filter(
      (segment) =>
        segment.name.toLowerCase().includes(needle) ||
        segment.description.toLowerCase().includes(needle),
    );
  }, [store.segments, search]);

  const columns = React.useMemo<DataTableColumn<Segment>[]>(
    () => [
      {
        key: "name",
        header: "Segment",
        render: (segment) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{segment.name}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {segment.description || "No description"}
            </span>
          </div>
        ),
      },
      {
        key: "rules",
        header: "Rules",
        hideBelow: "md",
        render: (segment) => (
          <div className="flex max-w-[22rem] flex-wrap gap-1">
            {describeFilters(segment.filters).map((rule) => (
              <Badge key={rule} variant="outline">
                {rule}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: "count",
        header: "Matching outlets",
        align: "right",
        render: (segment) => (
          <span className="font-medium tabular-nums">
            {segment.matchCount === null ? "—" : formatNumber(segment.matchCount)}
          </span>
        ),
      },
      {
        key: "createdBy",
        header: "Created by",
        hideBelow: "lg",
        render: (segment) => (
          <span className="whitespace-nowrap text-muted-foreground">{segment.createdBy}</span>
        ),
      },
      {
        key: "updatedAt",
        header: "Updated",
        hideBelow: "xl",
        render: (segment) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatRelative(segment.updatedAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        render: (segment) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${segment.name}`}>
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/new#segment=${segment.id}`}>
                  <Megaphone aria-hidden="true" />
                  Use in campaign
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(segment)}>
                <Pencil aria-hidden="true" />
                Edit rules
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void store
                    .duplicateSegment(segment.id)
                    .then((copy) =>
                      toast.success("Segment duplicated", {
                        description: `“${copy.name}” was created.`,
                      }),
                    )
                    .catch((cause: unknown) =>
                      toast.error(
                        cause instanceof ApiError
                          ? cause.message
                          : "The segment could not be duplicated.",
                      ),
                    );
                }}
              >
                <Copy aria-hidden="true" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(segment)}>
                <Trash2 aria-hidden="true" />
                Delete segment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDelete, onEdit, store],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search segments by name or description"
          aria-label="Search segments"
          className="h-9 w-full max-w-sm rounded-md border border-input bg-card px-2.5 text-[13px] shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <Badge variant="outline">
          {formatNumber(segments.length)} of {formatNumber(store.segmentsTotal)} segments
        </Badge>
      </div>

      <DataTable
        columns={columns}
        rows={segments}
        getRowId={(segment) => segment.id}
        isLoading={isLoading}
        empty={{
          icon: <Users aria-hidden="true" />,
          title: "No saved segments yet",
          description:
            "Build an audience in the builder tab and save it to reuse the same rules in future campaigns.",
        }}
        caption="Saved audience segments"
      />
    </div>
  );
}
