function frontendOrigin(env = process.env) {
  let url;
  try { url = new URL(env.FRONTEND_URL || (env.NODE_ENV === "production" ? "" : "http://localhost:3000")); }
  catch { throw new Error("FRONTEND_URL must be a valid website origin."); }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("FRONTEND_URL must be an HTTP(S) origin without credentials, path, query or fragment.");
  }
  if (env.NODE_ENV === "production" && (url.protocol !== "https:" || !url.hostname.includes(".") || /^(127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) || /\.(localhost|local|internal)$/.test(url.hostname))) {
    throw new Error("Production FRONTEND_URL must be a public HTTPS origin.");
  }
  return url.origin;
}

function validateEnvironment(env = process.env) {
  const origin = frontendOrigin(env);
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.MONGODB_URI || "")) throw new Error("MONGODB_URI must be configured with a MongoDB connection string.");
  if (!env.JWT_SECRET || (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32)) {
    throw new Error("JWT_SECRET is required; use at least 32 random characters in production.");
  }
  if (env.NODE_ENV === "production" && ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].some(key => !env[key]?.trim())) {
    throw new Error("Production email requires SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM.");
  }
  const port = Number(env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
  const smtpPort = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) throw new Error("SMTP_PORT must be a valid TCP port.");
  const trustProxy = env.TRUST_PROXY || "0";
  if (!/^\d+$/.test(trustProxy)) throw new Error("TRUST_PROXY must be the known number of reverse proxy hops (default 0).");
  return { origin, port, trustProxy: Number(trustProxy) };
}
module.exports = { frontendOrigin, validateEnvironment };
