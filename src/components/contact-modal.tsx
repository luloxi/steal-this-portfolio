"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { calUrl } from "@/components/cal-embed";
import { HIRE_COPY } from "@/components/hire-copy";
import { HireForm } from "@/components/hire-form";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";

type Step = "choice" | "message";

type ContactModalApi = {
  open: () => void;
  close: () => void;
};

const ContactModalContext = createContext<ContactModalApi | null>(null);

export function useContactModal(): ContactModalApi {
  const ctx = useContext(ContactModalContext);
  if (!ctx) throw new Error("useContactModal must be used within ContactModalProvider");
  return ctx;
}

function useContactModalOptional(): ContactModalApi | null {
  return useContext(ContactModalContext);
}

/** settings.callBookingUrl when set, otherwise the site's Cal 30-minute link. */
export function bookingUrl(callBookingUrl: string): string {
  const u = callBookingUrl.trim();
  return u || calUrl("30min");
}

/**
 * Opens the contact modal (message vs video call). Without JS, or with a modified
 * click (new tab), it goes to /contacto.
 */
export function ContactTrigger({
  className,
  children,
  onOpen,
  ...rest
}: {
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  const { href } = useLocale();
  const modal = useContactModalOptional();
  return (
    <a
      href={href("/contacto")}
      className={className}
      {...rest}
      onClick={(e) => {
        if (!modal || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onOpen?.();
        modal.open();
      }}
    >
      {children}
    </a>
  );
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choice");
  const openModal = useCallback(() => {
    setStep("choice");
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  return (
    <ContactModalContext.Provider value={{ open: openModal, close }}>
      {children}
      {open ? <ContactModal step={step} setStep={setStep} onClose={close} /> : null}
    </ContactModalContext.Provider>
  );
}

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((el) => el.getAttribute("aria-hidden") !== "true" && el.tabIndex !== -1 && el.offsetParent !== null);
}

function ContactModal({ step, setStep, onClose }: { step: Step; setStep: (s: Step) => void; onClose: () => void }) {
  const { t, locale } = useLocale();
  const settings = useSiteSettings();
  const callHref = bookingUrl(settings.callBookingUrl);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const leadId = useId();
  const c = t.contact;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;
    const start = step === "message" ? root.querySelector<HTMLElement>("input[name='name']") : focusables(root)[0];
    start?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables(root);
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1]?.focus();
      } else if (!e.shiftKey && (i === items.length - 1 || i === -1)) {
        e.preventDefault();
        items[0]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="cm-backdrop" onClick={onBackdrop} data-testid="contact-modal-backdrop">
      <div
        ref={dialogRef}
        className="cm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={leadId}
        tabIndex={-1}
        data-testid="contact-modal"
      >
        <button type="button" className="cm-close" onClick={onClose} aria-label={c.close} data-testid="contact-modal-close">
          <span aria-hidden="true">×</span>
        </button>
        {step === "choice" ? (
          <>
            <h2 id={titleId} className="cm-title">{c.chooseTitle}</h2>
            <p id={leadId} className="cm-lead">{c.chooseLead}</p>
            <div className="cm-choices">
              <button type="button" className="hire-btn hire-cta" data-testid="contact-modal-message" onClick={() => setStep("message")}>
                <span className="hire-btn-label">{c.messageCta}</span>
              </button>
              <a
                href={callHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hire-btn hire-cta"
                data-testid="contact-modal-call"
                onClick={onClose}
              >
                <span className="hire-btn-label">{c.callCta}</span>
              </a>
            </div>
          </>
        ) : (
          <>
            <h2 id={titleId} className="cm-title">{c.messageTitle}</h2>
            <p id={leadId} className="cm-lead sr-only">{c.messageCta}</p>
            <button type="button" className="cm-back" onClick={() => setStep("choice")}>
              {c.back}
            </button>
            <HireForm c={HIRE_COPY[locale === "en" ? "en" : "es"]} idPrefix="cm-hire" compact />
          </>
        )}
      </div>
    </div>
  );
}
