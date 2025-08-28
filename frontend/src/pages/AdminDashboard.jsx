// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import filterIcon from "../assets/icons/Filter_Settings.png";
import "./AdminDashboard.css";
import "../components/Layout/AdminLayoutOverrides.css";

const dataBlue = [
  { name: "SEC", value: 267 },
  { name: "ENGG", value: 221 },
  { name: "GSD", value: 165 },
  { name: "DES", value: 147 },
];
const COLORS_BLUE = ["#1652c4", "#3573b5", "#93c5fd", "#8dc0ee"];

const dataRed = [
  { name: "SEC", value: 8 },
  { name: "ENGG", value: 11 },
  { name: "GSD", value: 9 },
  { name: "DES", value: 15 },
];
const COLORS_Red = ["#f43f3f", "#f47272", "#f9a8a8", "#fca8a8"];

export default function AdminDashboard() {
  // Modal state
  const [showFilter, setShowFilter] = useState(false);
  const [pieFrom, setPieFrom] = useState("");
  const [pieTo, setPieTo] = useState("");
  const [appliedPieFilter, setAppliedPieFilter] = useState({ from: "", to: "" });

  const openFilter = () => setShowFilter(true);
  const closeFilter = () => setShowFilter(false);

  const onApply = (e) => {
    e.preventDefault();
    if (!pieFrom || !pieTo) return; // require both dates
    setAppliedPieFilter({ from: pieFrom, to: pieTo });
    setShowFilter(false);
    // TODO: use appliedPieFilter to refetch the two pies
  };

  // Close on ESC
  useEffect(() => {
    if (!showFilter) return;
    const onKey = (e) => e.key === "Escape" && closeFilter();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFilter]);

  // Close on backdrop click
  const backdropRef = useRef(null);
  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) closeFilter();
  };

  return (
    <div className="admin-layout">
    <div className="admindash-outer">
      <AdminTopBar />
      <div className="admindash-inner">
        <AdminSidebar />
        <div className="admindash-main">
          {/* Title row with filter icon */}
          <div className="admindash-title-row">
            <div>
              <div className="admindash-title">Dashboard Overview</div>
              <div className="admindash-desc">
                Manage all administrative accounts and their access levels
              </div>
            </div>
            <button
              className="admindash-filter-btn"
              onClick={openFilter}
              aria-haspopup="dialog"
              aria-controls="admin-pie-filter-modal"
              aria-label="Open filter settings"
              title="Filter settings"
            >
              <img src={filterIcon} alt="" className="admindash-filter-icon" />
            </button>
          </div>

          <hr className="admindash-divider" />

          <div className="userdash-cards-row">
            {/* Card 1 */}
            <div className="userdash-card userdash-card-blue">
              <div className="userdash-card-left">
                <div className="userdash-card-label">Total Staff Records</div>
                <div className="userdash-big-number">800</div>
                <div className="userdash-card-bottom" />
                <div className="userdash-pie-legend">
                  {dataBlue.map((entry, idx) => (
                    <div key={entry.name} className="userdash-pie-legend-row">
                      <span
                        className="userdash-pie-legend-color"
                        style={{ background: COLORS_BLUE[idx % COLORS_BLUE.length] }}
                      />
                      <span className="userdash-pie-legend-label">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="userdash-pie-outer">
                <ResponsiveContainer width={260} height={210}>
                  <PieChart>
                    <Pie
                      data={dataBlue}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={0}
                      stroke="white"
                      strokeWidth={2}
                    >
                      {dataBlue.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS_BLUE[idx % COLORS_BLUE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2 */}
            <div className="userdash-card userdash-card-red">
              <div className="userdash-card-left">
                <div className="userdash-card-label">Random Selection</div>
                <div className="userdash-big-number">43</div>
                <div className="userdash-card-bottom" />
                <div className="userdash-pie-legend">
                  {dataRed.map((entry, idx) => (
                    <div key={entry.name} className="userdash-pie-legend-row">
                      <span
                        className="userdash-pie-legend-color"
                        style={{ background: COLORS_Red[idx % COLORS_Red.length] }}
                      />
                      <span className="userdash-pie-legend-label">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="userdash-pie-outer">
                <ResponsiveContainer width={260} height={210}>
                  <PieChart>
                    <Pie
                      data={dataRed}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={0}
                      stroke="white"
                      strokeWidth={2}
                    >
                      {dataRed.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS_Red[idx % COLORS_Red.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Modal Overlay */}
          {showFilter && (
            <div
              className="admindash-modal-backdrop"
              ref={backdropRef}
              onMouseDown={onBackdropClick}
            >
              <div
                className="admindash-modal"
                id="admin-pie-filter-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="adminPieFilterTitle"
              >
                <div className="admindash-modal-header">
                  <h3 id="adminPieFilterTitle" className="admindash-modal-title">
                    Pie Chart Filter
                  </h3>
                  <div className="admindash-modal-breadcrumb">
                    Admin / <b>Pie Chart Filter Settings</b>
                  </div>
                </div>

                <form className="admindash-modal-body" onSubmit={onApply}>
                  <div className="admindash-modal-row">
                    <div className="admindash-modal-field">
                      <label htmlFor="adminPieFrom">From</label>
                      <input
                        id="adminPieFrom"
                        type="date"
                        value={pieFrom}
                        onChange={(e) => setPieFrom(e.target.value)}
                      />
                    </div>
                    <div className="admindash-modal-field">
                      <label htmlFor="adminPieTo">To</label>
                      <input
                        id="adminPieTo"
                        type="date"
                        value={pieTo}
                        onChange={(e) => setPieTo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admindash-modal-actions">
                    <button
                      type="submit"
                      className="admindash-btn admindash-btn-primary"
                      disabled={!pieFrom || !pieTo}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      className="admindash-btn admindash-btn-danger"
                      onClick={closeFilter}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
