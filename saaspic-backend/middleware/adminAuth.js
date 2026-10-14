const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

/**
 * Base authentication middleware for all administrative dashboard access.
 * Verifies JWT token, ensures user exists and is active, and checks token invalidation.
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    // Verify user still exists in database and is active
    const adminUser = await Admin.findById(decoded.id).select("-password");

    if (!adminUser) {
      return res.status(401).json({
        message: "The account associated with this session no longer exists.",
      });
    }

    if (adminUser.status === "deactivated") {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact a Super Administrator.",
      });
    }

    // Verify that the user did not change password after token was issued
    if (adminUser.changedPasswordAfter && adminUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: "Your password was recently changed. Please sign in again with your new password.",
      });
    }

    // Attach current admin and their role to request object
    const effectiveRole = adminUser.role || decoded.role || "admin";

    req.admin = {
      id: adminUser._id.toString(),
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: effectiveRole,
      status: adminUser.status,
    };

    req.adminUser = adminUser;

    next();
  } catch (error) {
    console.error("adminAuth error:", error);
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Ensures the authenticated user possesses one of the permitted roles.
 * Example: requireRole("superadmin", "admin")
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userRole = req.admin.role || "admin";

    // Super Admin always has full access
    if (userRole === "superadmin") {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(
          ", "
        )}. Your current role is '${userRole}'.`,
      });
    }

    next();
  };
};

module.exports = adminAuth;
module.exports.requireRole = requireRole;