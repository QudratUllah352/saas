// Local production verification only. Never enable this preload on a deployment.
// Map only the reserved test API origin to an already-running local backend.
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const value = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (value.startsWith("https://api.saaspin.example/api/")) {
    if (process.env.SEO_FIXTURE_UNAVAILABLE === "true") return Promise.resolve(new Response("{}", { status: 503, headers: { "Content-Type": "application/json" } }));
    if (typeof input !== "string" && !(input instanceof URL)) throw new Error("Fixture expects URL-based fetch calls");
    return nativeFetch(value.replace("https://api.saaspin.example", "http://localhost:5000"), options);
  }
  return nativeFetch(input, options);
};
