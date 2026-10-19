"use client";

import * as React from "react";
import { ImageIcon, Info, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/data/constants";
import type { CampaignLanguage } from "@/types/campaign";

export interface WhatsAppPreviewProps {
  message: string;
  language: CampaignLanguage;
  timestamp?: string;
  className?: string;
  /** Shown above the bubble when the template has an image header. */
  mediaLabel?: string | null;
  /** Public image URL rendered as the header; falls back to `mediaLabel`. */
  imageUrl?: string | null;
}

/**
 * Renders a WhatsApp-style message preview. This is a visual simulation only —
 * no message is sent anywhere.
 */
export function WhatsAppPreview({
  message,
  language,
  timestamp = "09:30",
  className,
  mediaLabel,
  imageUrl,
}: WhatsAppPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#ece5dd]",
        className,
      )}
    >
      <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2 text-white">
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold"
        >
          PC
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-medium">{COMPANY.programme} (demo)</p>
          <p className="truncate text-[10px] opacity-80">
            Business account · sample preview, not sent
          </p>
        </div>
        <MessageSquare className="size-4 opacity-80" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2 px-3 py-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URLs need no optimizer allowlist
          <img
            src={imageUrl}
            alt="Promotional image header"
            className="max-h-56 w-full max-w-[85%] self-start rounded-lg object-cover shadow-sm"
          />
        ) : mediaLabel ? (
          <div className="flex items-center gap-2 self-start rounded-md border border-dashed border-[#b9b0a4] bg-white/60 px-3 py-4 text-[11px] text-[#5b564d]">
            <ImageIcon className="size-4" aria-hidden="true" />
            {mediaLabel}
          </div>
        ) : null}

        <div className="max-w-[85%] self-start rounded-lg rounded-tl-none bg-white px-2.5 py-2 shadow-sm">
          <p
            className={cn(
              "whitespace-pre-wrap text-[13px] leading-[1.45] text-[#111b21]",
              language === "lo" && "lao",
            )}
          >
            {message}
          </p>
          <p className="mt-1 text-right text-[10px] text-[#667781]">{timestamp} ✓✓</p>
        </div>

        <p className="self-end text-[10px] text-[#667781]">
          WhatsApp message preview
        </p>
      </div>

      <div className="flex items-start gap-2 border-t border-[#d8d0c6] bg-white/70 px-3 py-2 text-[10px] leading-4 text-[#5b564d]">
        <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        <p>
          Preview only. Variables are filled from a real matching contact; this is not a
          delivered message and the layout may differ on a device.
        </p>
      </div>
    </div>
  );
}
