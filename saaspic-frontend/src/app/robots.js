import { getSiteUrl } from "@/lib/seo";

export default function robots() {
  const siteUrl =
    getSiteUrl() || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}