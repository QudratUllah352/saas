const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const { generateSecureToken, hashToken } = require("../utils/tokenUtils");
const {
  sendPasswordResetEmail,
  sendTeamInviteEmail,
} = require("../utils/emailService");

function getFrontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:3000";
}

// Simple in-memory rate limiting map for forgot-password
const resetRateLimitMap = new Map();

function checkResetRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  const records = resetRateLimitMap.get(ip) || [];
  const validRecords = records.filter((timestamp) => now - timestamp < windowMs);

  if (validRecords.length >= maxRequests) {
    return false;
  }

  validRecords.push(now);
  resetRateLimitMap.set(ip, validRecords);
  return true;
}

/**
 * Admin Login
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Check account status
    if (admin.status === "deactivated") {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact a Super Administrator.",
      });
    }

    if (admin.status === "invited") {
      return res.status(403).json({
        message:
          "This account has not accepted its invitation yet. Please check your email to set up your password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Backward-compatible role assignment: if existing admin lacks a role, default to superadmin
    const effectiveRole = admin.role || "superadmin";

    // If document didn't have role stored yet, persist it
    if (!admin.role) {
      admin.role = effectiveRole;
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      {
        id: admin._id,
        role: effectiveRole,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: effectiveRole,
        status: admin.status,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Could not login. Please try again.",
    });
  }
};

/**
 * Get Current Admin Profile
 */
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        message: "Admin account not found.",
      });
    }

    return res.status(200).json({
      authenticated: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role || "admin",
        status: admin.status,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get current admin error:", error);
    return res.status(500).json({
      message: "Could not verify admin.",
    });
  }
};

/**
 * Request Password Reset (Forgot Password)
 * Generic response prevents email enumeration.
 */
