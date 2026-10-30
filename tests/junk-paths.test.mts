import { test } from "node:test";
import assert from "node:assert/strict";
import { isJunkPath } from "../src/lib/junk-paths.ts";

test("scanner probes are junk", () => {
  for (const p of [
    "/%2F.github%2Ffunding.yml",
    "/%252f.backup%252fphpinfo.php",
    "/%252fapp%252famplify%252eyaml",
    "/aws_credentials.ini",
    "/urlmem-app/.env",
    "/api/node/config.js",
    "/stripe-credentials.json",
    "/api/config/constants.js",
    "/.git/config",
    "/wp-login.php",
    "/backup.sql",
  ]) {
    assert.equal(isJunkPath(p), true, p);
  }
});

test("real pages, assets and API routes pass", () => {
  for (const p of [
    "/",
    "/en",
    "/blog",
    "/blog/por-que-deje-hermes-agent",
    "/blog/art%C3%ADculo-con-tilde",
    "/proyectos/djtube",
    "/en/hire",
    "/api/auth/get-session",
    "/api/projects/public",
    "/icons/favicon.v2.ico",
    "/icons/icon-512.v2.png",
    "/icons/apple-touch-icon-180.v2.png",
    "/manifest.v2.webmanifest",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/.well-known/security.txt",
    "/_next/static/chunks/main-app.js",
    "/media/uploads/photo.webp",
    "/projects/djtube.svg",
  ]) {
    assert.equal(isJunkPath(p), false, p);
  }
});
