"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormErrorBanner } from "@/components/auth/form-error-banner";
import { SplitAuthShell } from "@/components/auth/split-auth-shell";
import { authClient } from "@/lib/better-auth-client";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";

const ADMIN_ROLES = ["super_admin", "manager", "staff"];

function mapAuthError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid email or password")) return fallback;
  return normalized.includes("invalid") || normalized.includes("credential")
    ? fallback
    : message.length <= 80
      ? message
      : fallback;
}

export default function AdminLoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const { user } = useGetSessionUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in with an admin account? Skip the form entirely.
  // Non-admin sessions stay here so the error path can explain itself.
  useEffect(() => {
    if (user && ADMIN_ROLES.includes(user.role)) {
      router.replace("/admin");
    }
  }, [user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setFormError(mapAuthError(result.error.message, t.admin.login.invalidCredentials));
        return;
      }

      router.push("/admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SplitAuthShell
      tone="dark"
      title={t.admin.login.title}
      subtitle={t.admin.login.subtitle}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-admin-sidebar text-admin-text">
        <Lock aria-hidden className="size-5" />
      </span>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormErrorBanner message={formError} />

        <Input
          label={t.account.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="admin@deneiz.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <PasswordInput
          label={t.account.password}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" size="lg" isLoading={submitting}>
          {t.account.signIn}
        </Button>
      </form>
    </SplitAuthShell>
  );
}
