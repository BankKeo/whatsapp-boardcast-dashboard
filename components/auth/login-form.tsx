"use client";

/**
 * Sign-in form.
 *
 * Credentials are exchanged for a short-lived access token plus an HTTP-only
 * refresh cookie. Validation errors from the API are attached to the relevant
 * field; a wrong password is reported on the form itself.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";

export function LoginForm() {
  const router = useRouter();
  const { login, status } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Already signed in (for example a valid refresh cookie): skip the form.
  React.useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 422 && cause.details.length > 0) {
        setFieldErrors(cause.fieldErrors);
        setFormError(cause.message);
      } else if (cause instanceof ApiError) {
        setFormError(cause.message);
      } else {
        setFormError("Sign-in failed. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p id="email-error" role="alert" className="text-[11px] font-medium text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password ? (
          <p id="password-error" role="alert" className="text-[11px] font-medium text-destructive">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || !email || !password} className="w-full">
        {submitting ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
