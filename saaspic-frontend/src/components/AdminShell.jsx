"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    label: "Products & Categories",
    href: "/admin/products",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    label: "Deals",
    href: "/admin/deals",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <circle cx="7" cy="7" r=".5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Submissions",
    href: "/admin/submissions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: "Comparisons",
    href: "/admin/comparisons",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 3h5v5" />
        <path d="M8 21H3v-5" />
        <path d="M21 3l-7.5 7.5" />
        <path d="M3 21l7.5-7.5" />
      </svg>
    ),
  },
  {
    label: "Blogs",
    href: "/admin/blogs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Team Members",
    href: "/admin/team",
    roles: ["superadmin", "admin"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Affiliate Analytics",
    href: "/admin/affiliates",
    roles: ["superadmin", "admin"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [adminUser, setAdminUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function closeOnEscape(event) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("admin");
        if (saved) {
          setAdminUser(JSON.parse(saved));
        }
      } catch {
        // ignore JSON errors
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function isActive(href) {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    router.replace("/login");
    router.refresh();
  }

  // Determine current section title
  const currentSection =
    adminLinks.find((item) =>
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href)
    )?.label || "Administration";

  return (
    <div className={`admin-shell ${mobileMenuOpen ? "mobile-nav-open" : ""}`}>
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <Link
            href="/admin"
            className="admin-sidebar-brand"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="saaspin-logo" aria-hidden="true">
              <span className="saaspin-logo-ring">
                <span className="saaspin-logo-dot" />
              </span>
              <span className="saaspin-logo-letter">S</span>
            </span>
            <div className="admin-brand-text">
              <span>SaaS<strong>pin</strong></span>
              <small className="admin-brand-tag">ADMIN</small>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation" id="admin-navigation">
          <span className="admin-nav-section-title">NAVIGATION</span>
          {adminLinks
            .filter((item) => {
              if (!item.roles) return true;
              const role = adminUser?.role || "superadmin";
              return item.roles.includes(role);
            })
            .map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`admin-sidebar-link ${active ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="admin-sidebar-icon">{item.icon}</span>
                  <span className="admin-sidebar-label">{item.label}</span>
                  {active && <span className="admin-sidebar-indicator" aria-hidden="true" />}
                </Link>
              );
            })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-pill">
            <div className="admin-user-avatar">
              {(adminUser?.name || adminUser?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-info">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong>{adminUser?.name || "Administrator"}</strong>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background:
                      adminUser?.role === "superadmin"
                        ? "#f5f3ff"
                        : adminUser?.role === "editor"
                        ? "#ecfdf5"
                        : "#e6f7fa",
                    color:
                      adminUser?.role === "superadmin"
                        ? "#6d28d9"
                        : adminUser?.role === "editor"
                        ? "#047857"
                        : "#0e7490",
                  }}
                >
                  {adminUser?.role === "superadmin"
                    ? "Super Admin"
                    : adminUser?.role === "editor"
                    ? "Editor"
                    : "Admin"}
                </span>
              </div>
              <small>{adminUser?.email || "Signed in"}</small>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-sidebar-logout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ADMIN CONTENT */}
      <div className="admin-shell-content">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileMenuOpen((curr) => !curr)}
              aria-label="Toggle admin sidebar"
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-navigation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="admin-breadcrumbs">
              <Link href="/admin" className="admin-breadcrumb-home">Admin</Link>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-current">{currentSection}</span>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-topbar-link"
              title="Open public website in a new tab"
            >
              <span>View Public Site</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <div className="admin-topbar-user" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background:
                    adminUser?.role === "superadmin"
                      ? "#f5f3ff"
                      : adminUser?.role === "editor"
                      ? "#ecfdf5"
                      : "#e6f7fa",
                  color:
                    adminUser?.role === "superadmin"
                      ? "#6d28d9"
                      : adminUser?.role === "editor"
                      ? "#047857"
                      : "#0e7490",
                  border: `1px solid ${
                    adminUser?.role === "superadmin"
                      ? "#ddd6fe"
                      : adminUser?.role === "editor"
                      ? "#bbf7d0"
                      : "#b6e3eb"
                  }`,
                }}
              >
                {adminUser?.role === "superadmin"
                  ? "Super Admin"
                  : adminUser?.role === "editor"
                  ? "Editor"
                  : "Admin"}
              </span>
              <span className="admin-topbar-user-badge">LIVE</span>
            </div>
          </div>
        </header>

        <div className="admin-shell-main">
          {children}
        </div>
      </div>
    </div>
  );
}
