"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { CAL_DURATIONS, CalEmbed, calUrl, type CalDuration } from "@/components/cal-embed";
import { CpRow } from "@/components/cp-row";
import {
  InstagramBrandIcon,
  LinkedInIcon,
  TelegramIcon,
  XIcon,
} from "@/components/icons/social";
import { HIRE_COPY } from "@/components/hire-copy";
import { HireForm } from "@/components/hire-form";
import { PageShell } from "@/components/page-shell";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";

const socialIcons: Record<string, { Icon: ComponentType<{ className?: string }>; className?: string; accent: string }> = {
  x: {
    Icon: XIcon,
    className: "text-foreground",
    accent: "var(--foreground)",
  },
  instagram: {
    Icon: InstagramBrandIcon,
    accent: "#e1306c",
  },
  telegram: {
    Icon: TelegramIcon,
    className: "text-[#26A5E4]",
    accent: "#26A5E4",
  },
  linkedin: {
    Icon: LinkedInIcon,
    className: "text-[#0A66C2]",
    accent: "#0A66C2",
  },
};

export default function ContactPage() {
  const { t, locale } = useLocale();
  const settings = useSiteSettings();
  const rows = settings.socials.filter((s) => s.id !== "github");
  const [duration, setDuration] = useState<CalDuration>("30min");
  const [copied, setCopied] = useState(false);
  const direct = calUrl(duration);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(direct);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PageShell title={t.contact.title}>
      <div className="cp-list cp-list-2col">
        {rows.map((s) => {
          const known = socialIcons[s.id];
          const Icon = known?.Icon;
          const iconClass = known?.className;
          const accent = known?.accent ?? "var(--foreground)";
          return (
            <CpRow
              key={s.id}
              href={s.href}
              label={s.label}
              detail={displayHandle(s.href)}
              accent={accent}
              Icon={Icon}
              iconClass={iconClass}
              iconSize="lg"
            />
          );
        })}
      </div>

      <section className="cal-section" aria-labelledby="cal-title" data-testid="contact-cal">
        <h2 id="cal-title" className="cal-title">{t.contact.scheduleTitle}</h2>
        <p className="cal-sub">{t.contact.scheduleSubtitle}</p>
        <div className="cal-tabs" role="tablist" aria-label={t.contact.scheduleTitle}>
          {CAL_DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={duration === d}
              className="cal-tab"
              data-active={duration === d ? "true" : undefined}
              onClick={() => setDuration(d)}
            >
              {d === "30min" ? t.contact.schedule30 : t.contact.schedule15}
            </button>
          ))}
        </div>
        <CalEmbed
          key={duration}
          duration={duration}
          labels={{
            loading: t.contact.scheduleLoading,
            error: t.contact.scheduleError,
            retry: t.contact.scheduleRetry,
          }}
        />
        <p className="cal-hint">
          {t.contact.scheduleHint}{" "}
          <a href={direct} target="_blank" rel="noopener noreferrer" className="cal-direct">
            {direct}
          </a>
          <button type="button" className="cal-copy" onClick={() => void copyLink()}>
            {copied ? t.contact.copied : t.contact.copy}
          </button>
        </p>
      </section>

      <section className="cm-page-choices" aria-labelledby="contact-choose">
        <h2 id="contact-choose" className="cal-title">{t.contact.chooseTitle}</h2>
        <p className="cal-sub">{t.contact.chooseLead}</p>
        <div className="cm-choices">
          <a href="#hire-form-panel" className="hire-btn hire-cta" data-testid="contact-message">
            <span className="hire-btn-label">{t.contact.messageCta}</span>
          </a>
          <a href="#cal-title" className="hire-btn hire-cta" data-testid="contact-call">
            <span className="hire-btn-label">{t.contact.callCta}</span>
          </a>
        </div>
      </section>

      <section className="contact-form-section" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title" className="cal-title">{t.contact.messageTitle}</h2>
        <HireForm c={HIRE_COPY[locale === "en" ? "en" : "es"]} />
      </section>
    </PageShell>
  );
}

function displayHandle(href: string) {
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
