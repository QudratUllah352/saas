import assert from "node:assert/strict";
const origin = process.env.SEO_TEST_ORIGIN || "http://localhost:3000";
const api = process.env.SEO_TEST_API_URL || "http://localhost:5000/api";
const html = async path => {
  const r = await fetch(origin + path, { signal: AbortSignal.timeout(30000) });
  assert.equal(r.status, 200, path); return r.text();
};
if (process.env.SEO_FIXTURE_UNAVAILABLE === "true") {
  for (const path of ["/", "/deals", "/reviews", "/blogs", "/comparisons", "/sitemap.xml", "/reviews/apify-review", "/deals/000000000000000000000001"]) {
    const r = await fetch(origin + path, { signal: AbortSignal.timeout(30000) });
    assert.equal(r.status, 500, `${path} must not return a successful empty catalogue or 404 during outage`);
  }
  assert.match(await html("/search?q=Apify"), /Search is temporarily\s+unavailable/);
  console.log("PASS: simulated service outage returns 500 for public content/sitemap and a usable search error state.");
} else {
  const records = await (await fetch(api + "/deals")).json();
  const names = body => [...body.matchAll(/<article class="premium-deal-card">([\s\S]*?)<\/article>/g)].map(m => m[1].match(/<h3>(.*?)<\/h3>/)?.[1]);
  assert.deepEqual(names(await html("/deals")), records.map(x => x.product.name));
  const product = records[0].product;
  assert.deepEqual(names(await html(`/deals?search=${encodeURIComponent(product.name)}`)), records.filter(x => (x.product.name + " " + x.product.description + " " + x.product.category.name).toLowerCase().includes(product.name.toLowerCase())).map(x => x.product.name));
  const category = product.category.slug;
  assert.deepEqual(names(await html(`/deals?category=${category}`)), records.filter(x => x.product.category.slug === category).map(x => x.product.name));
  assert.deepEqual(names(await html("/deals?sort=discount")), [...records].sort((a,b) => (parseInt(b.discount)||0)-(parseInt(a.discount)||0)).map(x => x.product.name));
  assert.ok((await html(`/search?q=${encodeURIComponent(product.name)}`)).includes(product.name));
  assert.equal((await fetch(`${api}/products/${product.slug}`)).status, 200);
  assert.equal((await fetch(`${origin}/products/${product.slug}`)).status, 404, "No public product page is implemented");
  await html(`/deals/${records[0]._id}`);
  await html("/submit-deal"); await html("/login");
  console.log("PASS: browse/search/sort/filter card contents, global search, product API, detail and form page responses. No writes.");
}
