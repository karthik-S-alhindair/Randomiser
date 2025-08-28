import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import editPen from "../assets/icons/edit_pen.png";
import deleteBin from "../assets/icons/Delete_bin.png";
import AddNewUser from "./AddNewUser";
import EditUser from "./EditUser";
import "./AdminUsers.css";
import { listManagedUsers, toggleManagedUserActive, deleteManagedUser } from "../lib/api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const perPage = 8;

  const fetchUsers = async (p = page, q = search) => {
    const data = await listManagedUsers({ page: p, per_page: perPage, q });
    setUsers(data.items || []);
    setPage(data.page || 1);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    fetchUsers(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced search
  useEffect(() => {
    const id = setTimeout(() => fetchUsers(1, search), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleToggle = async (u) => {
    try {
      await toggleManagedUserActive(u.id, !u.is_active);
      fetchUsers();
    } catch (e) {
      window.alert(e.message || "Failed to update status");
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name || u.username}"?`)) return;
    try {
      await deleteManagedUser(u.id);
      // if last item on page deleted, go back a page if needed
      const newCount = total - 1;
      const newPages = Math.max(1, Math.ceil(newCount / perPage));
      const targetPage = Math.min(page, newPages);
      await fetchUsers(targetPage, search);
    } catch (e) {
      window.alert(e.message || "Failed to delete user");
    }
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const fmt = (iso) => (iso ? iso.split("T")[0] : "");

  return (
    <div className="userdash-outer">
      <AdminTopBar />
      <div className="userdash-inner">
        <AdminSidebar activeMenu="Admin" activeSub="Users" />
        <div className="userdash-main adminusers-main">
          <div className="adminusers-header-row">
            <div>
              <div className="adminusers-title">Users</div>
              <div className="adminusers-subtitle">
                Manage all administrative accounts and their access levels
              </div>
            </div>
            <div className="adminusers-header-actions">
              <div className="adminusers-breadcrumb">
                Admin / <span className="breadcrumb-active">Users</span>
              </div>
              <button
                className="adminusers-add-btn"
                onClick={() => setShowAddUserModal(true)}
              >
                + Add New User
              </button>
            </div>
          </div>

          <div className="adminusers-tablecard">
            <div className="adminusers-searchbar-row">
              <input
                type="text"
                className="adminusers-searchbar"
                placeholder="🔍 Search here"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <table className="adminusers-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>E-mail</th>
                  <th>Designation</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="adminusers-avatar">
                        {initials(u.name || u.username)}
                      </div>
                    </td>
                    <td>
                      <span className="adminusers-name">{u.name || "-"}</span>
                    </td>
                    <td>
                      <span className="adminusers-email">{u.email || "-"}</span>
                    </td>
                    <td>
                      <span className="adminusers-role">
                        {u.designation || u.role || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="adminusers-date">
                        {fmt(u.created_at)}
                      </span>
                    </td>
                    <td>
                      <div className="adminusers-actions">
                        {/* Toggle Switch */}
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={!!u.is_active}
                            onChange={() => handleToggle(u)}
                          />
                          <span className="slider"></span>
                        </label>
                        {/* Edit Icon */}
                        <button
                          className="adminusers-edit-btn"
                          onClick={() => setEditUser(u)}
                        >
                          <img src={editPen} alt="Edit" />
                        </button>
                        {/* Delete Icon */}
                        <button
                          className="adminusers-delete-btn"
                          aria-label={`Delete ${u.name || u.username}`}
                          title="Delete"
                          onClick={() => handleDelete(u)}
                        >
                          <img src={deleteBin} alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 22,
                        color: "#7a879a",
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="adminusers-pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className="adminusers-page"
                  style={{
                    background: n === page ? "#dfe7ff" : undefined,
                    borderColor: n === page ? "#b6cbff" : undefined,
                  }}
                  onClick={() => fetchUsers(n, search)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showAddUserModal && (
          <AddNewUser
            onClose={() => setShowAddUserModal(false)}
            onSaved={() => fetchUsers(1, search)}
          />
        )}
        {editUser && (
          <EditUser
            user={editUser}
            onClose={() => setEditUser(null)}
            onSaved={() => fetchUsers(page, search)}
          />
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
