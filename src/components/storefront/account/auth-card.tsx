"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { pushToast } from "@/components/ui/toast";
import { FormErrorBanner } from "@/components/auth/form-error-banner";
import { SplitAuthShell } from "@/components/auth/split-auth-shell";
import { authClient } from "@/lib/better-auth-client";

type AuthMode = "signIn" | "signUp";

/** Maps Better Auth's English error strings onto bilingual dictionary copy. */
function mapAuthError(message: string | undefined, t: ReturnType<typeof useLang>["t"]): string {
  if (!message) return t.errors.generic;
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid email or password")) return t.errors.invalidCredentials;
  if (normalized.includes("already exist") || normalized.includes("unable to create user")) {
    return t.errors.emailTaken;
  }
  return message.length <= 80 ? message : t.errors.generic;
}

interface AuthCardProps {
  onSuccess: () => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const { t } = useLang();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function switchMode(next: AuthMode) {
    setMode(next);
    setFormError(null);
    setFieldErrors({});
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (mode === "signUp" && form.name.trim().length < 2) {
      errors.name = t.errors.tooShort(2);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t.errors.invalidEmail;
    }
    if (form.password.length < 8) {
      errors.password = t.errors.shortPassword;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === "signIn") {
        const result = await authClient.signIn.email({
          email: form.email.trim(),
          password: form.password,
        });
        if (result.error) {
          setFormError(mapAuthError(result.error.message, t));
          return;
        }
        pushToast(t.account.welcome(result.data!.user.name), "success");
      } else {
        const result = await authClient.signUp.email({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        if (result.error) {
          setFormError(mapAuthError(result.error.message, t));
          return;
        }
        // Email verification is intentionally off — the session is live immediately
        pushToast(t.account.welcome(result.data!.user.name), "success");
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { value: AuthMode; label: string }[] = [
    { value: "signIn", label: t.account.signIn },
    { value: "signUp", label: t.account.signUp },
  ];

  return (
    <SplitAuthShell
      title={mode === "signIn" ? t.account.signIn : t.account.signUp}
      subtitle={mode === "signIn" ? t.account.signInSubtitle : t.account.signUpSubtitle}
      footer={
        <span className="flex items-center gap-2 text-xs">
          <ShieldCheck aria-hidden className="size-4 shrink-0 text-success" />
          {t.account.noVerificationNeeded}
        </span>
      }
    >
      {/* Segmented mode control */}
      <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => switchMode(tab.value)}
            className={`relative min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${
              mode === tab.value ? "text-text-inverse" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {mode === tab.value ? (
              <motion.span
                layoutId="auth-tab-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormErrorBanner message={formError} />

        {mode === "signUp" ? (
          <Input
            label={t.account.name}
            name="name"
            autoComplete="name"
            placeholder={t.account.namePlaceholder}
            value={form.name}
            onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            error={fieldErrors.name}
            required
            minLength={2}
          />
        ) : null}

        <Input
          label={t.account.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
          error={fieldErrors.email}
          required
        />

        <PasswordInput
          label={t.account.password}
          name="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          hint={mode === "signUp" ? t.errors.shortPassword : undefined}
          value={form.password}
          onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
          error={fieldErrors.password}
          required
          minLength={8}
        />

        <Button type="submit" size="lg" isLoading={submitting}>
          {mode === "signIn" ? t.account.signIn : t.account.signUp}
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        {mode === "signIn" ? t.account.createAccountCta : t.account.haveAccountCta}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}
          className="font-medium text-accent hover:underline"
        >
          {mode === "signIn" ? t.account.signUp : t.account.signIn} →
        </button>
      </p>
    </SplitAuthShell>
  );
}
