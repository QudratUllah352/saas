// Include /api in NEXT_PUBLIC_API_URL. Public variables are set at build time.
import { resolveApiUrl } from "./api-url.mjs";

export const API_URL = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL, process.env.NODE_ENV === "production");
