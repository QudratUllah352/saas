// Shared by Next configuration and server metadata. Never include secret values in errors.
export function resolveSiteUrl(env = process.env) {
  const production = env.NODE_ENV === "production";
  const value = env.SITE_URL?.trim();
  if (!value && production) {
    throw new Error("SITE_URL is required for production. Set it to the public HTTPS website origin.");
  }

  let url;
  try {
    url = new URL(value || "http://localhost:3000");
  } catch {
    throw new Error("SITE_URL must be a valid HTTP(S) website origin.");
  }

  if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.");
  }

  const hostname = url.hostname.toLowerCase();
  const local = hostname === "localhost" || hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") || hostname.endsWith(".internal") ||
    hostname === "[::1]" || hostname === "[::]" ||
    /^(?:127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname) ||
    /^\[(?:f[cd]|fe[89ab])/i.test(hostname) || !hostname.includes(".");
  if (production && (url.protocol !== "https:" || local)) {
    throw new Error("Production SITE_URL must use HTTPS and a public hostname, not a local/private address.");
  }
  return url.origin;
}
