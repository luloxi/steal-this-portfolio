"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EDIT_MODE_KEY, editModeCookie, editModeFromCookie } from "@/lib/edit-mode";

type AdminState = {
  isAdmin: boolean;
  editOn: boolean;
  signedIn: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  setEditOn: (on: boolean) => void;
};
const AdminContext = createContext<AdminState>({
  isAdmin: false,
  editOn: false,
  signedIn: false,
  panelOpen: false,
  setPanelOpen: () => {},
  setEditOn: () => {},
});

/**
 * Admin flag (decided server-side per request), the edit-mode switch and the
 * state of the admin panel (opened from the profile menu in the header).
 * Edit mode makes allowlisted body content editable in place; the page looks
 * exactly the same, no pencils or outlines. The switch itself lives in the panel.
 */
export function AdminProvider({ isAdmin, signedIn = isAdmin, children }: { isAdmin: boolean; signedIn?: boolean; children: ReactNode }) {
  const router = useRouter();
  const [editOn, setEditOnState] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(() => {
    const v = window.localStorage.getItem(EDIT_MODE_KEY);
    if (v === "off") setEditOnState(false); // eslint-disable-line react-hooks/set-state-in-effect -- restore saved preference
    // Mirror to the cookie the server reads (blog drafts); re-render if it was out of sync.
    if (isAdmin && editModeFromCookie(document.cookie) !== (v !== "off")) {
      document.cookie = editModeCookie(v !== "off");
      router.refresh();
    }
  }, [isAdmin, router]);
  const setEditOn = useCallback(
    (next: boolean) => {
      window.localStorage.setItem(EDIT_MODE_KEY, next ? "on" : "off");
      document.cookie = editModeCookie(next);
      setEditOnState(next);
      router.refresh(); // server pages (blog) re-read the cookie: drafts hide/show
    },
    [router],
  );
  return (
    <AdminContext.Provider
      value={{ isAdmin, editOn: isAdmin && editOn, signedIn: signedIn || isAdmin, panelOpen: isAdmin && panelOpen, setPanelOpen, setEditOn }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useIsAdmin() {
  return useContext(AdminContext).isAdmin;
}

/** Any Google session (admin or not): decided server-side by the root layout. */
export function useSignedIn() {
  return useContext(AdminContext).signedIn;
}

export function useEditMode() {
  return useContext(AdminContext).editOn;
}

/** Save one site_copy value for the current locale (admin-only API). */
export async function saveCopy(key: string, locale: string, value: string): Promise<string | null> {
  const res = await fetch("/api/copy", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, locale, value }),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return res.status === 401 ? "session" : (data.error ?? String(res.status));
}

/** Admin panel open state (the profile menu opens it). */
export function useAdminPanel() {
  const { panelOpen, setPanelOpen } = useContext(AdminContext);
  return { open: panelOpen, setOpen: setPanelOpen };
}

/** Edit-mode switch (lives in the admin panel). */
export function useEditModeSwitch() {
  const { editOn, setEditOn } = useContext(AdminContext);
  return { on: editOn, set: setEditOn };
}
