"use client";

import { API_URL } from "@/lib/api";

import {
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";


export default function AdminDashboard() {
    const router = useRouter();

    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,

        deals: 0,
        products: 0,
        reviews: 0,
        comparisons: 0,
        blogs: 0,
    });

    const [admin, setAdmin] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem(
                        "adminToken"
                    );

                const savedAdmin =
                    localStorage.getItem(
                        "admin"
                    );

                // No token -> login
                if (!token) {
                    router.replace(
                        "/login"
                    );

                    return;
                }

                // Load saved admin information
                if (savedAdmin) {
                    try {
                        setAdmin(
                            JSON.parse(savedAdmin)
                        );
                    } catch {
                        localStorage.removeItem(
                            "admin"
                        );
                    }
                }

                // =====================================
                // LOAD DASHBOARD DATA
                // =====================================

                const [
                    submissionResponse,
                    dealResponse,
                    productResponse,
                    reviewResponse,
                    comparisonResponse,
                    blogResponse,
                ] = await Promise.all([
                    // Deal submissions
                    fetch(
                        `${API_URL}/deal-submissions`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    ),

                    // All deals - admin
                    fetch(
                        `${API_URL}/deals/admin/all`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    ),

                    // Products
                    fetch(
                        `${API_URL}/products`
                    ),

                    // All reviews - admin
                    fetch(
                        `${API_URL}/reviews/admin/all`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    ),

                    // All comparisons - admin
                    fetch(
                        `${API_URL}/comparisons/admin/all`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    ),

                    // All blogs - admin
                    fetch(
                        `${API_URL}/blogs/admin/all`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    ),
                ]);

                // =====================================
                // CHECK AUTH
                // =====================================

                const protectedResponses = [
                    submissionResponse,
                    dealResponse,
                    reviewResponse,
                    comparisonResponse,
                    blogResponse,
                ];

                const authFailed =
                    protectedResponses.some(
                        (response) =>
                            response.status === 401 ||
                            response.status === 403
                    );

                if (authFailed) {
                    localStorage.removeItem(
                        "adminToken"
                    );

                    localStorage.removeItem(
                        "admin"
                    );

                    router.replace(
                        "/login"
                    );

                    return;
                }

                // =====================================
                // CHECK API ERRORS
                // =====================================

                const allResponses = [
                    submissionResponse,
                    dealResponse,
                    productResponse,
                    reviewResponse,
                    comparisonResponse,
                    blogResponse,
                ];

                const failedResponse =
                    allResponses.find(
                        (response) =>
                            !response.ok
                    );

                if (failedResponse) {
                    throw new Error(
                        `Could not load dashboard information. API returned ${failedResponse.status}.`
                    );
                }

                // =====================================
                // CONVERT RESPONSES TO JSON
                // =====================================

                const [
                    submissions,
                    deals,
                    products,
                    reviews,
                    comparisons,
                    blogs,
                ] = await Promise.all([
                    submissionResponse.json(),
                    dealResponse.json(),
                    productResponse.json(),
                    reviewResponse.json(),
                    comparisonResponse.json(),
                    blogResponse.json(),
                ]);

                // =====================================
                // UPDATE DASHBOARD COUNTS
                // =====================================

                const safeSubmissions =
                    Array.isArray(submissions)
                        ? submissions
                        : [];

                setStats({
                    pending:
                        safeSubmissions.filter(
                            (item) =>
                                item.status ===
                                "pending"
                        ).length,

                    approved:
                        safeSubmissions.filter(
                            (item) =>
                                item.status ===
                                "approved"
                        ).length,

                    rejected:
                        safeSubmissions.filter(
                            (item) =>
                                item.status ===
                                "rejected"
                        ).length,

                    deals:
                        Array.isArray(deals)
                            ? deals.length
                            : 0,

                    products:
                        Array.isArray(products)
                            ? products.length
                            : 0,

                    reviews:
                        Array.isArray(reviews)
                            ? reviews.length
                            : 0,

                    comparisons:
                        Array.isArray(
                            comparisons
                        )
                            ? comparisons.length
                            : 0,

                    blogs:
                        Array.isArray(blogs)
                            ? blogs.length
                            : 0,
                });
            } catch (error) {
                console.error(
                    "Dashboard error:",
                    error
                );

                setError(
                    error.message ||
                    "Could not load dashboard."
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [router]);

    return (
            

            <main className="admin-dashboard">

                <div className="admin-dashboard-container">

                    {/* =================================
              HEADER
          ================================== */}

                    <div className="admin-dashboard-header">

                        <div>
                            <span className="admin-dashboard-label">
                                ADMIN DASHBOARD
                            </span>

                            <h1>
                                Welcome
                                {admin?.name
                                    ? `, ${admin.name}`
                                    : ""}
                            </h1>

                            <p>
                                Manage SaaSpin products,
                                deals, submissions,
                                reviews, comparisons and
                                blogs.
                            </p>
                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (
                        <div className="admin-error" role="alert">
                            {error}
                        </div>
                    )}


                    {/* LOADING */}

                    {loading ? (
                        <p>
                            Loading dashboard...
                        </p>
                    ) : (
                        <>

                            {/* =============================
                  CONTENT COUNTS
              ============================== */}

                            <section className="admin-dashboard-section">

                                <div className="admin-section-heading">

                                    <h2>
                                        Content Overview
                                    </h2>

                                    <p>
                                        Current content stored
                                        in SaaSpin.
                                    </p>

                                </div>


                                <div className="admin-stats">

                                    <Link
                                        href="/admin/products"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Products
                                        </span>

                                        <strong>
                                            {stats.products}
                                        </strong>

                                        <p>
                                            SaaS products
                                        </p>
                                    </Link>


                                    <Link
                                        href="/admin/deals"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Deals
                                        </span>

                                        <strong>
                                            {stats.deals}
                                        </strong>

                                        <p>
                                            Manage SaaS deals
                                        </p>
                                    </Link>


                                    <Link
                                        href="/admin/reviews"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Reviews
                                        </span>

                                        <strong>
                                            {stats.reviews}
                                        </strong>

                                        <p>
                                            Editorial reviews
                                        </p>
                                    </Link>


                                    <Link
                                        href="/admin/comparisons"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Comparisons
                                        </span>

                                        <strong>
                                            {stats.comparisons}
                                        </strong>

                                        <p>
                                            Product comparisons
                                        </p>
                                    </Link>


                                    <Link
                                        href="/admin/blogs"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Blogs
                                        </span>

                                        <strong>
                                            {stats.blogs}
                                        </strong>

                                        <p>
                                            Published and draft
                                            articles
                                        </p>
                                    </Link>
                                    <Link
                                        href="/admin/affiliates"
                                        className="admin-affiliate-link"
                                    >
                                        <span className="admin-affiliate-icon">
                                            $
                                        </span>

                                        <div>
                                            <strong>Affiliate Marketing</strong>
                                            <small>
                                                Manage affiliate links and view click statistics
                                            </small>
                                        </div>

                                        <span className="admin-affiliate-arrow">
                                            →
                                        </span>
                                    </Link>
                                </div>

                            </section>


                            {/* =============================
                  SUBMISSION STATUS
              ============================== */}

                            <section className="admin-dashboard-section">

                                <div className="admin-section-heading">

                                    <h2>
                                        Deal Submissions
                                    </h2>

                                    <p>
                                        Review the current
                                        submission status.
                                    </p>

                                </div>


                                <div className="admin-stats">

                                    <Link
                                        href="/admin/submissions"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Pending
                                        </span>

                                        <strong>
                                            {stats.pending}
                                        </strong>

                                        <p>
                                            Waiting for review
                                        </p>
                                    </Link>


                                    <Link
                                        href="/admin/submissions"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Approved
                                        </span>

                                        <strong>
                                            {stats.approved}
                                        </strong>

                                        <p>
                                            Approved submissions
                                        </p>
                                    </Link>


                                    <Link
                                        href="/admin/submissions"
                                        className="admin-stat-card"
                                    >
                                        <span>
                                            Rejected
                                        </span>

                                        <strong>
                                            {stats.rejected}
                                        </strong>

                                        <p>
                                            Rejected submissions
                                        </p>
                                    </Link>

                                </div>

                            </section>


                            {/* =============================
                  QUICK ACTIONS
              ============================== */}

                            <section className="admin-management">

                                <div className="admin-section-heading">

                                    <h2>
                                        Quick Actions
                                    </h2>

                                    <p>
                                        Create new SaaSpin
                                        content.
                                    </p>

                                </div>


                                <div className="admin-management-grid">

                                    {/* PRODUCT */}

                                    <Link
                                        href="/admin/products/new"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            📦
                                        </div>

                                        <h3>
                                            Add Product
                                        </h3>

                                        <p>
                                            Add a new SaaS
                                            product to MongoDB.
                                        </p>

                                        <span>
                                            Add product →
                                        </span>
                                    </Link>


                                    {/* REVIEW */}

                                    <Link
                                        href="/admin/reviews/new"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            ⭐
                                        </div>

                                        <h3>
                                            Create Review
                                        </h3>

                                        <p>
                                            Write a review or
                                            generate a draft
                                            with AI.
                                        </p>

                                        <span>
                                            Create review →
                                        </span>
                                    </Link>


                                    {/* COMPARISON */}

                                    <Link
                                        href="/admin/comparisons/new"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            ⚖️
                                        </div>

                                        <h3>
                                            Create Comparison
                                        </h3>

                                        <p>
                                            Compare two SaaS
                                            products manually
                                            or with AI.
                                        </p>

                                        <span>
                                            Create comparison →
                                        </span>
                                    </Link>


                                    {/* BLOG */}

                                    <Link
                                        href="/admin/blogs/new"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            ✍️
                                        </div>

                                        <h3>
                                            Create Blog
                                        </h3>

                                        <p>
                                            Write an article or
                                            generate a draft
                                            with AI.
                                        </p>

                                        <span>
                                            Create blog →
                                        </span>
                                    </Link>

                                </div>

                            </section>


                            {/* =============================
                  MANAGEMENT
              ============================== */}

                            <section className="admin-management">

                                <div className="admin-section-heading">

                                    <h2>
                                        Management
                                    </h2>

                                    <p>
                                        Manage all SaaSpin
                                        content.
                                    </p>

                                </div>


                                <div className="admin-management-grid">

                                    {/* SUBMISSIONS */}

                                    <Link
                                        href="/admin/submissions"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            📥
                                        </div>

                                        <h3>
                                            Deal Submissions
                                        </h3>

                                        <p>
                                            Review, publish or
                                            reject submitted
                                            SaaS deals.
                                        </p>

                                        <span>
                                            Manage submissions →
                                        </span>
                                    </Link>


                                    {/* PRODUCTS */}

                                    <Link
                                        href="/admin/products"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            📦
                                        </div>

                                        <h3>
                                            Products
                                        </h3>

                                        <p>
                                            Add, edit and manage
                                            SaaS products.
                                        </p>

                                        <span>
                                            Manage products →
                                        </span>
                                    </Link>


                                    {/* DEALS */}

                                    <Link
                                        href="/admin/deals"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            🏷️
                                        </div>

                                        <h3>
                                            Deals
                                        </h3>

                                        <p>
                                            Manage active and
                                            inactive SaaS deals.
                                        </p>

                                        <span>
                                            Manage deals →
                                        </span>
                                    </Link>


                                    {/* REVIEWS */}

                                    <Link
                                        href="/admin/reviews"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            ⭐
                                        </div>

                                        <h3>
                                            Reviews
                                        </h3>

                                        <p>
                                            Create, edit,
                                            publish and manage
                                            product reviews.
                                        </p>

                                        <span>
                                            Manage reviews →
                                        </span>
                                    </Link>


                                    {/* COMPARISONS */}

                                    <Link
                                        href="/admin/comparisons"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            ⚖️
                                        </div>

                                        <h3>
                                            Comparisons
                                        </h3>

                                        <p>
                                            Create and manage
                                            SaaS product
                                            comparisons.
                                        </p>

                                        <span>
                                            Manage comparisons →
                                        </span>
                                    </Link>


                                    {/* BLOGS */}

                                    <Link
                                        href="/admin/blogs"
                                        className="admin-management-card"
                                    >
                                        <div className="admin-management-icon">
                                            📝
                                        </div>

                                        <h3>
                                            Blogs
                                        </h3>

                                        <p>
                                            Create, edit,
                                            publish and manage
                                            SaaSpin articles.
                                        </p>

                                        <span>
                                            Manage blogs →
                                        </span>
                                    </Link>

                                </div>

                            </section>

                        </>
                    )}

                </div>

            </main>

    );
}
