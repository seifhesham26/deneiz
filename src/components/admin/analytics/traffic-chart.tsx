"use client";

import { useLang } from "@/components/providers/lang-provider";

export function TrafficChart() {
  const { t } = useLang();

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface-raised p-5">
      <h2 className="text-sm font-medium">{t.admin.analyticsView.trafficSources}</h2>
      {/* PROTOTYPE: PostHog traffic sources render here once the key is provisioned */}
      <p className="text-xs text-text-muted">{t.admin.analyticsView.trafficPending}</p>
    </section>
  );
}
