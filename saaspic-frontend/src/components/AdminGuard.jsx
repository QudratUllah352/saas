"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function AdminGuard({ children }) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      const token =
        localStorage.getItem("adminToken");

      // No token -> login
      if (!token) {
        setAuthorized(false);
        setChecking(false);

        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/admin/me`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },

            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          }
        );

        // Temporary failures must not erase a potentially valid session.
        if (!response.ok && response.status !== 401 && response.status !== 403) {
          throw new Error("Admin service temporarily unavailable");
        }
        // Invalid or expired token
        if (!response.ok) {
          localStorage.removeItem(
            "adminToken"
          );

          localStorage.removeItem(
            "admin"
          );

          setAuthorized(false);

          router.replace("/login");
          return;
        }

        // Valid admin
        setAuthorized(true);
      } catch (error) {
        console.error(
          "Admin authentication check failed:",
          error
        );

        setAuthorized(false);
        setUnavailable(true);
      } finally {
        setChecking(false);
      }
    }

    verifyAdmin();
  }, [router]);

  if (checking) {
    return (
      <div className="admin-auth-loading">
        <div>
          <strong>SaaSpin Admin</strong>
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (unavailable) {
    return <div className="admin-auth-loading" role="alert"><div>
      <strong>Admin service is temporarily unavailable</strong>
      <p>Please retry when the backend is available.</p>
      <button type="button" onClick={() => window.location.reload()}>Try again</button>
    </div></div>;
  }

  if (!authorized) {
    return null;
  }

  return children;
}
