"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { CAL_DURATIONS, CalEmbed, calUrl, type CalDuration } from "@/components/cal-embed";
import { CpRow } from "@/components/cp-row";
import {
  InstagramBrandIcon,
  LinkedInIcon,
  TelegramIcon,
  XIcon,
} from "@/components/icons/social";
import { PageShell } from "@/components/page-shell";
import { HireButton } from "@/components/hire-button";
import { useSiteSettings } from "@/components/site-settings-context";
import { useSectionShown } from "@/components/site-order-context";
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
  const { t, href } = useLocale();
  const settings = useSiteSettings();
  const hireShown = useSectionShown("hire");
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

      {hireShown ? <HireButton className="contact-hire" /> : null}
      <Link
        href={`${href("/contratar")}#hire-form-panel`}
        className="hire-btn hire-cta contact-cta"
        data-testid="contact-cta"
      >
        <span className="hire-btn-label">{t.contact.contactCta}</span>
      </Link>
    </PageShell>
  );
}

function displayHandle(href: string) {
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
