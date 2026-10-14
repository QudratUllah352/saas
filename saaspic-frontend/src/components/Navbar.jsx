"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { categories as mainCategories } from '@/lib/categories';
const categories = [
  { name: 'All Deals', href: '/deals', icon: '⚡' },
  ...mainCategories.map((category) => ({ ...category, href: '/deals?category=' + category.slug })),
];

export default function Navbar() {
  const pathname = usePathname();
  const [dealsOpen, setDealsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDealsOpen, setMobileDealsOpen] = useState(false);

  // =========================================================
  // CLOSE ALL MENUS
  // =========================================================
  function closeMenus() {
    setDealsOpen(false);
    setMobileOpen(false);
    setMobileDealsOpen(false);
  }

  const isDealsActive = pathname === "/deals" || pathname.startsWith("/deals/");
  const isReviewsActive = pathname === "/reviews" || pathname.startsWith("/reviews/");
  const isComparisonsActive = pathname === "/comparisons" || pathname.startsWith("/comparisons/");
  const isBlogsActive = pathname === "/blogs" || pathname.startsWith("/blogs/");

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* =================================================
            LOGO
        ================================================= */}
        <Link
          href="/"
          className="navbar-brand"
          onClick={closeMenus}
        >
          <span
            className="saaspin-logo"
            aria-hidden="true"
          >
            <span className="saaspin-logo-ring">
              <span className="saaspin-logo-dot" />
            </span>
            <span className="saaspin-logo-letter">S</span>
          </span>

          <span className="navbar-brand-name">
            SaaS<span>pin</span>
          </span>
        </Link>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}
        <nav className="navbar-links" aria-label="Main Navigation">
          {/* DEALS DROPDOWN */}
          <div
            className="navbar-dropdown"
            onMouseEnter={() => setDealsOpen(true)}
            onMouseLeave={() => setDealsOpen(false)}
          >
            <button
              type="button"
              className={`navbar-dropdown-button ${isDealsActive ? "active" : ""}`}
              onClick={() => setDealsOpen((current) => !current)}
              aria-expanded={dealsOpen}
              aria-haspopup="true"
            >
              <span>Deals</span>
              <span
                className={
                  dealsOpen
                    ? "nav-arrow open"
                    : "nav-arrow"
                }
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {/* CATEGORY DROPDOWN */}
            {dealsOpen && (
              <div className="navbar-dropdown-menu" role="menu">
                <div className="navbar-dropdown-header">
                  <span>Browse by Category</span>
                </div>
                <div className="navbar-dropdown-grid">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      onClick={closeMenus}
                      className="navbar-dropdown-item"
                      role="menuitem"
                    >
                      <span className="navbar-dropdown-icon">{category.icon}</span>
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* REVIEWS */}
          <Link
            href="/reviews"
            onClick={closeMenus}
            className={isReviewsActive ? "active" : ""}
          >
            Reviews
          </Link>

          {/* COMPARISONS */}
          <Link
            href="/comparisons"
            onClick={closeMenus}
            className={isComparisonsActive ? "active" : ""}
          >
            Comparisons
          </Link>

          {/* BLOG */}
          <Link
            href="/blogs"
            onClick={closeMenus}
            className={isBlogsActive ? "active" : ""}
          >
            Blog
          </Link>
        </nav>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}
        <div className="navbar-actions">
          {/* SEARCH */}
          <Link
            href="/search"
            className="navbar-search"
            aria-label="Search software, deals and reviews"
            onClick={closeMenus}
            title="Search software"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          {/* SUBMIT DEAL */}
          <Link
            href="/submit-deal"
            className="navbar-submit"
            onClick={closeMenus}
          >
            <span className="navbar-submit-sparkle">✨</span>
            <span>Submit Deal</span>
          </Link>
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}
        <button
          type="button"
          className={
            mobileOpen
              ? "navbar-toggle open"
              : "navbar-toggle"
          }
          onClick={() => setMobileOpen((current) => !current)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ===================================================
          MOBILE MENU & BACKDROP
      =================================================== */}
      {mobileOpen && (
        <>
          <div
            className="navbar-mobile-backdrop"
            onClick={closeMenus}
            aria-hidden="true"
          />

          <div className="navbar-mobile" role="dialog" aria-modal="true">
            <div className="navbar-mobile-inner">
              {/* MOBILE SEARCH QUICK LINK */}
              <div className="navbar-mobile-search-box">
                <Link
                  href="/search"
                  className="navbar-mobile-search-btn"
                  onClick={closeMenus}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16.5 16.5L21 21" />
                  </svg>
                  <span>Search software & deals...</span>
                </Link>
              </div>

              {/* MOBILE DEALS ACCORDION */}
              <div className="navbar-mobile-item">
                <button
                  type="button"
                  className="navbar-mobile-deals"
                  onClick={() => setMobileDealsOpen((current) => !current)}
                  aria-expanded={mobileDealsOpen}
                >
                  <span className="navbar-mobile-link-text">Deals</span>
                  <span className="navbar-mobile-indicator">
                    {mobileDealsOpen ? "−" : "+"}
                  </span>
                </button>

                {mobileDealsOpen && (
                  <div className="navbar-mobile-categories">
                    {categories.map((category) => (
                      <Link
                        key={category.name}
                        href={category.href}
                        onClick={closeMenus}
                        className="navbar-mobile-category-item"
                      >
                        <span className="navbar-mobile-cat-icon">{category.icon}</span>
                        <span>{category.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* REVIEWS */}
              <Link
                href="/reviews"
                onClick={closeMenus}
                className={`navbar-mobile-navlink ${isReviewsActive ? "active" : ""}`}
              >
                Reviews
              </Link>

              {/* COMPARISONS */}
              <Link
                href="/comparisons"
                onClick={closeMenus}
                className={`navbar-mobile-navlink ${isComparisonsActive ? "active" : ""}`}
              >
                Comparisons
              </Link>

              {/* BLOG */}
              <Link
                href="/blogs"
                onClick={closeMenus}
                className={`navbar-mobile-navlink ${isBlogsActive ? "active" : ""}`}
              >
                Blog
              </Link>

              {/* DIVIDER */}
              <div className="navbar-mobile-divider" />

              {/* SUBMIT DEAL */}
              <Link
                href="/submit-deal"
                className="navbar-mobile-submit"
                onClick={closeMenus}
              >
                Submit SaaS Deal →
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
