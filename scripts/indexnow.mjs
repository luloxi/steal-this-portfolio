/**
 * Ping IndexNow (Bing, Yandex, Seznam, Naver...) with every URL in the live sitemap.
 * Run after a deploy: `pnpm indexnow`. The key is public by design and lives at
 * public/<key>.txt (the only 32-hex .txt file there). SITE_URL overrides the host.
 */
import { readdirSync } from "node:fs";

const site = (process.env.SITE_URL || "https://lulox.com.ar").replace(/\/$/, "");
const keyFile = readdirSync(new URL("../public/", import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file in public/");
const key = keyFile.replace(/\.txt$/, "");

const xml = await (await fetch(`${site}/sitemap.xml`)).text();
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${keyFile}`, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URLs`);
if (res.status >= 400) process.exit(1);
