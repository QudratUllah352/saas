// Set SITE_URL to the public website origin before deployment.
// Example:
// Development: http://localhost:3000
// Production: https://your-real-domain.com

export function getSiteUrl() {
  const value = process.env.SITE_URL?.trim();

  if (!value) {
    return null;
  }

  const url = new URL(value);

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be an HTTP(S) website origin without credentials, a path, query, or fragment."
    );
  }

  return url.origin;
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}) {
  const siteUrl = getSiteUrl();

  let imageUrl;

  if (image) {
    try {
      const parsed = siteUrl
        ? new URL(image, siteUrl)
        : new URL(image);

      if (
        ["http:", "https:"].includes(parsed.protocol) &&
        !parsed.username &&
        !parsed.password
      ) {
        imageUrl = parsed.href;
      }
    } catch {
      // Ignore unavailable or invalid images.
    }
  }

  return {
    // Root layout adds "| SaaSpin" through its title template.
    title,

    description,

    ...(siteUrl
      ? {
          alternates: {
            canonical: `${siteUrl}${path}`,
          },
        }
      : {}),

    openGraph: {
      // Open Graph does not use the root title template,
      // so include the brand explicitly here.
      title: `${title} | SaaSpin`,
      description,
      siteName: "SaaSpin",
      type,

      ...(siteUrl
        ? {
            url: `${siteUrl}${path}`,
          }
        : {}),

      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: title,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: `${title} | SaaSpin`,
      description,

      ...(imageUrl
        ? {
            images: [imageUrl],
          }
        : {}),
    },
  };
}

export function unavailableMetadata(title) {
  return {
    title,

    robots: {
      index: false,
      follow: false,
    },
  };
}