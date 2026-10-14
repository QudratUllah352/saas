"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import AdminRecordTable from "@/components/AdminRecordTable";
import "./analytics.css";

const number = (value) => Number(value || 0).toLocaleString();
const statuses = { missing: "Missing affiliate link", inactive: "Inactive (disabled)", enabled_unverified: "Enabled · approval unverified" };

function ClickChart({ title, rows }) {
  const maximum = Math.max(1, ...rows.map((row) => row.clicks));
  return <section className="affiliate-analytics-card"><h2>{title}</h2>
    {rows.length ? <ul className="aff-chart">{rows.map((row) => <li key={row._id}>
      <div><span>{row.name || row._id}</span><strong>{number(row.clicks)}</strong></div>
      <div className="aff-track"><span style={{ width: `${row.clicks / maximum * 100}%` }} /></div>
    </li>)}</ul> : <p>No affiliate clicks recorded.</p>}
  </section>;
}

export default function AffiliateAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [listing, setListing] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "all", category: "", page: 1 });
  const [sort, setSort] = useState("clicks");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("adminToken");
        const headers = { Authorization: `Bearer ${token || ""}` };
        const query = new URLSearchParams({ ...filters, page: String(filters.page), limit: "25" });
        const request = async (path) => {
          const response = await fetch(`${API_URL}/affiliate/admin/dashboard/${path}`, { headers, cache: "no-store", signal: controller.signal });
          const data = await response.json();
          if (!response.ok) throw new Error(response.status === 403 ? "Affiliate management is available to administrators and super administrators only." : data.message || "Could not load analytics.");
          return data;
        };
        const [products, analytics] = await Promise.all([request(`products?${query}`), request("stats")]);
        setListing(products);
        setStats(analytics);
      } catch (failure) {
        if (failure.name !== "AbortError") setError(failure.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, retry]);

  const changeFilter = (key, value) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  const categories = [...(stats?.categories || [])].sort((a, b) => sort === "products" ? b.products - a.products : b.clicks - a.clicks);
  return <main className="affiliate-admin-page aff-dashboard"><div className="affiliate-admin-container">
    <div className="affiliate-admin-header"><div><span className="aff-eyebrow">AFFILIATE OPERATIONS</span><h1>Affiliate management & analytics</h1><p>Product coverage and recorded affiliate redirect clicks.</p></div><Link className="admin-primary-button" href="/admin/affiliate">Manage affiliate settings →</Link></div>
    {error && <div role="alert" className="aff-notice">{error} <button onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}
    {loading && <p role="status">Loading affiliate analytics…</p>}
    {stats && !error && <>
      <div className="affiliate-stat-grid aff-summary">{[
        ["Total products", stats.totalProducts], ["With affiliate links", stats.productsWithLinks],
        ["Without affiliate links", stats.productsWithoutLinks], ["Tracked affiliate clicks", stats.totalClicks],
      ].map(([label, value]) => <section className="affiliate-stat-card" key={label}><p>{label}</p><strong>{number(value)}</strong><small>All time</small></section>)}</div>
      <div className="aff-notice"><strong>Conversion tracking not configured</strong><p>Confirmed purchases, commissions, and conversion rates are not tracked. Clicks represent redirects, not purchases or unique visitors. Approval and expiry are not recorded; enabled links are not evidence of network approval.</p></div>
      <section className="affiliate-analytics-card aff-products"><h2>Affiliate product status</h2>
        <form className="aff-filters" onSubmit={(event) => { event.preventDefault(); changeFilter("search", search); }}>
          <label>Product name<input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search products" /></label>
          <button type="submit">Search</button>
          <label>Link coverage<select value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}><option value="all">All products</option><option value="with">With affiliate links</option><option value="without">Without affiliate links</option><option value="pending">Pending approval (not tracked)</option></select></label>
          <label>Category<select value={filters.category} onChange={(event) => changeFilter("category", event.target.value)}><option value="">All categories</option>{stats.categoryOptions.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
        </form>
        {filters.status === "pending" && <p>Approval tracking is not configured. No pending status can be confirmed.</p>}
        <div aria-busy={loading}>{listing?.products.length ? <AdminRecordTable label="Affiliate products" records={listing.products} columns={[
          { label: "Product", render: (product) => product.name },
          { label: "Category", render: (product) => product.categoryName },
          { label: "Link status", render: (product) => <span className={`aff-status ${product.status}`}>{statuses[product.status]}</span> },
          { label: "Network", render: (product) => product.affiliate?.network || "Not specified" },
          { label: "Commission type", render: (product) => product.affiliate?.commissionType || "unknown" },
          { label: "Commission value", render: (product) => product.affiliate?.commissionValue || "Not specified" },
          { label: "Approval", render: () => "Not tracked" },
          { label: "Clicks", render: (product) => number(product.totalClicks) },
          { label: "Updated", render: (product) => product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "Unknown" },
        ]} renderActions={(product) => <Link href={`/admin/products/${product._id}/edit`}>Edit product</Link>} /> : <p>No products match these filters.</p>}</div>
        <div className="aff-pagination"><span>{number(listing?.total)} products · Page {filters.page} of {Math.max(1, Math.ceil((listing?.total || 0) / 25))}</span><button disabled={loading || filters.page <= 1} onClick={() => setFilters((previous) => ({ ...previous, page: previous.page - 1 }))}>Previous</button><button disabled={loading || filters.page * 25 >= (listing?.total || 0)} onClick={() => setFilters((previous) => ({ ...previous, page: previous.page + 1 }))}>Next</button></div>
      </section>
      <div className="aff-charts"><ClickChart title="Top clicked products" rows={stats.clicksByProduct} /><ClickChart title="Top clicked categories" rows={stats.categories.filter((category) => category.clicks > 0).slice(0, 10)} /><ClickChart title="Clicks by date · latest 30 days with activity (UTC)" rows={stats.clicksByDate} /><ClickChart title="Clicks by network" rows={stats.clicksByNetwork} /></div>
      <p className="aff-footnote">Category and network attribution use current product settings because historical snapshots are not recorded. Deleted products remain included in total clicks and appear as unassigned networks; category performance includes current products only.</p>
      <section className="affiliate-analytics-card"><div className="aff-section-heading"><h2>Category performance</h2><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="clicks">Clicks</option><option value="products">Products</option><option disabled>Conversions — not tracked</option><option disabled>Commission revenue — not tracked</option></select></label></div>
        {categories.length ? <AdminRecordTable label="Category performance" records={categories} columns={[
          { label: "Category", render: (category) => category.name }, { label: "Products", render: (category) => number(category.products) },
          { label: "With links", render: (category) => number(category.productsWithLinks) }, { label: "Affiliate clicks", render: (category) => number(category.clicks) },
          { label: "Confirmed conversions", render: () => "Not tracked" }, { label: "Confirmed revenue", render: () => "Not tracked" }, { label: "Conversion rate", render: () => "Not tracked" },
        ]} /> : <p>No category performance data yet.</p>}
      </section>
    </>}
  </div></main>;
}
