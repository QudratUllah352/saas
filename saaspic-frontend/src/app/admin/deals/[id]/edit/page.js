"use client";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import OfferDatesFields from "@/components/OfferDatesFields";
import { toDateInput, fromDateInput, dateValidation } from "@/lib/dealDates";

export default function EditDealPage() {
    const router = useRouter();
    const params = useParams();

    const id = params.id;

    const [formData, setFormData] = useState({
        discount: "",
        price: "",
        oldPrice: "",
        dealUrl: "",
        dealType: "other",
        startDate: "",
        endDate: "",
    });

    const [product, setProduct] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadDeal() {
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
                    `${API_URL}/deals/admin/${id}`,
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
                        data.message || "Could not load deal"
                    );
                }

                setProduct(data.product);

                setFormData({
                    discount: data.discount || "",
                    price: data.price ?? "",
                    oldPrice: data.oldPrice ?? "",
                    dealUrl: data.dealUrl || "",
                    dealType: data.dealType || "other",
                    startDate: toDateInput(data.startDate),
                    endDate: toDateInput(data.endDate),
                });
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadDeal();
        }
    }, [id, router]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
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
                `${API_URL}/deals/${id}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
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
                    data.error || data.message || "Could not update deal"
                );
            }

            setSuccess("Deal updated successfully.");

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
                    <p role="status" aria-live="polite">Loading deal...</p>
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

                        <h1>Edit Deal</h1>

                        <p>
                            Update the deal information stored
                            in MongoDB.
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

                {product && (
                    <div className="admin-edit-card">

                        {product && (
                            <div className="admin-edit-product">

                                <span>
                                    PRODUCT
                                </span>

                                <h2>
                                    {product.name}
                                </h2>

                                <p>
                                    {product.category?.name ||
                                        "No category"}
                                </p>

                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="admin-edit-form"
                        >

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
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                            </div>

                        </form>

                    </div>
                )}

            </div>

        </main>
    );
}