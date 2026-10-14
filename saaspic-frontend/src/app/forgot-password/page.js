"use client";

import { API_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDevResetUrl(null);

      const response = await fetch(`${API_URL}/admin/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.status === 429) {
        throw new Error(
          data.message ||
            "Too many reset attempts from this connection. Please wait 15 minutes before trying again."
        );
      }

      if (!response.ok && response.status !== 200) {
        throw new Error(data.message || "Could not process password reset request.");
      }

      setSuccess(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="saaspin-login-page">
      <div className="saaspin-login-card">
        <div className="saaspin-login-brand">SaaSpin</div>
        <span className="saaspin-login-label">ACCOUNT RECOVERY</span>

        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#334155", margin: "0 0 8px" }}>
          Forgot Password?
        </h1>

        <p className="saaspin-login-description" style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px" }}>
          Enter the email address associated with your administrator account and we will send you secure reset instructions.
        </p>

        {success ? (
          <div style={{ display: "grid", gap: "16px" }}>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "16px",
                borderRadius: "10px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
              role="status"
            >
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>Check your inbox</div>
              If your email is registered in our administrative system, you will receive password reset instructions shortly. The link expires in 1 hour.
            </div>

            {devResetUrl && (
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                }}
              >
                <strong style={{ display: "block", marginBottom: "4px" }}>Local Dev Quick Link:</strong>
                <a
                  href={devResetUrl}
                  style={{
                    color: "#0e7490",
                    fontWeight: 600,
                    textDecoration: "underline",
                    wordBreak: "break-all",
                  }}
                >
                  Proceed to Reset Password Page →
                </a>
              </div>
            )}

            <div style={{ marginTop: "8px", textAlign: "center" }}>
              <Link
                href="/login"
                className="saaspin-login-button"
                style={{
                  display: "inline-block",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "12px 20px",
                  background: "#0E7490",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="saaspin-login-form">
            <div className="saaspin-login-field">
              <label htmlFor="email">Admin Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="saaspin-login-error" role="alert" style={{ marginBottom: "16px" }}>
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
                marginTop: "8px",
              }}
            >
              {loading ? "Sending instructions..." : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <Link
                href="/login"
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

