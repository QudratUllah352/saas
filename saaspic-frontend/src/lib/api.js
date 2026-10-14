// Include /api in NEXT_PUBLIC_API_URL. Public variables are set at build time.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000/api"
).replace(/\/+$/, "");
