"use client";

import { FileScan, Mail, Users, Workflow } from "lucide-react";
import { HIRE_COPY } from "@/components/hire-copy";
import { HireForm } from "@/components/hire-form";
import { PageShell } from "@/components/page-shell";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";

const ICONS = { mail: Mail, flow: Workflow, doc: FileScan, crm: Users } as const;
const ACCENTS = ["var(--section-contact)", "var(--section-blog)", "var(--section-projects)", "var(--section-about)"];

/** /contratar (/en/hire): what I can build, the tools I prefer, then the form. */
export function HireView() {
  const { t, locale } = useLocale();
  const settings = useSiteSettings();
  const c = HIRE_COPY[locale];
  return (
    <PageShell title={t.sections.hire}>
      <div className="hire-simple">
        <p className="hire-lead">{c.lead}</p>
        <section aria-labelledby="hire-can">
          <h2 id="hire-can" className="hm-h2">{c.canTitle}</h2>
          <ul className="hire-can">
            {c.can.map((item, i) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.icon} style={{ ["--hm-accent" as string]: ACCENTS[i % ACCENTS.length] }}>
                  <span className="hire-can-icon" aria-hidden><Icon /></span>
                  <span>{item.text}</span>
                </li>
              );
            })}
          </ul>
          <p className="hire-tools">{c.tools}</p>
        </section>
        <section aria-labelledby="hire-form-title">
          <h2 id="hire-form-title" className="hm-h2">{c.formTitle}</h2>
          <HireForm c={c} callUrl={settings.callBookingUrl || undefined} />
        </section>
      </div>
    </PageShell>
  );
}
