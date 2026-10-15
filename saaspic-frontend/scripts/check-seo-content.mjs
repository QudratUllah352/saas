// Read-only rendered HTML checks. No affiliate destinations are followed.
import assert from "node:assert/strict";
const origin = process.env.SEO_TEST_ORIGIN || "http://localhost:3000";
const canonicalOrigin = process.env.SEO_EXPECTED_SITE_ORIGIN || origin;
const api = process.env.SEO_TEST_API_URL || "http://localhost:5000/api";
const decode = value => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const titles = new Set();
const descriptions = new Set();
let count = 0;
const internalLinks = new Set();
async function check(path, { noindex = false, canonical = path, breadcrumb = false } = {}) {
  const r = await fetch(origin + path, { signal: AbortSignal.timeout(30000) });
  assert.equal(r.status, 200, path);
  const html = await r.text();
  for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"#]*)"/g)) {
    if (!match[1].startsWith("//")) internalLinks.add(decode(match[1]));
  }
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || "");
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "");
  assert.ok(title && description, `${path} has title and description`);
  if (!noindex) {
    assert.ok(!titles.has(title), `${path} unique title`);
    assert.ok(!descriptions.has(description), `${path} unique description`);
    titles.add(title); descriptions.add(description);
  }
  const actualCanonical = decode(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "");
  assert.equal(new URL(actualCanonical).href, new URL(canonical, canonicalOrigin).href, `${path} canonical`);
  const blocked = /<meta\b(?=[^>]*name="robots")(?=[^>]*content="[^"]*noindex)[^>]*>/i.test(html);
  assert.equal(blocked, noindex, `${path} indexing policy`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${path} single H1`);
  for (const [image] of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(image, /\balt="[^"]+"/, `${path} meaningful image alt`);
  }
  const data = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
  for (const item of data) {
    assert.equal(item["@context"], "https://schema.org");
    assert.ok(["Organization", "BreadcrumbList"].includes(item["@type"]));
    if (item["@type"] === "Organization") {
      assert.equal(path, "/"); assert.equal(item.name, "SaaSpin");
      assert.equal(new URL(item.url).origin, canonicalOrigin);
      assert.deepEqual(Object.keys(item).sort(), ["@context", "@type", "name", "url"]);
    } else {
      assert.ok(html.includes('aria-label="Breadcrumb"'));
      const visible = decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<[^>]*>/g, " "));
      item.itemListElement.forEach((entry, index) => {
        assert.equal(entry.position, index + 1);
        assert.ok(visible.includes(entry.name));
        assert.equal(new URL(entry.item).origin, canonicalOrigin);
      });
      assert.equal(new URL(item.itemListElement.at(-1).item).href, new URL(canonical, canonicalOrigin).href);
    }
  }
  if (breadcrumb) assert.equal(data.filter(x => x["@type"] === "BreadcrumbList").length, 1);
  if (path === "/") {
    assert.equal(data.filter(x => x["@type"] === "Organization").length, 1);
    assert.ok(title.endsWith("| SaaSpin"));
    assert.doesNotMatch(html, /4\.9 \/ 5\.0 TrustScore|10,000\+ founders|Verified Deals|vetted SaaS deals/);
  }
  count++;
}
await check("/"); await check("/deals"); await check("/reviews");
const categories = await (await fetch(api + "/categories")).json();
const categoryTitles = new Set();
for (const category of categories) {
  const path = `/deals?category=${category.slug}`;
  await check(path, { noindex: true });
  const html = await (await fetch(origin + path)).text();
  assert.ok(decode(html).includes(category.name));
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(!categoryTitles.has(title)); categoryTitles.add(title);
}
await check("/deals?category=ai&sort=discount", { noindex: true, canonical: "/deals?category=ai-tools" });
await check("/deals?search=Apify", { noindex: true, canonical: "/deals" });
for (const kind of ["deals", "reviews"]) {
  const records = await (await fetch(`${api}/${kind}`)).json();
  for (const record of records) await check(`/${kind}/${kind === "deals" ? record._id : record.slug}`, { breadcrumb: true });
}
for (const path of internalLinks) {
  const response = await fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(30000) });
  assert.ok(response.status >= 200 && response.status < 400, `${path} internal link HTTP ${response.status}`);
}
console.log(`PASS: ${count} rendered pages checked for metadata, canonical URLs, H1, image alt attributes and supported JSON-LD; ${internalLinks.size} internal links checked.`);
