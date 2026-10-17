"use client";

import * as React from "react";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  buildDuplicatePhoneIndex,
  getDataQuality,
  isDuplicatePhone,
  isEligible,
  type OutletSort,
  type OutletSortKey,
} from "@/lib/services/outlet-service";
import { formatPhone, getPhoneStatus } from "@/lib/phone";
import type { Outlet } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import {
  CategoryBadge,
  DataQualityBadge,
  EligibilityBadge,
} from "@/components/shared/status-badge";

export interface OutletTableProps {
  outlets: Outlet[];
  /** Full dataset, used to detect duplicate phone numbers across records. */
  allOutlets: Outlet[];
  sort: OutletSort;
  onSortChange: (key: OutletSortKey) => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onView: (outlet: Outlet) => void;
  onEdit: (outlet: Outlet) => void;
  onDelete: (outlet: Outlet) => void;
  isLoading?: boolean;
}

export function OutletTable({
  outlets,
  allOutlets,
  sort,
  onSortChange,
  selectedIds,
  onSelectedIdsChange,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: OutletTableProps) {
  const duplicates = React.useMemo(() => buildDuplicatePhoneIndex(allOutlets), [allOutlets]);

  const columns = React.useMemo<DataTableColumn<Outlet>[]>(
    () => [
      {
        key: "name",
        header: "Outlet name",
        sortKey: "name",
        render: (outlet) => (
          <button
            type="button"
            onClick={() => onView(outlet)}
            className="max-w-[16rem] truncate text-left font-medium hover:text-primary hover:underline"
          >
            {outlet.name}
          </button>
        ),
      },
      {
        key: "ownerName",
        header: "Owner",
        sortKey: "ownerName",
        hideBelow: "md",
        render: (outlet) => (
          <span className="block max-w-[11rem] truncate text-muted-foreground">
            {outlet.ownerName}
          </span>
        ),
      },
      {
        key: "phone",
        header: "Phone number",
        sortKey: "phone",
        render: (outlet) => {
          const status = getPhoneStatus(outlet.phone);
          const duplicate = isDuplicatePhone(outlet, duplicates);
          return (
            <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
              {status === "Missing" ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                formatPhone(outlet.phone)
              )}
              {status !== "Valid" || duplicate ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Badge variant={status === "Valid" ? "warning" : "destructive"}>
                        {status !== "Valid" ? status : "Duplicate"}
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {status !== "Valid"
                      ? "This contact cannot receive WhatsApp messages until the number is corrected."
                      : "Another outlet record uses the same phone number."}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </span>
          );
        },
      },
      {
        key: "province",
        header: "Province",
        sortKey: "province",
        hideBelow: "sm",
        render: (outlet) => <span className="whitespace-nowrap">{outlet.province}</span>,
      },
      {
        key: "district",
        header: "District",
        sortKey: "district",
        hideBelow: "lg",
        render: (outlet) => (
          <span className="whitespace-nowrap text-muted-foreground">{outlet.district}</span>
        ),
      },
      {
        key: "category",
        header: "Category",
        sortKey: "category",
        hideBelow: "lg",
        render: (outlet) => <CategoryBadge category={outlet.category} />,
      },
      {
        key: "eligibility",
        header: "WhatsApp",
        sortKey: "eligibility",
        render: (outlet) => (
          <div className="flex flex-col items-start gap-1">
            <EligibilityBadge
              status={
                isEligible(outlet)
                  ? "Eligible"
                  : getPhoneStatus(outlet.phone) !== "Valid"
                    ? "Ineligible"
                    : "Not verified"
              }
            />
            <DataQualityBadge quality={getDataQuality(outlet, duplicates)} />
          </div>
        ),
      },
      {
        key: "lastUpdated",
        header: "Last updated",
        sortKey: "lastUpdated",
        hideBelow: "xl",
        render: (outlet) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatRelative(outlet.lastUpdated)}
          </span>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        render: (outlet) => (
          <div className={cn("flex items-center justify-end")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${outlet.name}`}
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onView(outlet)}>
                  <Eye aria-hidden="true" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit(outlet)}>
                  <Pencil aria-hidden="true" />
                  Edit outlet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void navigator.clipboard?.writeText(outlet.phone).catch(() => undefined);
                  }}
                >
                  <Copy aria-hidden="true" />
                  Copy phone number
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(outlet)}>
                  <Trash2 aria-hidden="true" />
                  Delete outlet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [duplicates, onDelete, onEdit, onView],
  );

  return (
    <DataTable
      columns={columns}
      rows={outlets}
      getRowId={(outlet) => outlet.id}
      isLoading={isLoading}
      sort={{ key: sort.key, direction: sort.direction }}
      onSortChange={(key) => onSortChange(key as OutletSortKey)}
      selectable
      selectedIds={selectedIds}
      onSelectedIdsChange={onSelectedIdsChange}
      caption="Outlet database records"
      empty={{
        title: "No outlets match these filters",
        description:
          "Adjust the search, province or category filters — or clear all filters to see the full database.",
      }}
    />
  );
}
