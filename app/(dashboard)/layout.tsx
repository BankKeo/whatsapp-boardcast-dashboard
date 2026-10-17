"use client";

/**
 * Authenticated area.
 *
 * Everything under this layout requires a session: `AuthProvider` has already
 * tried to restore one from the refresh cookie, and an anonymous visitor is sent
 * to `/login`. The API-backed store only mounts once a session exists, so no
 * request is ever made without an access token.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { useSession } from "@/lib/auth/session";
import { AppStoreProvider } from "@/lib/store/app-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();

  React.useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [router, status]);

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <LoadingState variant="page" label="Checking your session…" />
      </div>
    );
  }

  return (
    <AppStoreProvider>
      <AppShell>{children}</AppShell>
    </AppStoreProvider>
  );
}
