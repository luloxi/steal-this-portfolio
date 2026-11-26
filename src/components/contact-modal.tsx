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
import { usePathname } from "next/navigation";
import { calUrl } from "@/components/cal-embed";
import { HIRE_COPY } from "@/components/hire-copy";
import { HireForm } from "@/components/hire-form";
import { useSiteSettings } from "@/components/site-settings-context";
import { useLocale } from "@/i18n/locale-provider";

type Step = "choice" | "message";

type ContactModalApi = {
  /** With a prefill, it opens straight on the message form with that text written. */
  open: (prefill?: string) => void;
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
  prefill,
  ...rest
}: {
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
  prefill?: string;
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
        modal.open(prefill);
      }}
    >
      {children}
    </a>
  );
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choice");
  const [prefill, setPrefill] = useState("");
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const openModal = useCallback((text?: string) => {
    setPrefill(text ?? "");
    setStep(text ? "message" : "choice");
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  // The provider lives in the root layout, so a same-tab Link (e.g. Privacidad)
  // would otherwise leave the modal open on the new page.
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    setOpen(false);
  }, [pathname]);
  return (
    <ContactModalContext.Provider value={{ open: openModal, close }}>
      {children}
      {open ? <ContactModal step={step} setStep={setStep} onClose={close} prefill={prefill} /> : null}
    </ContactModalContext.Provider>
  );
}


/**
 * Two ways to get in touch: a short message form, or a video call on Cal.com.
 * On the page the two options stay in view and the form only appears after
 * choosing "Mandar un mensaje". In the modal, the form replaces the choices.
 */
export function ContactWays({
  callHref,
  variant,
  step: stepProp,
  setStep: setStepProp,
  onCall,
  prefill,
}: {
  prefill?: string;
  callHref: string;
  variant: "modal" | "page";
  step?: Step;
  setStep?: (s: Step) => void;
  onCall?: () => void;
}) {
  const { t, locale } = useLocale();
  const c = t.contact;
  const [inner, setInner] = useState<Step>("choice");
  const step = stepProp ?? inner;
  const setStep = setStepProp ?? setInner;

  useEffect(() => {
    if (variant !== "page") return;
    if (new URLSearchParams(window.location.search).has("contacto")) setStep("message");
  }, [variant, setStep]);

  const messageBtn = (
    <button
      type="button"
      className={variant === "page" ? "cm-pick-btn" : "hire-btn hire-cta"}
      data-testid={variant === "page" ? "contact-message" : "contact-modal-message"}
      data-active={variant === "page" && step === "message" ? "true" : undefined}
      aria-pressed={variant === "page" ? step === "message" : undefined}
      onClick={() => setStep("message")}
    >
      {variant === "page" ? c.messageCta : <span className="hire-btn-label">{c.messageCta}</span>}
    </button>
  );
  const callLink = (
    <a
      href={callHref}
      target="_blank"
      rel="noopener noreferrer"
      className={variant === "page" ? "cm-pick-btn" : "hire-btn hire-cta"}
      data-testid={variant === "page" ? "contact-call" : "contact-modal-call"}
      onClick={onCall}
    >
      {variant === "page" ? c.callCta : <span className="hire-btn-label">{c.callCta}</span>}
    </a>
  );
  const form = (
    <HireForm
      c={HIRE_COPY[locale === "en" ? "en" : "es"]}
      idPrefix={variant === "page" ? "hire" : "cm-hire"}
      compact
      onInternalNav={onCall}
      initialMessage={prefill}
    />
  );

  if (variant === "modal") {
    if (step === "message") {
      return (
        <>
          <button type="button" className="cm-back" onClick={() => setStep("choice")}>
            {c.back}
          </button>
          {form}
        </>
      );
    }
    return <div className="cm-choices">{messageBtn}{callLink}</div>;
  }

  return (
    <div className="contact-ways">
      <div className="cm-pick" role="group" aria-label={c.contactCta}>
        {messageBtn}
        {callLink}
      </div>
      {step === "message" ? form : null}
    </div>
  );
}

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((el) => el.getAttribute("aria-hidden") !== "true" && el.tabIndex !== -1 && el.offsetParent !== null);
}

function ContactModal({ step, setStep, onClose, prefill }: { step: Step; setStep: (s: Step) => void; onClose: () => void; prefill?: string }) {
  const { t } = useLocale();
  const settings = useSiteSettings();
  const callHref = bookingUrl(settings.callBookingUrl);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
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
        tabIndex={-1}
        data-testid="contact-modal"
      >
        <button type="button" className="cm-close" onClick={onClose} aria-label={c.close} data-testid="contact-modal-close">
          <span aria-hidden="true">×</span>
        </button>
        <h2 id={titleId} className="cm-title">{step === "message" ? c.messageTitle : c.chooseTitle}</h2>
        <ContactWays callHref={callHref} variant="modal" step={step} setStep={setStep} onCall={onClose} prefill={prefill} />
      </div>
    </div>
  );
}
