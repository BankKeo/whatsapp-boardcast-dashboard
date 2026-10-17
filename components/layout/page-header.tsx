"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeaderAction } from "@/components/layout/header-action";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Rendered inline on the page (filters, secondary actions). */
  actions?: React.ReactNode;
  /** Rendered as the contextual primary action in the app header. */
  headerAction?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  headerAction,
  breadcrumbs,
  meta,
  className,
}: PageHeaderProps) {
  useHeaderAction(headerAction ?? null, [headerAction]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? (
                <ChevronRight className="size-3" aria-hidden="true" />
              ) : null}
            </React.Fragment>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          {description ? (
            <p className="mt-0.5 max-w-3xl text-[13px] leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
  );
}
