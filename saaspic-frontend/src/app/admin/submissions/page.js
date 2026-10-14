"use client";

import AdminRecordTable, { AdminStatus } from "@/components/AdminRecordTable";

import OfferDatesFields from "@/components/OfferDatesFields";
import { fromDateInput, dateValidation } from "@/lib/dealDates";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // Stores the ID of the submission currently being published
  const [publishingId, setPublishingId] = useState(null);

  // Publishing form data
  const [publishData, setPublishData] = useState({
    discount: "",
    price: "",
    oldPrice: "",
    dealUrl: "",
    dealType: "lifetime",
      startDate: "",
      endDate: "",
  });

  // =========================
  // FETCH SUBMISSIONS
  // =========================

  async function fetchSubmissions() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/deal-submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not fetch submissions");
      }

      setSubmissions(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // =========================
  // PUBLISH FORM CHANGE
  // =========================

  function handlePublishChange(event) {
    const { name, value } = event.target;

    setPublishData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================
  // OPEN PUBLISH FORM
  // =========================

  function openPublishForm(id) {
    setPublishingId(id);

    setPublishData({
      discount: "",
      price: "",
      oldPrice: "",
      dealUrl: "",
      dealType: "lifetime",
      startDate: "",
      endDate: "",
    });

    setError("");
  }

  // =========================
  // CLOSE PUBLISH FORM
  // =========================

  function closePublishForm() {
    setPublishingId(null);

    setPublishData({
      discount: "",
      price: "",
      oldPrice: "",
      dealUrl: "",
      dealType: "lifetime",
      startDate: "",
      endDate: "",
    });
  }

  // =========================
  // PUBLISH DEAL
  // =========================

  async function publishDeal(id) {
    try {
      setActionLoading(id);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      if (
        !publishData.discount ||
        !publishData.price ||
        !publishData.oldPrice ||
        !publishData.dealUrl
      ) {
        setError("Please fill in all publishing fields.");

        return;
      }

      const dateError = dateValidation(publishData.startDate, publishData.endDate);
      if (dateError) throw new Error(dateError);
      const response = await fetch(
        `${API_URL}/deal-submissions/${id}/publish`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            discount: publishData.discount,
            price: Number(publishData.price),
            oldPrice: Number(publishData.oldPrice),
            dealUrl: publishData.dealUrl,
            dealType: publishData.dealType,
            startDate: fromDateInput(publishData.startDate),
            endDate: fromDateInput(publishData.endDate),
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Could not publish deal");
      }

      // Update submission status on screen
      setSubmissions((previous) =>
        previous.map((submission) =>
          submission._id === id ? data.submission : submission,
        ),
      );

      closePublishForm();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }

  // =========================
  // REJECT SUBMISSION
  // =========================

  async function rejectSubmission(id) {
    if (!window.confirm("Reject this submission? It will no longer be pending for publication.")) return;
    try {
      setActionLoading(id);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/deal-submissions/${id}/reject`, {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not reject submission");
      }

      setSubmissions((previous) =>
        previous.map((submission) =>
          submission._id === id ? data.submission : submission,
        ),
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }

  // =========================
  // LOGOUT
  // =========================

  return (
    <main className="admin-page">
      <div className="admin-container">
        {/* HEADER */}

        <div className="admin-header">
          <div>
            <span>ADMIN</span>

            <h1>Deal Submissions</h1>

            <p>Review and publish SaaS deals submitted by users.</p>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="admin-error" role="alert">{error}</div>}

        {/* CONTENT */}

        {loading ? (
          <p role="status" aria-live="polite">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <div className="admin-empty">
            <h2>No submissions</h2>

            <p>There are currently no deal submissions.</p>
          </div>
        ) : (
          <AdminRecordTable label="Deal submissions" records={submissions} columns={[
{label:'Submission',render:submission=><><strong>{submission.productName}</strong><p className="admin-table-description">{submission.description}</p>{submission.category}</>},
{label:'Offer',render:submission=>submission.deal},
{label:'Contact',render:submission=><>{submission.email}<br /><a href={submission.website} target="_blank" rel="noopener noreferrer">Visit website</a></>},
{label:'Status',render:submission=><AdminStatus status={submission.status} />}
]} renderDetails={submission=><>{submission.status === "pending" && (
                  <>
                    <div className="admin-actions">
                      <button
                        type="button"
                        onClick={() => openPublishForm(submission._id)}
                        className="admin-approve"
                      >
                        Publish Deal
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === submission._id}
                        onClick={() => rejectSubmission(submission._id)}
                        className="admin-reject"
                      >
                        {actionLoading === submission._id
                          ? "Processing..."
                          : "Reject"}
                      </button>
                    </div>

                    {/* PUBLISH FORM */}

                    {publishingId === submission._id && (
                      <div className="publish-form">
                        <h3>Publish {submission.productName}</h3>

                        <OfferDatesFields prefix="publish-offer" startDate={publishData.startDate} endDate={publishData.endDate} onChange={handlePublishChange} />
<div className="publish-grid">
                          <div>
                            <label htmlFor="admin-field-discount">Discount</label>

                            <input id="admin-field-discount"
                              type="text"
                              name="discount"
                              placeholder="50% OFF"
                              value={publishData.discount}
                              onChange={handlePublishChange}
                            />
                          </div>

                          <div>
                            <label htmlFor="admin-field-price">Price</label>

                            <input id="admin-field-price"
                              type="number"
                              name="price"
                              placeholder="49"
                              min="0"
                              step="0.01"
                              value={publishData.price}
                              onChange={handlePublishChange}
                            />
                          </div>

                          <div>
                            <label htmlFor="admin-field-oldPrice">Old Price</label>

                            <input id="admin-field-oldPrice"
                              type="number"
                              name="oldPrice"
                              placeholder="99"
                              min="0"
                              step="0.01"
                              value={publishData.oldPrice}
                              onChange={handlePublishChange}
                            />
                          </div>

                          <div>
                            <label htmlFor="admin-field-dealType">Deal Type</label>

                            <select id="admin-field-dealType"
                              name="dealType"
                              value={publishData.dealType}
                              onChange={handlePublishChange}
                            >
                              <option value="lifetime">Lifetime</option>

                              <option value="annual">Annual</option>

                              <option value="monthly">Monthly</option>

                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="publish-url">
                          <label htmlFor="admin-field-dealUrl">Deal URL</label>

                          <input id="admin-field-dealUrl"
                            type="url"
                            name="dealUrl"
                            placeholder="https://example.com/deal"
                            value={publishData.dealUrl}
                            onChange={handlePublishChange}
                          />
                        </div>

                        <div className="publish-actions">
                          <button
                            type="button"
                            disabled={actionLoading === submission._id}
                            onClick={() => publishDeal(submission._id)}
                            className="admin-approve"
                          >
                            {actionLoading === submission._id
                              ? "Publishing..."
                              : "Confirm Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={closePublishForm}
                            className="admin-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}</>} />
        )}
      </div>
    </main>
  );
}
