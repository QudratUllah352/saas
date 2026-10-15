// Read-only integration checks; never follows affiliate links or changes records.
import assert from "node:assert/strict";

const origin = process.env.SEO_TEST_ORIGIN || "http://localhost:3000";
const siteOrigin = process.env.SEO_EXPECTED_SITE_ORIGIN || origin;
const api = process.env.SEO_TEST_API_URL || "http://localhost:5000/api";
const production = process.env.SEO_TEST_PRODUCTION === "true";
let checks = 0;

async function page(path, status = 200, userAgent = "Mozilla/5.0 SEO regression check") {
  const response = await fetch(`${origin}${path}`, {
    redirect: "manual", headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, status, `${path} (${userAgent}) HTTP status`);
  checks++;
  return { response, html: await response.text() };
}
function noindex(html, path) {
  assert.match(html, /<meta\b(?=[^>]*name="robots")(?=[^>]*content="[^"]*noindex)[^>]*>/i, `${path} robots`);
  checks++;
}

for (const path of ["/login", "/forgot-password", "/reset-password", "/accept-invite", "/search?q=seo", "/admin", "/admin/products"]) {
  noindex((await page(path)).html, path);
}
noindex((await page("/api-test", production ? 404 : 200)).html, "/api-test");

for (const agent of ["Mozilla/5.0 SEO regression check", "Googlebot", "Twitterbot"]) {
  for (const path of ["/missing-seo-regression", "/products/missing-seo-regression", "/deals/000000000000000000000000", "/deals/missing-seo-regression", "/reviews/missing-seo-regression", "/comparisons/missing-seo-regression", "/blogs/missing-seo-regression", "/deals?category=missing-seo-regression", "/deals?category=ai&category=development"]) {
    noindex((await page(path, 404, agent)).html, path);
  }
  const { response } = await page("/deals/ai", 308, agent);
  assert.equal(response.headers.get("location"), "/deals?category=ai-tools");
  checks++;
}
await page("/deals?category=ai-tools");
await page("/deals?category=ai");
await page("/deals?category=all");
await page("/deals?category=seo-marketing"); // A valid category can have no current offers.
assert.equal((await page("/admin/login", 308)).response.headers.get("location"), "/login");

const { html: robots } = await page("/robots.txt");
assert.ok(robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`));
assert.ok(!robots.includes("Disallow: /admin"), "Keep noindex pages crawlable");
const { html: sitemap } = await page("/sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
assert.ok(urls.length >= 7, "Sitemap contains expected public pages");
assert.equal(new Set(urls.map(url => url.href)).size, urls.length);
for (const url of urls) {
  assert.equal(url.origin, siteOrigin);
  assert.doesNotMatch(url.pathname, /^\/(admin|login|search|api-test|forgot-password|reset-password|accept-invite)(\/|$)/);
  const { html } = await page(url.pathname);
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  assert.ok(canonical, `${url.pathname} has a canonical`);
  assert.equal(new URL(canonical).href, url.href, `${url.pathname} canonical`);
  assert.doesNotMatch(html, /<meta\b(?=[^>]*name="robots")(?=[^>]*content="[^"]*noindex)[^>]*>/i);
  if (/^\/(blogs|reviews|comparisons)\//.test(url.pathname)) {
    assert.ok(html.includes(encodeURIComponent(url.href)), `${url.pathname} sharing URL`);
  }
  if (production) assert.ok(!html.includes("http://localhost:3000"), `${url.pathname} has no localhost site URL`);
  checks++;
}
for (const path of ["/products/missing-seo-regression", "/deals/000000000000000000000000"]) {
  assert.equal((await fetch(`${api}${path}`)).status, 404);
  checks++;
}
for (const path of ["/reviews/admin/all", "/blogs/admin/all", "/products/admin/000000000000000000000000"]) {
  assert.equal((await fetch(`${api}${path}`)).status, 401);
  checks++;
}
console.log(`PASS: ${checks} route/metadata checks; ${urls.length} sitemap destinations; ${production ? "production" : "development"} mode.`);
