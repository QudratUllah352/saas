import test from "node:test";
import assert from "node:assert/strict";
import { resolveApiUrl } from "../src/lib/api-url.mjs";

test("localhost development stays usable; explicit API URL is normalized", () => {
  assert.equal(resolveApiUrl(), "http://localhost:5000/api");
  assert.equal(resolveApiUrl(" https://api.example.com/api/ ", true), "https://api.example.com/api");
});
test("production refuses missing, local and malformed browser API settings", () => {
  for (const value of [undefined, "", "http://api.example.com/api", "https://localhost/api", "https://127.0.0.1/api", "https://10.0.0.1/api", "https://example.com", "https://user:secret@example.com/api", "https://example.com/api?key=secret", "https://example.com/api#hash"]) assert.throws(() => resolveApiUrl(value, true));
});
