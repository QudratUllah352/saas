"use client";

import { API_URL } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setVerifying(false);
        setTokenValid(false);
        setError("No reset token provided. Please request a new password reset link.");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/admin/reset-password/verify?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
          setAdminName(data.name || "Administrator");
        } else {
          setTokenValid(false);
          setError(
            data.message ||
              "This password reset link is invalid, expired, or has already been used."
          );
        }
      } catch (err) {
        setTokenValid(false);
        setError("Could not verify reset token. Please check your internet connection.");
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  // Password strength score
  function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: "", color: "#e2e8f0" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score === 3) return { score: 2, label: "Medium", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#10b981" };
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card" style={{ textAlign: "center" }}>
          <div className="saaspin-login-brand">SaaSpin</div>
          <p style={{ color: "#64748b", margin: "20px 0" }}>Verifying security token...</p>
        </div>
      </main>
    );
  }

  if (!tokenValid) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card">
          <div className="saaspin-login-brand">SaaSpin</div>
          <span className="saaspin-login-label">LINK EXPIRED</span>

          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#334155", margin: "0 0 12px" }}>
            Invalid or Expired Link
          </h1>

          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px" }}>
            {error || "For security reasons, password reset links expire after 1 hour and can only be used once."}
          </p>

          <Link
            href="/forgot-password"
            className="saaspin-login-button"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              padding: "12px",
              background: "#0E7490",
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Request New Reset Link
          </Link>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link href="/login" style={{ color: "#64748b", fontSize: "13px", textDecoration: "none" }}>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card">
          <div className="saaspin-login-brand">SaaSpin</div>
          <span className="saaspin-login-label">SECURITY UPDATED</span>

          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#166534", margin: "0 0 8px" }}>
            Password Reset Complete
          </h1>

          <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px" }}>
            Your administrator password has been updated securely. Any active sessions on other devices have been invalidated.
          </p>

          <Link
            href="/login"
            className="saaspin-login-button"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              padding: "12px",
              background: "#0E7490",
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Log In Now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="saaspin-login-page">
      <div className="saaspin-login-card">
        <div className="saaspin-login-brand">SaaSpin</div>
        <span className="saaspin-login-label">SET NEW PASSWORD</span>

        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#334155", margin: "0 0 6px" }}>
          Create New Password
        </h1>

        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 20px" }}>
          Welcome back{adminName ? `, ${adminName}` : ""}. Choose a secure password for your administrative account.
        </p>

        <form onSubmit={handleSubmit} className="saaspin-login-form">
          <div className="saaspin-login-field">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
            />

            {password && (
              <div style={{ marginTop: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    height: "4px",
                    borderRadius: "2px",
                    background: "#e2e8f0",
                    overflow: "hidden",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      width: `${(strength.score / 3) * 100}%`,
                      background: strength.color,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                  <span>Password strength</span>
                  <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <div className="saaspin-login-field" style={{ marginTop: "16px" }}>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="saaspin-login-error" role="alert" style={{ marginTop: "16px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="saaspin-login-button"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#0E7490",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "20px",
            }}
          >
            {loading ? "Updating password..." : "Reset Password"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="saaspin-login-page">
          <div className="saaspin-login-card" style={{ textAlign: "center" }}>
            <div className="saaspin-login-brand">SaaSpin</div>
            <p style={{ color: "#64748b" }}>Loading...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

