"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signInInputSchema,
  signUpInputSchema,
  type AuthFormInput,
} from "@/server/auth/auth.validators";
import { translateFieldMessage } from "@/lib/translate-error";
import { ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
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
  // Never fall through to Better Auth's raw English string
  return t.errors.generic;
}

interface AuthCardProps {
  onSuccess: () => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const { t } = useLang();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [formError, setFormError] = useState<string | null>(null);
  // Sign-up needs the name field; sign-in does not — the schema follows the mode
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormInput>({
    resolver: zodResolver(mode === "signUp" ? signUpInputSchema : signInInputSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function switchMode(next: AuthMode) {
    setMode(next);
    setFormError(null);
    reset();
  }

  async function onSubmit(values: AuthFormInput) {
    setFormError(null);

    {
      if (mode === "signIn") {
        const result = await authClient.signIn.email({
          email: values.email.trim(),
          password: values.password,
        });
        if (result.error) {
          setFormError(mapAuthError(result.error.message, t));
          return;
        }
        pushToast(t.account.welcome(result.data?.user.name ?? ""), "success");
      } else {
        const result = await authClient.signUp.email({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
        });
        if (result.error) {
          setFormError(mapAuthError(result.error.message, t));
          return;
        }
        // Email verification is intentionally off — the session is live immediately
        pushToast(t.account.welcome(result.data?.user.name ?? ""), "success");
      }
      onSuccess();
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
            id={`auth-tab-${tab.value}`}
            aria-selected={mode === tab.value}
            aria-controls="auth-tabpanel"
            tabIndex={mode === tab.value ? 0 : -1}
            onClick={() => switchMode(tab.value)}
            className={`relative min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${
              mode === tab.value ? "text-text-inverse" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {mode === tab.value ? (
              <motion.span
                layoutId="auth-tab-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={
                  reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                }
              />
            ) : null}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-4"
        noValidate
        role="tabpanel"
        id="auth-tabpanel"
        aria-labelledby={`auth-tab-${mode}`}
      >
        <FormErrorBanner message={formError} />

        {mode === "signUp" ? (
          <Input
            label={t.account.name}
            autoComplete="name"
            placeholder={t.account.namePlaceholder}
            error={translateFieldMessage(errors.name?.message, t)}
            {...register("name")}
            required
            minLength={2}
          />
        ) : null}

        <Input
          label={t.account.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={translateFieldMessage(errors.email?.message, t)}
          {...register("email")}
          required
        />

        <PasswordInput
          label={t.account.password}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          hint={mode === "signUp" ? t.errors.shortPassword : undefined}
          error={translateFieldMessage(errors.password?.message, t)}
          {...register("password")}
          required
          minLength={8}
        />

        <Button type="submit" size="lg" isLoading={isSubmitting}>
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
