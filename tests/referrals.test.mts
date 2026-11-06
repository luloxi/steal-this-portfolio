/** Referral program: codes, cookie, money, D1 (0009) and permissions. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  checkCodeShape,
  formatCents,
  normalizeWhatsapp,
  parseAmountCents,
  payoutCents,
  payoutTotals,
  refCookie,
  refFromCookie,
  safeNext,
  shareLinks,
  waLink,
} from "../src/lib/referrals.ts";
import { getActiveReferrer, insertLead, getMyReferral } from "../src/lib/referrals-db.ts";
import { adminGate, adminList, adminSetActive, adminUpdatePayout, checkCode, myReferral, signup, type Viewer } from "../src/lib/referrals-api.ts";
import { handleHireContact } from "../src/lib/hire-contact.ts";
import { d1 } from "./d1-sqlite.mts";

const ANA: Viewer = { id: "u-ana", email: "ana@example.com", name: "Ana Pérez", isAdmin: false };
const BETO: Viewer = { id: "u-beto", email: "beto@example.com", name: "Beto", isAdmin: false };
const ADMIN: Viewer = { id: "u-lulo", email: "lucianoolivabianco@gmail.com", name: "Luciano", isAdmin: true };
const fresh = () => d1(["0009_referrals.sql"]);

test("code shape: a-z 0-9 inner hyphens, 3-24, case-insensitive, reserved words blocked", () => {
  assert.deepEqual(checkCodeShape("  Ana-Dev "), { ok: true, code: "ana-dev" });
  assert.deepEqual(checkCodeShape("abc"), { ok: true, code: "abc" });
  assert.deepEqual(checkCodeShape("a".repeat(24)), { ok: true, code: "a".repeat(24) });
  for (const bad of ["ab", "a".repeat(25), "-ana", "ana-", "ana--dev", "ana_dev", "añá", "ana dev", "", null, 42]) {
    assert.deepEqual(checkCodeShape(bad), { ok: false, error: "invalid" }, String(bad));
  }
  for (const r of ["admin", "ADMIN", "api", "lulox", "en", "es", "referidos", "a-d-m-i-n", "sign-in"]) {
    const res = checkCodeShape(r);
    // "en"/"es" are too short anyway: invalid before reserved.
    assert.equal(res.ok, false, r);
  }
  assert.deepEqual(checkCodeShape("a-d-m-i-n"), { ok: false, error: "reserved" });
  assert.deepEqual(checkCodeShape("Lulox"), { ok: false, error: "reserved" });
});
