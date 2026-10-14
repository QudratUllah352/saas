"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function AdminGuard({ children }) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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
          }
        );

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

  if (!authorized) {
    return null;
  }

  return children;
}