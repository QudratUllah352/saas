"use client";

import { API_URL } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteDetails, setInviteDetails] = useState({
    name: "",
    email: "",
    role: "editor",
  });

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyInvite() {
      if (!token) {
        setVerifying(false);
        setInviteValid(false);
        setError("Missing invitation token. Please check your invitation link.");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/admin/invite/verify?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setInviteValid(true);
          setInviteDetails({
            name: data.name || "",
            email: data.email || "",
            role: data.role || "editor",
          });
          setName(data.name || "");
        } else {
          setInviteValid(false);
          setError(
            data.message ||
              "This invitation has expired or has already been accepted."
          );
        }
      } catch (err) {
        setInviteValid(false);
        setError("Could not verify invitation. Please check your internet connection.");
      } finally {
        setVerifying(false);
      }
    }

    verifyInvite();
  }, [token]);

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

    if (!name.trim()) {
      setError("Please provide your full name.");
      return;
    }

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

      const response = await fetch(`${API_URL}/admin/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept invitation.");
      }

      // Automatically store session token and admin details
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("admin", JSON.stringify(data.admin || {}));
      }

      setSuccess(true);

      // Redirect to admin dashboard after short delay
      setTimeout(() => {
        router.replace("/admin");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err.message || "Could not complete account activation.");
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card" style={{ textAlign: "center" }}>
          <div className="saaspin-login-brand">SaaSpin</div>
          <p style={{ color: "#64748b", margin: "20px 0" }}>Verifying invitation...</p>
        </div>
      </main>
    );
  }

  if (!inviteValid) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card">
          <div className="saaspin-login-brand">SaaSpin</div>
          <span className="saaspin-login-label">INVITATION EXPIRED</span>

          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#334155", margin: "0 0 12px" }}>
            Invitation Expired or Invalid
          </h1>

          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px" }}>
            {error || "This invitation link is no longer valid. Invitations expire after 48 hours. Please ask your administrator to send a new invitation."}
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
            Go to Admin Login
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card" style={{ textAlign: "center" }}>
          <div className="saaspin-login-brand">SaaSpin</div>
          <span className="saaspin-login-label">WELCOME ABOARD</span>

          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#166534", margin: "0 0 8px" }}>
            Account Activated!
          </h1>

          <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px" }}>
            Welcome to SaaSpin. Logging you into the administrative dashboard...
          </p>

          <div style={{ color: "#0E7490", fontWeight: 600, fontSize: "14px" }}>
            Redirecting to Admin...
          </div>
        </div>
      </main>
    );
  }

  const roleDisplay =
    inviteDetails.role === "superadmin"
      ? "Super Administrator"
      : inviteDetails.role === "admin"
      ? "Administrator"
      : "Editor";

  return (
    <main className="saaspin-login-page">
      <div className="saaspin-login-card">
        <div className="saaspin-login-brand">SaaSpin</div>
        <span className="saaspin-login-label">TEAM INVITATION</span>

        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#334155", margin: "0 0 6px" }}>
          Join SaaSpin Team
        </h1>

        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 20px" }}>
          You have been invited to join as an <strong>{roleDisplay}</strong>. Set up your profile and password to activate your account.
        </p>

        <form onSubmit={handleSubmit} className="saaspin-login-form">
          <div className="saaspin-login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={inviteDetails.email}
              disabled
              style={{ background: "#f8fafc", color: "#64748b" }}
            />
          </div>

          <div className="saaspin-login-field" style={{ marginTop: "14px" }}>
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
            />
          </div>

          <div className="saaspin-login-field" style={{ marginTop: "14px" }}>
            <label htmlFor="password">Create Password</label>
            <input
              id="password"
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

          <div className="saaspin-login-field" style={{ marginTop: "14px" }}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
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
            {loading ? "Activating account..." : "Accept & Activate Account"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
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
      <AcceptInviteForm />
    </Suspense>
  );
}

