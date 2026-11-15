import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TEST_UTM_CAMPAIGN,
  TEST_UTM_SOURCE,
  dayInArgentina,
  deleteSmokeTestVisits,
  insertVisit,
  loadVisitStats,
  shouldRecordPageVisit,
  utmLinks,
  visitFromRequest,
  webAnalyticsSnippet,
} from "../src/lib/page-visits.ts";
import { d1 } from "./d1-sqlite.mts";

const fresh = () => d1(["0016_page_visits.sql"]);

function req(url: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "GET",
    headers: {
      accept: "text/html",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120",
      "sec-fetch-dest": "document",
      ...headers,
    },
  });
}

test("records a landing with utm_source=test and then deletes only that smoke row", async () => {
  const db = fresh();
  const request = req(
    "https://lulox.com.ar/contratar?utm_source=test&utm_medium=social&utm_campaign=analytics-smoke",
    { "cf-ipcountry": "AR", referer: "https://www.instagram.com/reel/abc" },
  );
  assert.equal(shouldRecordPageVisit(request), true);
  const visit = visitFromRequest(request);
  assert.ok(visit);
  assert.equal(visit.path, "/contratar");
  assert.equal(visit.utmSource, TEST_UTM_SOURCE);
  assert.equal(visit.utmMedium, "social");
  assert.equal(visit.utmCampaign, TEST_UTM_CAMPAIGN);
  assert.equal(visit.referrerHost, "www.instagram.com");
  assert.equal(visit.country, "AR");
  assert.equal(visit.source, "utm:test");
  assert.match(visit.day, /^\d{4}-\d{2}-\d{2}$/);
  await insertVisit(db, visit);

  // A second, real-looking row must survive the smoke cleanup.
  await insertVisit(db, {
    ...visit,
    utmSource: "instagram",
    utmCampaign: "implementacion-ia",
    source: "utm:instagram",
    path: "/",
  });

  const stats = await loadVisitStats(db, 60);
  assert.equal(stats.total, 2);
  assert.equal(stats.hireTotal, 1);
  assert.equal(stats.bySource.find((r) => r.key === "utm:test")?.visits, 1);
  assert.equal(stats.hireBySource[0]?.key, "utm:test");

  assert.equal(await deleteSmokeTestVisits(db), 1);
  const after = await loadVisitStats(db, 60);
  assert.equal(after.total, 1);
  assert.equal(after.hireTotal, 0);
  assert.equal(after.bySource[0]?.key, "utm:instagram");
});

test("skips assets, APIs, admin, bots, prefetch and RSC; same-site referrer is direct", () => {
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/api/copy")), false);
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/_next/static/chunk.js")), false);
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/admin/visitas")), false);
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/ingresar")), false);
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/", { "user-agent": "Googlebot/2.1" })), false);
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/", { purpose: "prefetch" })), false);
  assert.equal(shouldRecordPageVisit(req("https://lulox.com.ar/", { rsc: "1" })), false);
  assert.equal(shouldRecordPageVisit(new Request("https://lulox.com.ar/", { method: "POST", headers: { "user-agent": "Mozilla/5.0", accept: "text/html" } })), false);

  const internal = visitFromRequest(req("https://lulox.com.ar/blog", { referer: "https://lulox.com.ar/" }));
  assert.equal(internal?.source, "direct");
  assert.equal(internal?.referrerHost, null);
  assert.equal(internal?.path, "/blog");

  const ext = visitFromRequest(req("https://lulox.com.ar/", { referer: "https://t.co/abc" }));
  assert.equal(ext?.source, "ref:t.co");
  assert.equal(visitFromRequest(req("https://lulox.com.ar/en/hire"))?.path, "/en/hire");
});

test("day bucket is Argentina time, even just after midnight ART", () => {
  // 2026-11-15T02:30:00Z is 2026-11-14 23:30 in America/Argentina/Buenos_Aires (UTC-3).
  assert.equal(dayInArgentina(new Date("2026-11-15T02:30:00.000Z")), "2026-11-14");
  assert.equal(dayInArgentina(new Date("2026-11-15T03:00:00.000Z")), "2026-11-15");
});

test("ready-to-use UTM links cover home and /contratar for instagram, linkedin, x and email", () => {
  const links = utmLinks();
  assert.equal(links.length, 8);
  const urls = links.map((l) => l.url);
  for (const source of ["instagram", "linkedin", "x", "email"]) {
    assert.ok(urls.some((u) => u.includes(`utm_source=${source}`) && u.startsWith("https://lulox.com.ar/?") && u.includes("utm_campaign=portfolio")), source);
    assert.ok(urls.some((u) => u.includes(`utm_source=${source}`) && u.includes("/contratar?") && u.includes("utm_campaign=implementacion-ia")), source);
  }
  assert.ok(links.find((l) => l.source === "email")?.medium === "email");
  assert.ok(links.find((l) => l.source === "instagram")?.medium === "social");
});

test("web analytics snippet is injected only for a plausible public token", () => {
  assert.equal(webAnalyticsSnippet(""), null);
  assert.equal(webAnalyticsSnippet("nope"), null);
  const html = webAnalyticsSnippet("bc40a2d1b5834453aba85c1b9a3054da");
  assert.match(html ?? "", /static\.cloudflareinsights\.com\/beacon\.min\.js/);
  assert.match(html ?? "", /bc40a2d1b5834453aba85c1b9a3054da/);
});
