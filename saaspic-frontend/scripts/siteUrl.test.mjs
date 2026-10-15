import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteUrl } from "../src/lib/site-url.mjs";

test("development has a local default; origins are normalized", () => {
  assert.equal(resolveSiteUrl({}), "http://localhost:3000");
  assert.equal(resolveSiteUrl({ NODE_ENV: "production", SITE_URL: " https://www.example.com/ " }), "https://www.example.com");
});

test("production rejects missing, non-HTTPS and local origins without echoing input", () => {
  for (const SITE_URL of [undefined, "", "http://example.com", "https://localhost:3000", "https://127.0.0.1", "https://10.0.0.1", "https://192.168.1.1", "https://172.16.0.1", "https://[::1]", "https://app.local", "https://internal"]) {
    assert.throws(() => resolveSiteUrl({ NODE_ENV: "production", SITE_URL }));
  }
  assert.throws(() => resolveSiteUrl({ SITE_URL: "https://user:private-value@example.com" }), error => !error.message.includes("private-value"));
});

test("rejects paths, credentials, query strings, fragments and invalid protocols", () => {
  for (const SITE_URL of ["invalid", "ftp://example.com", "https://example.com/site", "https://example.com/?x=1", "https://example.com/#hash", "https://user:password@example.com"]) {
    assert.throws(() => resolveSiteUrl({ SITE_URL }));
  }
});
