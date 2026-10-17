"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, BarChart3, Megaphone } from "lucide-react";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/types/campaign";

export function RecentCampaignsTable({
  campaigns,
  isLoading = false,
}: {
  campaigns: Campaign[];
  isLoading?: boolean;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <CardTitle>Recent campaigns</CardTitle>
          <CardDescription>Latest simulated sends, newest first.</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="xs">
            <Link href="/campaigns">All campaigns</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Campaign</TableHead>
                <TableHead className="hidden md:table-cell">Audience</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
                <TableHead className="text-right">Delivery rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-4">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="pr-4">
                      <Skeleton className="ml-auto h-7 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={<Megaphone aria-hidden="true" />}
                      title="No campaigns sent yet"
                      description="Create a campaign to see delivery metrics appear here."
                      action={
                        <Button asChild size="sm">
                          <Link href="/campaigns/new">Create campaign</Link>
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => {
                  const metrics = campaign.metrics;
                  const rate =
                    metrics && metrics.attempted > 0 ? metrics.delivered / metrics.attempted : null;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="max-w-[18rem] pl-4">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="line-clamp-1 font-medium hover:text-primary hover:underline"
                        >
                          {campaign.name}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {campaign.objective}
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-[14rem] md:table-cell">
                        <span className="line-clamp-1 text-muted-foreground">
                          {campaign.segmentName ?? "Ad-hoc audience"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(campaign.recipients)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground sm:table-cell">
                        {formatDate(campaign.sentAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(rate)}
                      </TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon-sm" aria-label="View campaign">
                            <Link href={`/campaigns/${campaign.id}`}>
                              <Eye aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon-sm" aria-label="View report">
                            <Link href={`/reports#campaign=${campaign.id}`}>
                              <BarChart3 aria-hidden="true" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
