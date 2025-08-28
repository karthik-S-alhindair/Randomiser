// REPLACE FILE CONTENT
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import editPen from "../assets/icons/edit_pen.png";
import AddNewStation from "./AddNewStation";
import "./AdminStation.css";
import {
  listStations,
  toggleStationActive,
  deleteStation,
  updateStation
} from "../lib/api";
import DeleteBin from "../assets/icons/Delete_bin.png"; // optional: show beside pen

function AdminStation() {
  const perPage = 8;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [editing, setEditing] = useState(null); // {id, name, code, is_active}

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total]);

  const load = useCallback(async (goto = page) => {
    setLoading(true);
    try {
      const data = await listStations({ page: goto, per_page: perPage, q: search });
      setRows(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || goto);
    } catch (e) {
      alert(e.message || "Failed to load stations");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    const id = setTimeout(() => load(1), 250);
    return () => clearTimeout(id);
  }, [search, load]);

  const getStatusElem = (isActive) => (
    <span className="adminstation-status">
      <span className={`adminstation-status-dot ${isActive ? "green" : "gray"}`}></span>
      <span className={`adminstation-status-text${isActive ? " active" : ""}`}>
        {isActive ? "Active" : "In-active"}
      </span>
    </span>
  );

  const handleToggle = async (row) => {
    try {
      await toggleStationActive(row.id, !row.is_active);
      load(page);
    } catch (e) {
      alert(e.message || "Toggle failed");
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete station "${row.name}" (${row.code}) ?`)) return;
    try {
      await deleteStation(row.id);
      const needPrev = rows.length === 1 && page > 1; // empty page after delete
      load(needPrev ? page - 1 : page);
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  // simple pagination UI:  Prev  [1] [2] [3] ...  Next
  const pg = [];
  for (let i = 1; i <= pageCount && i <= 3; i++) pg.push(i);

  return (
    <div className="userdash-outer">
      <AdminTopBar />
      <div className="userdash-inner">
        <AdminSidebar activeMenu="Admin" activeSub="Station" />
        <div className="userdash-main adminstation-main">
          <div className="adminstation-header-row">
            <div>
              <div className="adminstation-title">Stations</div>
              <div className="adminstation-subtitle">Manage all Station and activity</div>
            </div>
            <div className="adminstation-header-actions">
              <div className="adminstation-breadcrumb">
                Admin / <span className="breadcrumb-active">Station</span>
              </div>
              <button className="adminstation-add-btn" onClick={() => setShowAddStationModal(true)}>
                + Add New Station
              </button>
            </div>
          </div>

          <div className="adminstation-tablecard">
            <div className="adminstation-searchbar-row">
              <input
                type="text"
                className="adminstation-searchbar"
                placeholder="🔍 Search here"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <table className="adminstation-table">
              <thead>
                <tr>
                  <th>Station Name</th>
                  <th>Station Code</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={4} style={{textAlign:"center"}}>No stations found.</td></tr>
                )}
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td><span className="adminstation-name">{s.name}</span></td>
                    <td><span className="adminstation-code">{s.code}</span></td>
                    <td>{getStatusElem(s.is_active)}</td>
                    <td>
                      <div className="adminstation-actions">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={!!s.is_active}
                            onChange={() => handleToggle(s)}
                          />
                          <span className="slider"></span>
                        </label>
                        <button className="adminstation-edit-btn" onClick={() => setEditing(s)}>
                          <img src={editPen} alt="Edit" />
                        </button>
                        <button className="adminstation-edit-btn" onClick={() => handleDelete(s)}>
                          <img src={DeleteBin} alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="adminstation-pagination">
              <button
                className="adminstation-pg-nav"
                onClick={() => load(page - 1)}
                disabled={page <= 1}
              >
                &lt; Previous
              </button>
              {pg.map(n => (
                <button
                  key={n}
                  className={`adminstation-page ${n === page ? "active" : ""}`}
                  onClick={() => load(n)}
                >{n}</button>
              ))}
              {pageCount > 3 && <span className="adminstation-page dots">...</span>}
              <button
                className="adminstation-pg-nav"
                onClick={() => load(page + 1)}
                disabled={page >= pageCount}
              >
                Next &gt;
              </button>
            </div>
          </div>
        </div>

        {showAddStationModal && (
          <AddNewStation
            onClose={() => setShowAddStationModal(false)}
            onSaved={() => { setShowAddStationModal(false); load(1); }}
          />
        )}
        {editing && (
          <EditStation
            station={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(page); }}
          />
        )}
      </div>
    </div>
  );
}

export default AdminStation;

// --- Inline edit overlay to keep your exact modal look & feel ---
function EditStation({ station, onClose, onSaved }) {
  const [name, setName] = useState(station.name);
  const [code, setCode] = useState(station.code);
  const [active, setActive] = useState(!!station.is_active);

  const onSave = async () => {
    try {
      await updateStation(station.id, { name, code, is_active: active });
      onSaved && onSaved();
    } catch (e) {
      alert(e.message || "Update failed");
    }
  };

  return (
    <div className="addstation-modal-overlay">
      <div className="addstation-modal">
        <div className="addstation-modal-header-row">
          <div className="addstation-modal-title">Edit Station</div>
          <div className="addstation-modal-breadcrumb">Admin / station / <b>Edit Station</b></div>
        </div>
        <form className="addstation-modal-form" autoComplete="off" onSubmit={(e)=>e.preventDefault()}>
          <div className="addstation-fields-row">
            <div className="addstation-field">
              <label>Station Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div className="addstation-field">
              <label>Station Code</label>
              <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="addstation-fields-row" style={{ marginTop: "8px" }}>
            <div className="addstation-toggle-field">
              <label className="switch">
                <input type="checkbox" checked={active} onChange={()=>setActive(a=>!a)} />
                <span className="slider"></span>
              </label>
              <span className="addstation-toggle-label">Active / Inactive</span>
            </div>
          </div>
          <div className="addstation-modal-btn-row">
            <button type="button" className="addstation-modal-btn save" onClick={onSave}>Save</button>
            <button type="button" className="addstation-modal-btn cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
