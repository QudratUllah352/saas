"use client";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OfferDatesFields from "@/components/OfferDatesFields";
import { fromDateInput, dateValidation } from "@/lib/dealDates";

export default function NewDealPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        product: "",
        isActive: true,
        discount: "",
        price: "",
        oldPrice: "",
        dealUrl: "",
        dealType: "other",
        startDate: "",
        endDate: "",
    });

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadProducts() {
            try {
                const token =
                    localStorage.getItem("adminToken");

                if (!token) {
                    router.replace("/login");
                    return;
                }

                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/products`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("admin");

                    router.replace("/login");
                    return;
                }
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load products"
                    );
                }

                setProducts(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, [router]);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const dateError = dateValidation(formData.startDate, formData.endDate);
            if (dateError) throw new Error(dateError);
            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            setSaving(true);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/deals`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        product: formData.product,
                        isActive: formData.isActive,
                        discount: formData.discount,
                        price: Number(formData.price),
                        oldPrice: Number(formData.oldPrice),
                        dealUrl: formData.dealUrl,
                        dealType: formData.dealType,
                        startDate: fromDateInput(formData.startDate),
                        endDate: fromDateInput(formData.endDate),
                    }),
                }
            );

            const data = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");

                router.replace("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.error || data.message || "Could not create deal"
                );
            }

            setSuccess(formData.isActive ? "Deal saved and published successfully." : "Deal saved as inactive.");

            setTimeout(() => {
                router.push("/admin/deals");
            }, 800);
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="admin-edit-page">
                <div className="admin-edit-container">
                    <p role="status" aria-live="polite">Loading products...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="admin-edit-page">

            <div className="admin-edit-container">

                <div className="admin-edit-header">

                    <div>
                        <span className="admin-dashboard-label">
                            ADMIN
                        </span>

                        <h1>Add Deal</h1>

                        <p>
                            Create an offer for an existing product.
                        </p>
                    </div>

                    <Link
                        href="/admin/deals"
                        className="admin-back-button"
                    >
                        ← Manage Deals
                    </Link>

                </div>

                {error && (
                    <div className="admin-error" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="admin-success" role="status" aria-live="polite">
                        {success}
                    </div>
                )}

                <div className="admin-edit-card">
                        <form
                            onSubmit={handleSubmit}
                            className="admin-edit-form"
                        >

                            <div className="admin-edit-field">
                                <label htmlFor="product">Product</label>
                                <select id="product" name="product" value={formData.product} onChange={handleChange} required disabled={saving || products.length === 0}>
                                    <option value="">Select a product</option>
                                    {products.map(product => <option key={product._id} value={product._id}>{product.name}</option>)}
                                </select>
                                {products.length === 0 && <p>No products available. <Link href="/admin/products/new">Add a product</Link> first.</p>}
                            </div>

                            <div className="admin-edit-field">

                                <label htmlFor="discount">
                                    Discount
                                </label>

                                <input
                                    id="discount"
                                    name="discount"
                                    type="text"
                                    placeholder="e.g. 50% OFF"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="admin-edit-two-columns">

                                <div className="admin-edit-field">

                                    <label htmlFor="price">
                                        Current Price
                                    </label>

                                    <input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="admin-edit-field">

                                    <label htmlFor="oldPrice">
                                        Old Price
                                    </label>

                                    <input
                                        id="oldPrice"
                                        name="oldPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.oldPrice}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                            </div>

                            <div className="admin-edit-field">

                                <label htmlFor="dealUrl">
                                    Deal URL
                                </label>

                                <input
                                    id="dealUrl"
                                    name="dealUrl"
                                    type="url"
                                    placeholder="https://example.com/deal"
                                    value={formData.dealUrl}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="admin-edit-field">

                                <label htmlFor="dealType">
                                    Deal Type
                                </label>

                                <select
                                    id="dealType"
                                    name="dealType"
                                    value={formData.dealType}
                                    onChange={handleChange}
                                >
                                    <option value="lifetime">
                                        Lifetime
                                    </option>

                                    <option value="annual">
                                        Annual
                                    </option>

                                    <option value="monthly">
                                        Monthly
                                    </option>

                                    <option value="other">
                                        Other
                                    </option>
                                </select>

                            </div>

                            <OfferDatesFields startDate={formData.startDate} endDate={formData.endDate} onChange={handleChange} />

                            <div className="admin-edit-field">
                                <label htmlFor="isActive">
                                    <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} /> Publish deal
                                </label>
                                <p>Uncheck to save as inactive and activate later. Offer dates determine when it can be claimed.</p>
                            </div>

                            <div className="admin-edit-actions">

                                <Link
                                    href="/admin/deals"
                                    className="admin-cancel-button"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    className="admin-save-button"
                                    disabled={saving || !formData.product || products.length === 0}
                                >
                                    {saving
                                        ? "Saving..."
                                        : formData.isActive ? "Save and Publish" : "Save Deal"}
                                </button>

                            </div>

                        </form>

                    </div>

            </div>

        </main>
    );
}