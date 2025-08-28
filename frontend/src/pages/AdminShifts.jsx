// src/pages/AdminShifts.jsx  (REPLACE FILE)
import React, { useEffect, useState, useCallback } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import editPen from "../assets/icons/edit_pen.png";
import deleteBin from "../assets/icons/Delete_bin.png";
import AddNewShift from "./AddNewShift";
import EditShift from "./EditShift";
import { listShifts, toggleShiftActive, deleteShift } from "../lib/api";
import "./AdminShifts.css";

function AdminShifts() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 8;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  const [loading, setLoading] = useState(false);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [edit, setEdit] = useState(null); // {id, name, is_active}

  const load = useCallback(
    async (goto = 1) => {
      setLoading(true);
      try {
        const data = await listShifts({
          page: goto,
          per_page: perPage,
          q: search,
        });
        setRows(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? goto);
      } catch (e) {
        alert(e.message || "Failed to load shifts");
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  // debounced reload on search change
  useEffect(() => {
    const id = setTimeout(() => load(1), 250);
    return () => clearTimeout(id);
  }, [search, load]);

  const onAdded = () => {
    setShowAddShiftModal(false);
    load(1);
  };
  const onEdited = () => {
    setEdit(null);
    load(page);
  };

  const getStatusDot = (active) => (
    <span className={`shift-status-dot ${active ? "green" : "gray"}`}></span>
  );

  const handleToggle = async (id, next) => {
    try {
      await toggleShiftActive(id, next);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: next } : r))
      );
    } catch (e) {
      alert(e.message || "Toggle failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this shift?")) return;
    try {
      await deleteShift(id);
      load(page);
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  return (
    <div className="userdash-outer">
      <AdminTopBar />
      <div className="userdash-inner">
        <AdminSidebar activeMenu="Admin" activeSub="Shifts" />
        <div className="userdash-main adminshifts-main">
          <div className="adminshifts-header-row">
            <div>
              <div className="adminshifts-title">Shifts</div>
              <div className="adminshifts-subtitle">
                Manage all Shifts and their timings
              </div>
            </div>
            <div className="adminshifts-header-actions">
              <div className="adminshifts-breadcrumb">
                Admin / <span className="breadcrumb-active">Shifts</span>
              </div>
              <button
                className="adminshifts-add-btn"
                onClick={() => setShowAddShiftModal(true)}
              >
                + Add New Shift
              </button>
            </div>
          </div>

          <div className="adminshifts-tablecard">
            <div className="adminshifts-searchbar-row">
              <input
                type="text"
                className="adminshifts-searchbar"
                placeholder="🔍 Search here"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <table className="adminshifts-table">
              <thead>
                <tr>
                  <th>Shifts</th>
                  <th className="activity-col">Activity</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="adminshifts-name">{r.name}</span>
                    </td>
                    <td>
                      <span className="adminshifts-status">
                        {getStatusDot(r.is_active)}
                        <span className="adminshifts-status-text">
                          {r.is_active ? "Active" : "In-active"}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="adminshifts-actions">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={!!r.is_active}
                            onChange={(e) =>
                              handleToggle(r.id, e.target.checked)
                            }
                          />
                          <span className="slider"></span>
                        </label>
                        <button
                          className="adminshifts-edit-btn"
                          onClick={() => setEdit(r)}
                        >
                          <img src={editPen} alt="Edit" />
                        </button>
                        <button
                          className="adminshifts-edit-btn"
                          onClick={() => handleDelete(r.id)}
                        >
                          <img src={deleteBin} alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 && (
                  <tr className="adminshifts-empty-row">
                    <td>No shifts found</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
                {loading && (
                  <tr className="adminshifts-empty-row">
                    <td>Loading…</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="adminshifts-pagination">
              <button
                className="adminshifts-page"
                onClick={() => {
                  if (page > 1) load(page - 1);
                }}
                disabled={page <= 1}
                style={{ opacity: page <= 1 ? 0.5 : 1 }}
              >
                ‹
              </button>
              <span className="adminshifts-page">{page}</span>
              <button
                className="adminshifts-page"
                onClick={() => {
                  if (page < pageCount) load(page + 1);
                }}
                disabled={page >= pageCount}
                style={{ opacity: page >= pageCount ? 0.5 : 1 }}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {showAddShiftModal && <AddNewShift onClose={onAdded} />}
        {edit && (
          <EditShift
            shift={edit}
            onClose={onEdited}
            onCancel={() => setEdit(null)}
          />
        )}
      </div>
    </div>
  );
}

export default AdminShifts;
