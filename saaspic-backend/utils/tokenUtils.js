const crypto = require("crypto");

/**
 * Generates a cryptographically secure random token and its SHA-256 hash.
 * Only the hashed token is stored in the database.
 * The raw token is sent to the user via email / link.
 */
function generateSecureToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, hashedToken };
}

/**
 * Hashes an incoming raw token with SHA-256 for lookup against database records.
 */
function hashToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") return "";
  return crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
}

module.exports = {
  generateSecureToken,
  hashToken,
};

