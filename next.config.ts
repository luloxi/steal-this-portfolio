import type { NextConfig } from "next";
import path from "path";
import { BLOG_IMAGE_REMOTE_PATTERNS } from "./src/lib/blog-image-hosts";
import { SERVICE_REDIRECTS } from "./src/lib/service-redirects";

// Cloudflare Workers (OpenNext) has no Vercel image optimizer, so images are
// served as is there. `pnpm cf:build` sets NEXT_BUILD_TARGET=cloudflare.
// Vercel builds leave it unset and keep next/image optimization.
const isCloudflare = process.env.NEXT_BUILD_TARGET === "cloudflare";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin root so parent monorepo lockfiles don't confuse the bundler
    root: path.join(__dirname),
  },
  // Old English paths (from before /en existed) keep 301-ing to the Spanish
  // pages, unchanged. The English site lives under /en (see src/lib/routes.ts).
  async redirects() {
    const r = (source: string, destination: string) => ({
      source,
      destination,
      statusCode: 301 as const,
    });
    return [
      r("/servicios/automatizar-finanzas", "/servicios"),
      r("/en/services/finance-automation", "/en/services"),
      // The five service pages became sections of /servicios («Hecho para vos»).
      ...SERVICE_REDIRECTS.map(([from, to]) => r(from, to)),
      r("/about", "/sobre-mi"),
      r("/tastes", "/sobre-mi"),
      r("/gustos", "/sobre-mi"),
      r("/projects", "/proyectos"),
      r("/projects/:id(djtube|mochi|sami|punksociety|garpen|malito|tarask|steal-this-portfolio)", "/proyectos/:id"),
      r("/proyectos/serpix", "/proyectos/garpen"),
      r("/proyectos/mailtox", "/proyectos/malito"),
      r("/projects/serpix", "/proyectos/garpen"),
      r("/projects/mailtox", "/proyectos/malito"),
      r("/en/projects/serpix", "/en/projects/garpen"),
      r("/en/projects/mailtox", "/en/projects/malito"),
      r("/proyectos/cuentix", "/proyectos/tarask"),
      r("/projects/cuentix", "/proyectos/tarask"),
      r("/en/projects/cuentix", "/en/projects/tarask"),
      r("/contact", "/contacto"),
      r("/privacy", "/privacidad"),
      r("/auth/sign-in", "/ingresar"),
      r("/login", "/ingresar"),
      r("/en/tastes", "/en/about"),
      r("/en/gustos", "/en/about"),
      r("/en/login", "/en/sign-in"),
      // Old case-study pages: projects live on their own page now.
      r("/casos", "/proyectos"),
      r("/casos/:slug", "/proyectos"),
      r("/en/case-studies", "/en/projects"),
      r("/en/case-studies/:slug", "/en/projects"),
    ];
  },
  images: {
    remotePatterns: BLOG_IMAGE_REMOTE_PATTERNS,
    ...(isCloudflare ? { unoptimized: true } : {}),
  },
};

export default nextConfig;
