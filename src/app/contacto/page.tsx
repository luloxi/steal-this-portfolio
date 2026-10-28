"use client";

import type { ComponentType } from "react";
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
  const { t } = useLocale();
  const settings = useSiteSettings();
  const hireShown = useSectionShown("hire");
  const rows = settings.socials.filter((s) => s.id !== "github");

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

      {hireShown ? <HireButton className="contact-hire" /> : null}
    </PageShell>
  );
}

function displayHandle(href: string) {
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
