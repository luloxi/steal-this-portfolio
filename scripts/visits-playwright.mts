/**
 * Visual smoke for / and /contacto (mobile + desktop), and an optional live
 * UTM count check. Default: https://lulox.com.ar
 *
 *   pnpm exec tsx scripts/visits-playwright.mts
 *   BASE_URL=http://127.0.0.1:8787 pnpm exec tsx scripts/visits-playwright.mts
 *
 * Set COUNT_UTM=1 after deploy to hit /?utm_source=test&utm_campaign=analytics-smoke
 * and then delete only those rows with:
 *   pnpm exec wrangler d1 execute DB --remote --command \
 *     "DELETE FROM page_visits WHERE utm_source='test' AND utm_campaign='analytics-smoke'"
 */
import { chromium, type Page } from "playwright-core";

const BASE = (process.env.BASE_URL ?? "https://lulox.com.ar").replace(/\/$/, "");
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;
const ROUTES = ["/", "/contacto"] as const;

async function checkPage(page: Page, path: string) {
  const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  const status = res?.status() ?? 0;
  if (status !== 200) throw new Error(`${path} status ${status}`);
  const err = await page.locator("#__next-error, nextjs-portal").count();
  if (err) throw new Error(`${path} rendered a Next error overlay`);
  const body = (await page.locator("body").innerText()).toLowerCase();
  if (body.includes("application error") || body.includes("internal server error")) {
    throw new Error(`${path} looks crashed`);
  }
  if (path === "/") {
    const hire = page.locator('[data-testid="hire-btn"]');
    if (!(await hire.count())) throw new Error("home is missing the Contactar button");
  }
  if (path === "/contacto") {
    const form = page.locator("form, [data-testid='hire-form'], textarea, input[type='email']");
    if (!(await form.count())) throw new Error("contacto is missing the form");
  }
}

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      await checkPage(page, route);
      console.log(`ok ${vp.name} ${vp.width}x${vp.height} ${route}`);
    }
    await ctx.close();
  }

  if (process.env.COUNT_UTM === "1") {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { "sec-fetch-dest": "document", accept: "text/html" },
    });
    const page = await ctx.newPage();
    const url = `${BASE}/?utm_source=test&utm_medium=social&utm_campaign=analytics-smoke`;
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (res?.status() !== 200) throw new Error(`utm smoke status ${res?.status()}`);
    console.log("ok utm smoke hit", url);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log("visits playwright: clean");
