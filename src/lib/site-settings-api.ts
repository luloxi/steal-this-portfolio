/**
 * Save API for site identity (PUT /api/settings).
 * 401: no session. 403: not admin, or edit mode off.
 */
import { validateSettingsPayload } from "@/lib/site-settings";

export type SettingsCaller = { signedIn: boolean; isAdmin: boolean; editOn: boolean };
export type SettingsResult = { status: number; body: Record<string, unknown> };

export function settingsGate(c: SettingsCaller): SettingsResult | null {
  if (!c.signedIn) return { status: 401, body: { error: "unauthorized" } };
  if (!c.isAdmin) return { status: 403, body: { error: "forbidden" } };
  if (!c.editOn) return { status: 403, body: { error: "edit_mode_off" } };
  return null;
}

export async function handleSettingsSave(
  caller: SettingsCaller,
  body: unknown,
  save: (entries: { key: string; value: string }[]) => Promise<void>,
): Promise<SettingsResult> {
  const denied = settingsGate(caller);
  if (denied) return denied;
  const v = validateSettingsPayload(body);
  if (!v.ok) {
    const { ok: _ok, ...err } = v;
    return { status: 400, body: err };
  }
  try {
    await save(v.entries);
  } catch {
    console.error("[api/settings] save failed");
    return { status: 500, body: { error: "save_failed" } };
  }
  return { status: 200, body: { ok: true } };
}
