import { API_URL } from "./api";

// A service outage is an error, not a successful empty catalogue or sitemap.
export async function fetchPublicList(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Public content temporarily unavailable (${response.status})`);
  const records = await response.json();
  if (!Array.isArray(records)) throw new Error("Invalid public content response");
  return records;
}
