"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex select-none items-center gap-1.5 text-[13px] font-medium leading-5 text-foreground",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
