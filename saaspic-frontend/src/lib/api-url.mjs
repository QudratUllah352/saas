export function resolveApiUrl(value, production = false) {
  if (!value?.trim() && production) throw new Error("NEXT_PUBLIC_API_URL is required for production.");
  let url;
  try { url = new URL(value?.trim() || "http://localhost:5000/api"); }
  catch { throw new Error("NEXT_PUBLIC_API_URL must be a valid HTTP(S) API URL ending in /api."); }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/+$/, "") !== "/api") {
    throw new Error("NEXT_PUBLIC_API_URL must end in /api and have no credentials, query or fragment.");
  }
  if (production && (url.protocol !== "https:" || !url.hostname.includes(".") || /^(127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) || /\.(localhost|local|internal)$/.test(url.hostname))) {
    throw new Error("Production NEXT_PUBLIC_API_URL must use a public HTTPS hostname.");
  }
  return url.href.replace(/\/+$/, "");
}
