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
