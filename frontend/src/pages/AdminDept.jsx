import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import editPen from "../assets/icons/edit_pen.png";
import deleteBin from "../assets/icons/Delete_bin.png";
import AddNewDept from "./AddNewDept";
import EditDept from "./EditDept";
import { listDepartments, toggleDepartmentActive, deleteDepartment } from "../lib/api";
import "./AdminDept.css";

function AdminDept() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total]);

  async function load(p = page, query = q) {
    setLoading(true);
    try {
      const data = await listDepartments({ page: p, per_page: perPage, q: query.trim() });
      setRows(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch (e) {
      alert(e.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1, q); /* initial */ }, []);

  // status UI
  const Status = ({ active }) => (
    <span className="admindept-status">
      <span className={`dept-status-dot ${active ? "green" : "gray"}`} />
      <span className={`admindept-status-text`}>{active ? "Active" : "In-active"}</span>
    </span>
  );

  const handleToggle = async (row) => {
    try {
      await toggleDepartmentActive(row.id, !row.is_active);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)));
    } catch (e) {
      alert(e.message || "Failed to update status");
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete department "${row.name}"?`)) return;
    try {
      await deleteDepartment(row.id);
      // reload current page; if last item removed and page becomes empty, step back a page
      const after = rows.length - 1;
      const targetPage = after === 0 && page > 1 ? page - 1 : page;
      await load(targetPage, q);
    } catch (e) {
      alert(e.message || "Failed to delete");
    }
  };

  const onSaved = async () => {
    setShowAddDeptModal(false);
    setEditDept(null);
    await load(1, q);
  };

  return (
    <div className="userdash-outer">
      <AdminTopBar />
      <div className="userdash-inner">
        <AdminSidebar activeMenu="Admin" activeSub="Departments" />
        <div className="userdash-main admindept-main">
          <div className="admindept-header-row">
            <div>
              <div className="admindept-title">Departments</div>
              <div className="admindept-subtitle">Manage all Departments and their access levels</div>
            </div>
            <div className="admindept-header-actions">
              <div className="admindept-breadcrumb">
                Admin / <span className="breadcrumb-active">Departments</span>
              </div>
              <button className="admindept-add-btn" onClick={() => setShowAddDeptModal(true)}>
                + Add New Department
              </button>
            </div>
          </div>

          <div className="admindept-tablecard">
            <div className="admindept-searchbar-row">
              <input
                type="text"
                className="admindept-searchbar"
                placeholder="🔍 Search here"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                  // live search (de-bounce not necessary here)
                  load(1, e.target.value);
                }}
              />
            </div>
            <table className="admindept-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Sample Size</th>
                  <th>Created on</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center" }}>No departments found.</td></tr>
                ) : (
                  rows.map((d) => (
                    <tr key={d.id}>
                      <td><span className="admindept-name">{d.name}</span></td>
                      <td><span className="admindept-size">{d.percent}%</span></td>
                      <td><span className="admindept-date">{String(d.created_at).slice(0,10)}</span></td>
                      <td><Status active={!!d.is_active} /></td>
                      <td>
                        <div className="admindept-actions">
                          <label className="switch">
                            <input type="checkbox" checked={!!d.is_active} onChange={() => handleToggle(d)} />
                            <span className="slider"></span>
                          </label>
                          <button className="admindept-edit-btn" onClick={() => setEditDept(d)}>
                            <img src={editPen} alt="Edit" />
                          </button>
                          <button className="admindept-edit-btn" onClick={() => handleDelete(d)} title="Delete">
                            <img src={deleteBin} alt="Delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="admindept-pagination">
              <button
                className="admindept-page-btn"
                disabled={page <= 1}
                onClick={() => { load(page - 1, q); }}
              >
                ‹ Prev
              </button>
              <span className="admindept-page">{page}</span>
              <button
                className="admindept-page-btn"
                disabled={page >= pages}
                onClick={() => { load(page + 1, q); }}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>

        {showAddDeptModal && (
          <AddNewDept onClose={() => setShowAddDeptModal(false)} onSaved={onSaved} />
        )}
        {editDept && <EditDept dept={editDept} onClose={() => setEditDept(null)} onSaved={onSaved} />}
      </div>
    </div>
  );
}

export default AdminDept;
