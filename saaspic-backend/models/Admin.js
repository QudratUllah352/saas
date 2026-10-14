const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        // Password is only mandatory once the account is active
        return this.status === "active";
      },
    },

    // Role-based permissions
    role: {
      type: String,
      enum: ["superadmin", "admin", "editor"],
      default: "admin",
    },

    // Lifecycle status
    status: {
      type: String,
      enum: ["active", "invited", "deactivated"],
      default: "active",
    },

    // Single-use, expiring invitation tokens (stored as SHA-256 hash)
    inviteToken: {
      type: String,
      default: null,
    },

    inviteExpires: {
      type: Date,
      default: null,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Single-use, expiring password reset tokens (stored as SHA-256 hash)
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Security timestamp to invalidate outstanding JWTs after password change
    passwordChangedAt: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Checks if the user changed their password after a given JWT was issued.
 * @param {number} jwtIat - Token issued-at timestamp in seconds.
 * @returns {boolean}
 */
adminSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtIat < changedTimestamp;
  }
  return false;
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;