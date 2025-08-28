// src/pages/SuperAdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../components/Layout/SuperAdminSidebar";
import SuperAdminTopBar from "../components/Layout/SuperAdminTopBar";
import SADBChangePasswordModal from "../components/Modals/SADBChangePasswordModal";
import AddNewAdmin from "./AddNewAdmin";
import SuperAdminEditAdminModal from "../components/Modals/SuperAdminEditAdminModal.jsx";
import SuperAdminDeleteAdminModal from "../components/Modals/SuperAdminDeleteAdminModal.jsx";

import { listUsers, changePassword } from "../lib/api";

import editIcon from "../assets/icons/edit_pen.png";
import deleteIcon from "../assets/icons/delete_bin.png";

import "./SuperAdminDashboard.css";
import "../components/Modals/SuperAdminModals.css";

// helpers
function getInitials(name = "", username = "") {
  const base = name?.trim() || username?.trim() || "U";
  const parts = base.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
function formatRole(role = "") {
  const r = String(role || "").toLowerCase();
  if (r === "superadmin" || r === "super admin") return "Super admin";
  if (r === "admin") return "Admin";
  return r ? r[0].toUpperCase() + r.slice(1) : "";
}
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? String(d).slice(0, 10) : dt.toISOString().slice(0, 10);
}
function pageNumbers(page, pages) {
  const nums = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
    return nums;
  }
  if (page <= 4) return [1, 2, 3, 4, 5, "…", pages];
  if (page >= pages - 3)
    return [1, "…", pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, "…", page - 1, page, page + 1, "…", pages];
}

export default function SuperAdminDashboard() {
  // table data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // modals
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const blurActive = showAddAdmin || showChangePwd || editOpen || deleteOpen;

  async function fetchUsers(nextPage = page) {
    setLoading(true);
    try {
      const data = await listUsers({
        page: nextPage,
        page_size: pageSize,
        roles: "admin,superadmin", // only admins & superadmins
      });
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || nextPage);
    } catch (e) {
      console.error("Failed to load users:", e);
      setRows([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyChangePwd = async ({ current, next }) => {
    const username =
      localStorage.getItem("username") ||
      JSON.parse(localStorage.getItem("user") || "{}").username ||
      "AA9001";
    try {
      await changePassword({ username, current, new: next });
      alert("Password changed successfully.");
    } catch (e) {
      alert(e.message || "Password change failed");
    } finally {
      setShowChangePwd(false);
    }
  };

  const openEdit = (id) => {
    setSelectedId(id);
    setEditOpen(true);
  };

  const goTo = (p) => {
    if (typeof p === "number" && p >= 1 && p <= pages && p !== page)
      fetchUsers(p);
  };
  const pager = useMemo(() => pageNumbers(page, pages), [page, pages]);

  return (
    <div className="sadb-frame">
      <SuperAdminTopBar onOpenChangePassword={() => setShowChangePwd(true)} />

      <div className="sadb-body">
        <aside className="sadb-sidebar-fixed">
          <SuperAdminSidebar />
        </aside>

        <main className={`sadb-content${blurActive ? " blurred-bg" : ""}`}>
          <div className="superadmin-header-row">
            <div>
              <div className="superadmin-title">Admin users</div>
              <div className="superadmin-desc">
                Manage all administrative accounts and their access levels
              </div>
            </div>
            <button
              className="superadmin-add-btn"
              onClick={() => setShowAddAdmin(true)}
            >
              + Add Admin User
            </button>
          </div>

          <div className="superadmin-table-wrap">
            <table className="superadmin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>E-mail</th>
                  <th>Role</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "18px" }}>
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "18px" }}>
                      No admin users found.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="superadmin-avatar">
                          {getInitials(u.name, u.username)}
                        </span>
                      </td>
                      <td className="superadmin-name">
                        {u.name || u.username}
                      </td>
                      <td className="superadmin-email">{u.email || ""}</td>
                      <td className="superadmin-role">{formatRole(u.role)}</td>
                      <td className="superadmin-date">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="superadmin-actions">
                        <img
                          src={editIcon}
                          alt="edit"
                          className="superadmin-action-icon"
                          onClick={() => openEdit(u.id)}
                          title="Edit"
                        />
                        <img
                          src={deleteIcon}
                          alt="delete"
                          className="superadmin-action-icon"
                          onClick={() => {
                            setSelectedId(u.id);
                            setDeleting({ id: u.id, role: u.role });
                            setDeleteOpen(true);
                          }}
                          title="Delete"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="superadmin-pagination">
              <button onClick={() => goTo(page - 1)} disabled={page <= 1}>
                &larr;
              </button>
              {pager.map((n, i) =>
                n === "…" ? (
                  <span key={`dots-${i}`}>…</span>
                ) : (
                  <button
                    key={n}
                    className={n === page ? "page-active" : ""}
                    onClick={() => goTo(n)}
                  >
                    {n}
                  </button>
                )
              )}
              <button onClick={() => goTo(page + 1)} disabled={page >= pages}>
                &rarr;
              </button>
            </div>
          </div>
        </main>
      </div>

      <SADBChangePasswordModal
        open={showChangePwd}
        onApply={handleApplyChangePwd}
        onCancel={() => setShowChangePwd(false)}
      />

      {showAddAdmin && (
        <AddNewAdmin
          onClose={() => setShowAddAdmin(false)}
          onSaved={() => fetchUsers(page)}
        />
      )}

      <SuperAdminEditAdminModal
        userId={selectedId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => fetchUsers(page)}
      />

      <SuperAdminDeleteAdminModal
        userId={selectedId}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        role={deleting?.role || ""}
        onDeleted={() => {
          const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
          fetchUsers(nextPage);
        }}
      />
    </div>
  );
}
