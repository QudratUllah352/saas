const express = require("express");

const {
  loginAdmin,
  getCurrentAdmin,
  requestPasswordReset,
  verifyPasswordResetToken,
  completePasswordReset,
  getTeamMembers,
  inviteTeamMember,
  resendInvitation,
  verifyInviteToken,
  acceptInvite,
  updateTeamMemberRole,
  toggleTeamMemberStatus,
  deleteTeamMember,
} = require("../controllers/adminController");

const adminAuth = require("../middleware/adminAuth");
const { requireRole } = require("../middleware/adminAuth");

const router = express.Router();

// ============================================
// PUBLIC AUTHENTICATION & RECOVERY
// ============================================

// Login
router.post("/login", loginAdmin);

// Forgot Password Request
router.post("/forgot-password", requestPasswordReset);

// Verify Reset Password Token
router.get("/reset-password/verify", verifyPasswordResetToken);

// Complete Password Reset
router.post("/reset-password", completePasswordReset);

// Verify Team Invitation Token
router.get("/invite/verify", verifyInviteToken);

// Accept Team Invitation & Activate Account
router.post("/invite/accept", acceptInvite);

// ============================================
// AUTHENTICATED ADMIN / EDITOR ROUTES
// ============================================

// Current session identity (Super Admin, Admin, or Editor)
router.get("/me", adminAuth, getCurrentAdmin);

// ============================================
// TEAM MEMBER MANAGEMENT (Super Admin & Admin)
// ============================================

// List team members
router.get("/team", adminAuth, requireRole("superadmin", "admin"), getTeamMembers);

// Invite new team member
router.post(
  "/team/invite",
  adminAuth,
  requireRole("superadmin", "admin"),
  inviteTeamMember
);

// Resend pending invitation
router.post(
  "/team/:id/resend",
  adminAuth,
  requireRole("superadmin", "admin"),
  resendInvitation
);

// Toggle team member status (active / deactivated)
router.patch(
  "/team/:id/status",
  adminAuth,
  requireRole("superadmin", "admin"),
  toggleTeamMemberStatus
);

// Update member role (Super Admin only)
router.patch(
  "/team/:id/role",
  adminAuth,
  requireRole("superadmin"),
  updateTeamMemberRole
);

// Remove member (Super Admin only)
router.delete(
  "/team/:id",
  adminAuth,
  requireRole("superadmin"),
  deleteTeamMember
);

module.exports = router;