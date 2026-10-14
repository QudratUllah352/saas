import { API_URL } from "@/lib/api";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function getContent(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Sitemap fetch failed for ${endpoint}:`,
        response.status
      );

      return [];
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(
      `Sitemap fetch error for ${endpoint}:`,
      error
    );

    return [];
  }
}

export default async function sitemap() {
  const siteUrl =
    getSiteUrl() ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const baseUrl = siteUrl.replace(/\/$/, "");

  // Static public pages should always be available.
  const entries = [
    "/",
    "/deals",
    "/reviews",
    "/comparisons",
    "/blogs",
    "/submit-deal",
    "/affiliate-disclosure",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
  }));

  // Dynamic public content.
  const [deals, reviews, comparisons, blogs] =
    await Promise.all([
      getContent("/deals"),
      getContent("/reviews"),
      getContent("/comparisons"),
      getContent("/blogs"),
    ]);

  const contentGroups = [
    ["deals", deals],
    ["reviews", reviews],
    ["comparisons", comparisons],
    ["blogs", blogs],
  ];

  for (const [kind, records] of contentGroups) {
    for (const record of records) {
      const identifier =
        kind === "deals"
          ? record._id
          : record.slug;

      const visible =
        kind === "deals"
          ? record.isActive === true
          : record.isPublished === true;

      if (!visible) {
        continue;
      }

      if (
        typeof identifier !== "string" ||
        !identifier.trim()
      ) {
        continue;
      }

      // Deal detail pages currently use MongoDB IDs.
      if (
        kind === "deals" &&
        !/^[a-fA-F0-9]{24}$/.test(identifier)
      ) {
        continue;
      }

      const date =
        record.updatedAt ||
        record.publishedAt ||
        record.createdAt;

      const lastModified = date
        ? new Date(date)
        : null;

      entries.push({
        url: `${baseUrl}/${kind}/${encodeURIComponent(
          identifier
        )}`,

        ...(lastModified &&
        !Number.isNaN(lastModified.getTime())
          ? { lastModified }
          : {}),
      });
    }
  }

  // Prevent duplicate URLs.
  return [
    ...new Map(
      entries.map((entry) => [
        entry.url,
        entry,
      ])
    ).values(),
  ];
}