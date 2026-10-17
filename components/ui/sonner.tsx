"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-md !border !border-border !bg-card !text-foreground !shadow-lg !text-[13px]",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-secondary !text-secondary-foreground",
        },
      }}
    />
  );
}
