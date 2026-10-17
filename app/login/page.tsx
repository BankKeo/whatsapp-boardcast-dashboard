import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Partner Club WhatsApp Marketing System dashboard.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Lao Brewery Co., Ltd.
          </span>
          <h1 className="text-xl font-semibold text-foreground">Partner Club</h1>
          <p className="text-[12px] leading-5 text-muted-foreground">
            Sign in with your work account to manage outlets, audiences and WhatsApp campaigns.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <Suspense fallback={<LoadingState variant="cards" label="Loading sign-in…" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-[11px] leading-4 text-muted-foreground">
          Access is limited to the Partner Club team. Campaigns are sent through the configured
          WhatsApp provider, which reports whether it is connected or simulated.
        </p>
      </div>
    </main>
  );
}
