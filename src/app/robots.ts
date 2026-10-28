import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings-db";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/rothko", "/blog/nuevo", "/api/", "/auth/", "/admin/"],
      },
    ],
    sitemap: `${settings.url}/sitemap.xml`,
    host: settings.url,
  };
}
