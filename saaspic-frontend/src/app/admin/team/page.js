"use client";

import { API_URL } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function AdminTeamPage() {
  const router = useRouter();

  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    name: "",
    email: "",
    role: "editor",
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin" || isSuperAdmin;

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const stored = localStorage.getItem("admin");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    fetchTeamMembers(token);
  }, [router]);

  async function fetchTeamMembers(tokenOverride) {
    const token = tokenOverride || localStorage.getItem("adminToken");
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/team`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        setError("Access denied: You do not have permission to view team members.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Could not fetch team members.");
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || "Could not load team members.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      setInviting(true);
      setInviteError("");
      setGeneratedInviteUrl("");

      const response = await fetch(`${API_URL}/admin/team/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send invitation.");
      }

      setSuccessMessage(`Invitation successfully created for ${inviteFormData.email}.`);
      if (data.inviteUrl) {
        setGeneratedInviteUrl(data.inviteUrl);
      } else {
        setInviteModalOpen(false);
        setInviteFormData({ name: "", email: "", role: "editor" });
      }

      await fetchTeamMembers(token);
    } catch (err) {
      setInviteError(err.message || "Could not invite team member.");
    } finally {
      setInviting(false);
    }
  }

  async function handleResendInvite(memberId, memberEmail) {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/admin/team/${memberId}/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not resend invitation.");
      }

      setSuccessMessage(`Invitation resent to ${memberEmail}.`);
      if (data.inviteUrl) {
        setGeneratedInviteUrl(data.inviteUrl);
        setInviteModalOpen(true);
      }
      await fetchTeamMembers(token);
    } catch (err) {
      setError(err.message || "Could not resend invitation.");
    }
  }

  async function handleToggleStatus(member) {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const actionText = member.status === "active" ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${actionText} ${member.name}?`)) {
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_URL}/admin/team/${member._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Could not ${actionText} user.`);
      }

      setSuccessMessage(data.message || `Status updated for ${member.name}.`);
      await fetchTeamMembers(token);
    } catch (err) {
      setError(err.message || `Could not update user status.`);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/admin/team/${memberId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update user role.");
      }

      setSuccessMessage("Member role updated successfully.");
      await fetchTeamMembers(token);
    } catch (err) {
      setError(err.message || "Could not change role.");
    }
  }

  async function handleDeleteMember(member) {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    if (!confirm(`Are you sure you want to completely remove ${member.name}? This cannot be undone.`)) {
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_URL}/admin/team/${member._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete user.");
      }

      setSuccessMessage("Member removed from system.");
      await fetchTeamMembers(token);
    } catch (err) {
      setError(err.message || "Could not remove user.");
    }
  }

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "active").length;
    const invited = members.filter((m) => m.status === "invited").length;
    const editors = members.filter((m) => m.role === "editor").length;
    return { total, active, invited, editors };
  }, [members]);

  return (
    <AdminShell>
      <div className="admin-container">
        {/* PAGE HEADER */}
        <div className="admin-page-header">
          <div>
            <h1>Team Members</h1>
            <p>Manage administrator roles, editors, and pending invitations.</p>
          </div>

          {isAdmin && (
            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => {
                  setInviteError("");
                  setGeneratedInviteUrl("");
                  setInviteFormData({ name: "", email: "", role: "editor" });
                  setInviteModalOpen(true);
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Invite Member
              </button>
            </div>
          )}
        </div>

        {/* FEEDBACK MESSAGES */}
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="admin-success" role="status" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="admin-stat-card">
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total Members</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="admin-stat-card">
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Active Users</span>
            <strong style={{ color: "#166534" }}>{stats.active}</strong>
          </div>
          <div className="admin-stat-card">
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Editors</span>
            <strong style={{ color: "#0e7490" }}>{stats.editors}</strong>
          </div>
          <div className="admin-stat-card">
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Pending Invites</span>
            <strong style={{ color: "#d97706" }}>{stats.invited}</strong>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ position: "relative", minWidth: "280px", maxWidth: "400px", width: "100%" }}>
            <input
              type="search"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #cbdde3",
                fontSize: "14px",
              }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* TEAM TABLE */}
        <div className="admin-table-scroll">
          <table className="admin-record-table">
            <caption className="admin-table-caption">
              Active administrators, editors, and invited team members.
            </caption>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Invited By</th>
                <th>Activity / Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Loading team members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    {searchQuery ? "No members matching your search." : "No team members found."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isCurrent = currentUser?.id === member._id || currentUser?.email === member.email;

                  return (
                    <tr key={member._id}>
                      <td data-label="Member">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: member.role === "superadmin" ? "#7c3aed" : member.role === "admin" ? "#0e7490" : "#67c6d8",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {(member.name || member.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#334155" }}>
                              {member.name}
                              {isCurrent && (
                                <span style={{ marginLeft: "6px", fontSize: "11px", color: "#0e7490", fontWeight: 700 }}>
                                  (You)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{member.email}</div>
                          </div>
                        </div>
                      </td>

                      <td data-label="Role">
                        {isSuperAdmin && !isCurrent && member.status !== "invited" ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member._id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              border: "1px solid #cbdde3",
                              fontWeight: 600,
                              minHeight: "32px",
                              background: "#fff",
                            }}
                          >
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              background:
                                member.role === "superadmin"
                                  ? "#f5f3ff"
                                  : member.role === "admin"
                                  ? "#e6f7fa"
                                  : "#f0fdf4",
                              color:
                                member.role === "superadmin"
                                  ? "#6d28d9"
                                  : member.role === "admin"
                                  ? "#0e7490"
                                  : "#047857",
                              border: `1px solid ${
                                member.role === "superadmin"
                                  ? "#ddd6fe"
                                  : member.role === "admin"
                                  ? "#b6e3eb"
                                  : "#bbf7d0"
                              }`,
                            }}
                          >
                            {member.role === "superadmin"
                              ? "Super Admin"
                              : member.role === "admin"
                              ? "Admin"
                              : "Editor"}
                          </span>
                        )}
                      </td>

                      <td data-label="Status">
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background:
                              member.status === "active"
                                ? "#ecfdf5"
                                : member.status === "invited"
                                ? "#fffbeb"
                                : "#fef2f2",
                            color:
                              member.status === "active"
                                ? "#047857"
                                : member.status === "invited"
                                ? "#b45309"
                                : "#b91c1c",
                          }}
                        >
                          {member.status === "active"
                            ? "Active"
                            : member.status === "invited"
                            ? "Pending Invite"
                            : "Deactivated"}
                        </span>
                      </td>

                      <td data-label="Invited By" style={{ fontSize: "13px", color: "#64748b" }}>
                        {member.invitedBy ? member.invitedBy.name || member.invitedBy.email : "System Owner"}
                      </td>

                      <td data-label="Activity / Status" style={{ fontSize: "13px", color: "#64748b" }}>
                        {member.status === "invited" ? (
                          <span>
                            Expires:{" "}
                            {member.inviteExpires
                              ? new Date(member.inviteExpires).toLocaleDateString()
                              : "48h"}
                          </span>
                        ) : member.lastLogin ? (
                          <span>Last login: {new Date(member.lastLogin).toLocaleDateString()}</span>
                        ) : (
                          <span>No login recorded</span>
                        )}
                      </td>

                      <td data-label="Actions" style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {member.status === "invited" && (
                            <button
                              type="button"
                              className="admin-secondary-button"
                              onClick={() => handleResendInvite(member._id, member.email)}
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                              title="Resend invitation email"
                            >
                              Resend
                            </button>
                          )}

                          {!isCurrent && member.status !== "invited" && (
                            <button
                              type="button"
                              className="admin-secondary-button"
                              onClick={() => handleToggleStatus(member)}
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                            >
                              {member.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          )}

                          {isSuperAdmin && !isCurrent && (
                            <button
                              type="button"
                              className="admin-delete-button"
                              onClick={() => handleDeleteMember(member)}
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                              title="Remove member from system"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* INVITE MODAL */}
        {inviteModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1100,
            }}
            onClick={() => {
              if (!inviting) setInviteModalOpen(false);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                maxWidth: "480px",
                width: "100%",
                padding: "28px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                border: "1px solid #dce9ed",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#334155", margin: 0 }}>
                  Invite Team Member
                </h2>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {generatedInviteUrl ? (
                <div>
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      padding: "14px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>Invitation Created!</strong>
                    <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
                      An invitation link has been generated. You can share this link directly with the new member:
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteUrl}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "13px",
                        background: "#f8fafc",
                        border: "1px solid #cbdde3",
                        borderRadius: "6px",
                        color: "#334155",
                      }}
                    />
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInviteUrl);
                        alert("Invitation link copied to clipboard!");
                      }}
                      style={{ width: "100%", marginTop: "8px", padding: "8px" }}
                    >
                      Copy Link to Clipboard
                    </button>
                  </div>

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => {
                      setInviteModalOpen(false);
                      setGeneratedInviteUrl("");
                    }}
                    style={{ width: "100%" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit} style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Smith"
                      value={inviteFormData.name}
                      onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                      disabled={inviting}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jordan@company.com"
                      value={inviteFormData.email}
                      onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                      disabled={inviting}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Role & Permissions
                    </label>
                    <select
                      value={inviteFormData.role}
                      onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value })}
                      disabled={inviting}
                    >
                      <option value="editor">Editor (Can create/edit products, deals, reviews, blogs)</option>
                      {isSuperAdmin && (
                        <option value="admin">Administrator (Full administrative access, invites, settings)</option>
                      )}
                    </select>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 0" }}>
                      {inviteFormData.role === "editor"
                        ? "Editors can manage content but cannot access team management or affiliate settings."
                        : "Administrators have team invitation and full platform management access."}
                    </p>
                  </div>

                  {inviteError && (
                    <div className="admin-error" role="alert" style={{ margin: 0, padding: "10px 14px", fontSize: "13px" }}>
                      {inviteError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => setInviteModalOpen(false)}
                      disabled={inviting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={inviting}
                    >
                      {inviting ? "Sending Invitation..." : "Send Invitation"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