const requestPasswordReset = async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";

    if (!checkResetRateLimit(clientIp)) {
      return res.status(429).json({
        message:
          "Too many password reset attempts. Please wait 15 minutes before trying again.",
      });
    }

    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail });

    // Generic safe response to prevent user enumeration
    const genericResponse = {
      message:
        "If your email is registered in our administrative system, you will receive password reset instructions shortly.",
    };

    if (!admin || admin.status === "deactivated") {
      return res.status(200).json(genericResponse);
    }

    const { rawToken, hashedToken } = generateSecureToken();

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await admin.save();

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}`;

    const emailResult = await sendPasswordResetEmail({
      email: admin.email,
      name: admin.name,
      resetUrl,
    });

    // In dev mode (when SMTP credentials are missing), return resetUrl in response for easy local testing
    if (emailResult.mode === "dev") {
      return res.status(200).json({
        ...genericResponse,
        devResetUrl: resetUrl,
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    return res.status(500).json({
      message: "Could not process password reset request. Please try again later.",
    });
  }
};

/**
 * Verify Password Reset Token
 */
const verifyPasswordResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        valid: false,
        message: "Reset token is required.",
      });
    }

    const hashedToken = hashToken(token);

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("name email");

    if (!admin) {
      return res.status(400).json({
        valid: false,
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    return res.status(200).json({
      valid: true,
      email: admin.email,
      name: admin.name,
    });
  } catch (error) {
    console.error("verifyPasswordResetToken error:", error);
    return res.status(500).json({
      valid: false,
      message: "Could not verify reset token.",
    });
  }
};

/**
 * Complete Password Reset
 */
const completePasswordReset = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const hashedToken = hashToken(token);

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!admin) {
      return res.status(400).json({
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    admin.password = hashedPassword;
    admin.resetPasswordToken = null;
    admin.resetPasswordExpires = null;
    admin.passwordChangedAt = new Date(); // Invalidates any pre-existing JWTs

    await admin.save();

    return res.status(200).json({
      message:
        "Password has been successfully reset. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("completePasswordReset error:", error);
    return res.status(500).json({
      message: "Could not reset password. Please try again.",
    });
  }
};

/**
 * Get Team Members
 * Accessible to Super Admin and Admin.
 */
const getTeamMembers = async (req, res) => {
  try {
    const members = await Admin.find()
      .select("-password -resetPasswordToken -inviteToken")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      members,
    });
  } catch (error) {
    console.error("getTeamMembers error:", error);
    return res.status(500).json({
      message: "Could not fetch team members.",
    });
  }
};

/**
 * Invite Team Member
 * Super Admin can invite Admin or Editor.
 * Admin can only invite Editor.
 */
const inviteTeamMember = async (req, res) => {
  try {
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({
        message: "Name, email, and role are required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = role.toLowerCase().trim();

    if (!["superadmin", "admin", "editor"].includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role specified. Must be 'admin' or 'editor'.",
      });
    }

    // Role hierarchy check: only Super Admin can invite another Admin or Super Admin
    if (req.admin.role !== "superadmin" && (cleanRole === "admin" || cleanRole === "superadmin")) {
      return res.status(403).json({
        message:
          "Only Super Administrators can invite other Administrators. You may only invite Editors.",
      });
    }

    let existingMember = await Admin.findOne({ email: cleanEmail });

    if (existingMember) {
      if (existingMember.status === "active") {
        return res.status(400).json({
          message:
            "A team member with this email address is already active in the system.",
        });
      }
      // If invited but pending/expired, re-issue invite
    }

    const { rawToken, hashedToken } = generateSecureToken();
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    if (existingMember) {
      existingMember.name = name.trim();
      existingMember.role = cleanRole;
      existingMember.status = "invited";
      existingMember.inviteToken = hashedToken;
      existingMember.inviteExpires = inviteExpires;
      existingMember.invitedBy = req.admin.id;
      await existingMember.save();
    } else {
      existingMember = await Admin.create({
        name: name.trim(),
        email: cleanEmail,
        role: cleanRole,
        status: "invited",
        inviteToken: hashedToken,
        inviteExpires,
        invitedBy: req.admin.id,
      });
    }

    const inviteUrl = `${getFrontendUrl()}/accept-invite?token=${rawToken}`;

    const emailResult = await sendTeamInviteEmail({
      email: cleanEmail,
      name: name.trim(),
      role: cleanRole,
      inviteUrl,
      inviterName: req.admin.name || "Administrator",
    });

    return res.status(201).json({
      message: `Invitation successfully created for ${cleanEmail}.`,
      member: {
        id: existingMember._id,
        name: existingMember.name,
        email: existingMember.email,
        role: existingMember.role,
        status: existingMember.status,
        inviteExpires: existingMember.inviteExpires,
      },
      inviteUrl: emailResult.mode === "dev" ? inviteUrl : undefined,
    });
  } catch (error) {
    console.error("inviteTeamMember error:", error);
    return res.status(500).json({
      message: "Could not create team invitation.",
      error: error.message,
    });
  }
};

/**
 * Resend Invitation
 */
const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Admin.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Team member not found.",
      });
    }

    if (member.status !== "invited") {
      return res.status(400).json({
        message: "This team member has already activated their account.",
      });
    }

    // Role hierarchy check
    if (req.admin.role !== "superadmin" && (member.role === "admin" || member.role === "superadmin")) {
      return res.status(403).json({
        message: "Only Super Administrators can manage Administrator invitations.",
      });
    }

    const { rawToken, hashedToken } = generateSecureToken();
    member.inviteToken = hashedToken;
    member.inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    await member.save();

    const inviteUrl = `${getFrontendUrl()}/accept-invite?token=${rawToken}`;

    const emailResult = await sendTeamInviteEmail({
      email: member.email,
      name: member.name,
      role: member.role,
      inviteUrl,
      inviterName: req.admin.name || "Administrator",
    });

    return res.status(200).json({
      message: `Invitation resent to ${member.email}.`,
      inviteUrl: emailResult.mode === "dev" ? inviteUrl : undefined,
    });
  } catch (error) {
    console.error("resendInvitation error:", error);
    return res.status(500).json({
      message: "Could not resend invitation.",
    });
  }
};

/**
 * Verify Invitation Token
 */
const verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        valid: false,
        message: "Invitation token is required.",
      });
    }

    const hashedToken = hashToken(token);

    const member = await Admin.findOne({
      inviteToken: hashedToken,
      inviteExpires: { $gt: new Date() },
      status: "invited",
    }).select("name email role");

    if (!member) {
      return res.status(400).json({
        valid: false,
        message:
          "This invitation link is invalid or has expired. Please ask your administrator to send a new invitation.",
      });
    }

    return res.status(200).json({
      valid: true,
      name: member.name,
      email: member.email,
      role: member.role,
    });
  } catch (error) {
    console.error("verifyInviteToken error:", error);
    return res.status(500).json({
      valid: false,
      message: "Could not verify invitation token.",
    });
  }
};

/**
 * Accept Invitation & Set Password
 */
const acceptInvite = async (req, res) => {
  try {
    const { token, password, name } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const hashedToken = hashToken(token);

    const member = await Admin.findOne({
      inviteToken: hashedToken,
      inviteExpires: { $gt: new Date() },
      status: "invited",
    });

    if (!member) {
      return res.status(400).json({
        message:
          "This invitation link is invalid or has expired. Please request a new invitation.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (name && name.trim()) {
      member.name = name.trim();
    }

    member.password = hashedPassword;
    member.status = "active";
    member.inviteToken = null;
    member.inviteExpires = null;
    member.lastLogin = new Date();
    member.passwordChangedAt = new Date();

    await member.save();

    const jwtToken = jwt.sign(
      {
        id: member._id,
        role: member.role,
        email: member.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Invitation accepted. Welcome to the SaaSpin team!",
      token: jwtToken,
      admin: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
    });
  } catch (error) {
    console.error("acceptInvite error:", error);
    return res.status(500).json({
      message: "Could not complete account setup.",
    });
  }
};

/**
 * Update Team Member Role
 * Super Admin only.
 */
const updateTeamMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["superadmin", "admin", "editor"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role specified.",
      });
    }

    if (id === req.admin.id) {
      return res.status(400).json({
        message: "You cannot change your own role.",
      });
    }

    const member = await Admin.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Team member not found.",
      });
    }

    member.role = role;
    await member.save();

    return res.status(200).json({
      message: `Role updated to '${role}' for ${member.name}.`,
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
    });
  } catch (error) {
    console.error("updateTeamMemberRole error:", error);
    return res.status(500).json({
      message: "Could not update team member role.",
    });
  }
};

/**
 * Toggle Team Member Status (Activate / Deactivate)
 */
const toggleTeamMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "deactivated"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'active' or 'deactivated'.",
      });
    }

    if (id === req.admin.id) {
      return res.status(400).json({
        message: "You cannot change the status of your own account.",
      });
    }

    const member = await Admin.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Team member not found.",
      });
    }

    // Role hierarchy check: Admins cannot deactivate Super Admins or other Admins
    if (req.admin.role !== "superadmin" && (member.role === "admin" || member.role === "superadmin")) {
      return res.status(403).json({
        message: "Only Super Administrators can deactivate other Administrators.",
      });
    }

    // Safety check: Cannot deactivate the last active superadmin
    if (status === "deactivated" && member.role === "superadmin") {
      const activeSuperCount = await Admin.countDocuments({
        role: "superadmin",
        status: "active",
      });

      if (activeSuperCount <= 1) {
        return res.status(400).json({
          message:
            "Cannot deactivate the only active Super Administrator. Promote another member first.",
        });
      }
    }

    member.status = status;

    // If deactivating, invalidate their current JWT immediately
    if (status === "deactivated") {
      member.passwordChangedAt = new Date();
    }

    await member.save();

    return res.status(200).json({
      message: `Team member status set to '${status}'.`,
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
    });
  } catch (error) {
    console.error("toggleTeamMemberStatus error:", error);
    return res.status(500).json({
      message: "Could not update team member status.",
    });
  }
};

/**
 * Delete Team Member
 * Super Admin only.
 */
const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.admin.id) {
      return res.status(400).json({
        message: "You cannot delete your own account.",
      });
    }

    const member = await Admin.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Team member not found.",
      });
    }

    if (member.role === "superadmin") {
      const activeSuperCount = await Admin.countDocuments({
        role: "superadmin",
        status: "active",
      });

      if (activeSuperCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the only Super Administrator.",
        });
      }
    }

    await Admin.findByIdAndDelete(id);

    return res.status(200).json({
      message: `Team member ${member.name} (${member.email}) was deleted.`,
    });
  } catch (error) {
    console.error("deleteTeamMember error:", error);
    return res.status(500).json({
      message: "Could not delete team member.",
    });
  }
};

module.exports = {
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
};