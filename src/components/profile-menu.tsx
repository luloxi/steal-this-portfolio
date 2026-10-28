"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminPanel, useIsAdmin } from "@/components/admin-context";
import { authClient } from "@/lib/auth/client";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Header avatar for a signed-in user: the Google profile photo. Click opens a
 * small menu with "Personalizar" (admin only, opens the admin panel) and "Salir".
 */
export function ProfileMenu({ image, name }: { image?: string; name?: string }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const isAdmin = useIsAdmin();
  const { setOpen: setPanelOpen } = useAdminPanel();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = es ? "Menú de tu cuenta" : "Your account menu";
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "·";

  return (
    <div className="pm-root" ref={rootRef} data-inline-editor="skip">
      <button
        type="button"
        className="pm-avatar"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {image && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar, not optimizable here
          <img src={image} alt="" width={36} height={36} referrerPolicy="no-referrer" draggable={false} onError={() => setBroken(true)} />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
      </button>
      {open ? (
        <div className="pm-menu" role="menu" aria-label={label}>
          {isAdmin ? (
            <button
              type="button"
              role="menuitem"
              className="pm-item"
              onClick={() => {
                setOpen(false);
                setPanelOpen(true);
              }}
            >
              {es ? "Personalizar" : "Customize"}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="pm-item"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await authClient.signOut();
              } finally {
                window.location.reload();
              }
            }}
          >
            {es ? "Salir" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
