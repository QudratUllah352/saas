// Per-process baseline protection. Use shared gateway limits when running multiple instances.
function createLoginRateLimit({ limit = 10, windowMs = 15 * 60 * 1000, now = Date.now, message = "Too many login attempts. Please retry later." } = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    if (req.method !== "POST") return next();
    const time = now();
    for (const [key, value] of attempts) if (value.expires <= time) attempts.delete(key);
    const key = req.ip;
    let record = attempts.get(key);
    if (!record) {
      if (attempts.size >= 10000) return res.status(429).json({ message: "Please retry later." });
      record = { count: 0, expires: time + windowMs }; attempts.set(key, record);
    }
    if (++record.count > limit) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((record.expires - time) / 1000))));
      return res.status(429).json({ message });
    }
    next();
  };
}
module.exports = { createLoginRateLimit };
