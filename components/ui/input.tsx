import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-2.5 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-muted-foreground/80 file:mr-2 file:h-7 file:rounded file:border-0 file:bg-secondary file:px-2 file:text-xs file:font-medium",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
