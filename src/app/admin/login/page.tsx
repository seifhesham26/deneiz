"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/ui/toast";
import { authClient } from "@/lib/better-auth-client";

export default function AdminLoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        pushToast(t.admin.login.invalidCredentials, "error");
        return;
      }

      // Role verification happens again server-side on every admin query
      router.push("/admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-6"
      >
        <h1 className="text-xl font-semibold">{t.admin.login.title}</h1>

        <Input
          label={t.account.email}
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          label={t.account.password}
          type="password"
          dir="ltr"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" isLoading={submitting}>
          {t.account.signIn}
        </Button>
      </form>
    </div>
  );
}
