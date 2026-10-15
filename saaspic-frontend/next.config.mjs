import { resolveSiteUrl } from "./src/lib/site-url.mjs";
import { resolveApiUrl } from "./src/lib/api-url.mjs";

// Fail before a production build/start can emit localhost SEO URLs.
resolveSiteUrl();
resolveApiUrl(process.env.NEXT_PUBLIC_API_URL, process.env.NODE_ENV === "production");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
