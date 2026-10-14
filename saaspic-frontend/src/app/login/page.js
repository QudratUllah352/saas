"use client";

import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // If already logged in, go directly to admin.
  useEffect(() => {
    async function checkExistingLogin() {
      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/admin/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.ok) {
          router.replace("/admin");
          return;
        }

        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
      } catch (error) {
        console.error(
          "Login verification failed:",
          error
        );
      }

      setChecking(false);
    }

    checkExistingLogin();
  }, [router]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid email or password."
        );
      }

      if (!data.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(data.admin || {})
      );

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setError(
        error.message ||
          "Could not sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="saaspin-login-page">
        <div className="saaspin-login-card">
          <p>Checking session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="saaspin-login-page">
      <div className="saaspin-login-card">

        <div className="saaspin-login-brand">
          SaaSpin
        </div>

        <span className="saaspin-login-label">
          ADMIN
        </span>

        <h1>Admin Login</h1>

        <p className="saaspin-login-description">
          Sign in to access the administration
          dashboard.
        </p>

        <form
          onSubmit={handleSubmit}
          className="saaspin-login-form"
        >
          <div className="saaspin-login-field">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="Enter admin email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="saaspin-login-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="password" style={{ margin: 0 }}>
                Password
              </label>
              <Link
                href="/forgot-password"
                className="saaspin-login-forgot-link"
                style={{ fontSize: "13px", color: "#0E7490", textDecoration: "none", fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div
              className="saaspin-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="saaspin-login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}