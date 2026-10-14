"use client";

import AdminRecordTable, { AdminStatus } from "@/components/AdminRecordTable";

import { getOfferStatus } from "@/lib/dealDates";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDealsPage() {
    const router = useRouter();

    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
    const [workingId, setWorkingId] = useState(null);

useEffect(() => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    router.push("/login");
    return;
  }

  async function loadDeals() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const response = await fetch(
        `${API_URL}/deals/admin/all`,
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
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load deals");
      }

      const data = await response.json();
      setDeals(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  loadDeals();
}, [router]);

    async function toggleStatus(id) {
        try {
            const token = localStorage.getItem("adminToken");

            if (!token) {
                router.push("/login");
                return;
            }

            setWorkingId(id);
            setError("");
      setNotice("");

            const response = await fetch(
                `${API_URL}/deals/${id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");

                router.push("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not change deal status"
                );
            }

setNotice("Deal status updated.");
            setDeals((previousDeals) =>
                previousDeals.map((deal) =>
                    deal._id === id
                        ? data.deal
                        : deal
                )
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setWorkingId(null);
        }
    }

    async function deleteDeal(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this deal?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const token = localStorage.getItem("adminToken");

            if (!token) {
                router.push("/login");
                return;
            }

            setWorkingId(id);
            setError("");
      setNotice("");

            const response = await fetch(
                `${API_URL}/deals/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");

                router.push("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not delete deal"
                );
            }

setNotice("Deal deleted successfully.");
            setDeals((previousDeals) =>
                previousDeals.filter(
                    (deal) => deal._id !== id
                )
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setWorkingId(null);
        }
    }

    return (
        <main className="admin-deals-page">
{notice && <div className="admin-success" role="status">{notice}</div>}

            <div className="admin-deals-container">

                <div className="admin-deals-header">

                    <div>
                        <span className="admin-dashboard-label">
                            ADMIN
                        </span>

                        <h1>Manage Deals</h1>

                        <p>
                            Create, edit, activate, deactivate and delete
                            SaaS deals.
                        </p>
                    </div>

                    <Link href="/admin/deals/new" className="admin-save-button">+ Add Deal</Link>

                </div>

                {error && (
                    <div className="admin-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (

                    <p role="status" aria-live="polite">Loading deals...</p>

                ) : deals.length === 0 ? (

                    <div className="admin-empty">
                        <h2>No deals found</h2>
                        <p>
                            Published deals will appear here.
                        </p>
                    </div>

                ) : (

                    <AdminRecordTable label="Deals" records={deals} columns={[{label:'Product',render:deal=><strong>{deal.product?.name || 'Unknown Product'}</strong>},{label:'Category',render:deal=>deal.product?.category?.name || 'No category'},{label:'Offer',render:deal=><>{deal.discount}<br />Price: $ {deal.price}<br />Old price: $ {deal.oldPrice}<br />{deal.dealType}</>},{label:'Dates (UTC)',render:deal=><>Start: {deal.startDate ? new Date(deal.startDate).toISOString() : 'Not scheduled'}<br />End: {deal.endDate ? new Date(deal.endDate).toISOString() : 'No expiry'}</>},{label:'Status',render:deal=><AdminStatus status={getOfferStatus(deal)} />}]} renderActions={(deal) => (<div className="admin-deal-actions">

                                    <Link
                                        href={`/admin/deals/${deal._id}/edit`}
                                        className="admin-edit-button"
                                    >
                                        Edit
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleStatus(deal._id)
                                        }
                                        disabled={workingId === deal._id}
                                        className="admin-status-button"
                                    >
                                        {workingId === deal._id
                                            ? "Working..."
                                            : deal.isActive
                                                ? "Deactivate"
                                                : "Activate"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteDeal(deal._id)
                                        }
                                        disabled={workingId === deal._id}
                                        className="admin-delete-button"
                                    >
                                        Delete
                                    </button>

                                </div>)} />

                )}

            </div>

        </main>
    );
}