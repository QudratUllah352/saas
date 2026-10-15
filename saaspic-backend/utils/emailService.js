const nodemailer = require("nodemailer");

/**
 * Creates nodemailer transporter if SMTP credentials are provided in env.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = port === 465;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP must be configured for production email delivery.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: process.env.NODE_ENV === "production" && !secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a password reset email.
 */
async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || "SaaSpin <no-reply@saaspin.com>";

  const subject = "Reset your SaaSpin account password";
  const text = `Hello ${name || "Admin"},\n\nA password reset request was requested for your SaaSpin account.\n\nPlease reset your password using the following link (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email. Your password will remain unchanged.\n\nSaaSpin Security Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5FBFC; padding: 36px 20px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0E7490, #155E75); color: #ffffff; font-size: 20px; font-weight: 800; text-align: center;">S</span>
        <h2 style="color: #0F172A; margin: 14px 0 6px; font-size: 24px; font-weight: 800;">Password Reset Request</h2>
        <p style="color: #64748B; font-size: 14px; margin: 0;">SaaSpin Administrative Access</p>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; padding: 32px 28px; border: 1px solid #E0F2F5; box-shadow: 0 4px 18px rgba(14, 116, 144, 0.05);">
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${name || "there"}</strong>,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          We received a request to reset the password for your SaaSpin account associated with <strong>${email}</strong>.
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Click the button below to choose a new password. This link is single-use and will expire in <strong>1 hour</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #0E7490; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(14, 116, 144, 0.25);">Reset Password</a>
        </div>

        <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          If the button doesn't work, copy and paste this URL into your browser:<br />
          <a href="${resetUrl}" style="color: #0E7490; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
        <p style="margin: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="margin: 4px 0 0;">© ${new Date().getFullYear()} SaaSpin. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log("==========================================================");
    console.log("[EMAIL DEV MODE - SMTP not configured in .env]");
    console.log(`Password reset requested for: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("==========================================================");
    return { success: true, mode: "dev", resetUrl };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  });

  return { success: true, mode: "smtp" };
}

/**
 * Sends a team invitation email.
 */
async function sendTeamInviteEmail({ email, name, role, inviteUrl, inviterName }) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || "SaaSpin <no-reply@saaspin.com>";

  const roleLabel =
    role === "superadmin"
      ? "Super Administrator"
      : role === "admin"
      ? "Administrator"
      : "Editor";

  const subject = `You've been invited to join SaaSpin as an ${roleLabel}`;
  const text = `Hello ${name || "there"},\n\n${inviterName || "A team administrator"} has invited you to join the SaaSpin admin team as an ${roleLabel}.\n\nPlease accept your invitation and set up your password here (expires in 48 hours):\n${inviteUrl}\n\nSaaSpin Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5FBFC; padding: 36px 20px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0E7490, #155E75); color: #ffffff; font-size: 20px; font-weight: 800; text-align: center;">S</span>
        <h2 style="color: #0F172A; margin: 14px 0 6px; font-size: 24px; font-weight: 800;">Team Invitation</h2>
        <p style="color: #64748B; font-size: 14px; margin: 0;">Join the SaaSpin Editorial & Operations Team</p>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; padding: 32px 28px; border: 1px solid #E0F2F5; box-shadow: 0 4px 18px rgba(14, 116, 144, 0.05);">
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${name || "there"}</strong>,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          <strong>${inviterName || "An administrator"}</strong> has invited you to collaborate on SaaSpin with the role of <strong style="color: #0E7490;">${roleLabel}</strong>.
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Click below to accept your invitation, create your password, and activate your personal dashboard access. This link is single-use and will expire in <strong>48 hours</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #0E7490; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(14, 116, 144, 0.25);">Accept Invitation</a>
        </div>

        <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${inviteUrl}" style="color: #0E7490; word-break: break-all;">${inviteUrl}</a>
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
        <p style="margin: 0;">If you were not expecting this invitation, you can ignore this message.</p>
        <p style="margin: 4px 0 0;">© ${new Date().getFullYear()} SaaSpin. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log("==========================================================");
    console.log("[EMAIL DEV MODE - SMTP not configured in .env]");
    console.log(`Team invitation for: ${email} (${roleLabel})`);
    console.log(`Invite URL: ${inviteUrl}`);
    console.log("==========================================================");
    return { success: true, mode: "dev", inviteUrl };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  });

  return { success: true, mode: "smtp" };
}

module.exports = {
  sendPasswordResetEmail,
  sendTeamInviteEmail,
};

