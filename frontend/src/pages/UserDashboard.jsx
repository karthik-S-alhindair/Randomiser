import React, { useState, useEffect, useRef } from "react";
import SidebarUser from "../components/Layout/UserSidebar";
import UserTopBar from "../components/Layout/UserTopBar";
import { useUser } from "../context/UserContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import filterIcon from "../assets/icons/Filter_Settings.png";
import "./UserDashboard.css";

/* demo data (replace later when we wire to backend) */
const dataBlue = [
  { name: "SEC", value: 60 },
  { name: "ENGG", value: 47 },
  { name: "GSD", value: 20 },
  { name: "DES", value: 50 },
];
const COLORS_BLUE = ["#1652c4", "#3573b5", "#93c5fd", "#8dc0ee"];

const dataRed = [
  { name: "SEC", value: 11 },
  { name: "ENGG", value: 7 },
  { name: "GSD", value: 3 },
  { name: "DES", value: 15 },
];
const COLORS_RED = ["#f43f3f", "#f47272", "#f9a8a8", "#fca8a8"];

export default function UserDashboard() {
  const { user } = useUser();
  const displayName = user?.name || user?.username || "User";

  // Modal state
  const [showFilter, setShowFilter] = useState(false);
  const [pieFrom, setPieFrom] = useState("");
  const [pieTo, setPieTo] = useState("");
  const [appliedPieFilter, setAppliedPieFilter] = useState({ from: "", to: "" });

  const openFilterSettings = () => setShowFilter(true);
  const closeFilterSettings = () => setShowFilter(false);

  const onApply = (e) => {
    e.preventDefault();
    if (!pieFrom || !pieTo) return;
    setAppliedPieFilter({ from: pieFrom, to: pieTo });
    setShowFilter(false);
    // TODO: fetch/update pie data based on appliedPieFilter
  };

  // Close on ESC while modal open
  useEffect(() => {
    if (!showFilter) return;
    const onKey = (e) => e.key === "Escape" && closeFilterSettings();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFilter]);

  // Close on backdrop click
  const backdropRef = useRef(null);
  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) closeFilterSettings();
  };

  return (
    <div className="userdash-outer">
      <UserTopBar />
      <SidebarUser />

      {/* ONLY main scrolls */}
      <main className="userdash-main">
        <div className="userdash-content">
          <h2 className="userdash-welcome">Welcome back {displayName}!</h2>

          {/* Title row with filter icon */}
          <div className="userdash-title-row">
            <h1 className="userdash-title">Staff Dashboard Overview</h1>
            <button
              className="userdash-filter-btn"
              onClick={openFilterSettings}
              aria-haspopup="dialog"
              aria-controls="pie-filter-modal"
              aria-label="Open filter settings"
              title="Filter settings"
            >
              <img src={filterIcon} alt="" className="userdash-filter-icon" />
            </button>
          </div>

          <div className="userdash-cards-row">
            {/* Card 1 */}
            <div className="userdash-card userdash-card-blue">
              <div className="userdash-card-left">
                <div className="userdash-card-label">Total Staff Records</div>
                <div className="userdash-big-number">800</div>
                <div className="userdash-card-bottom" />
                {/* Pie legend */}
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
                      {dataBlue.map((_, idx) => (
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
                        style={{ background: COLORS_RED[idx % COLORS_RED.length] }}
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
                      {dataRed.map((_, idx) => (
                        <Cell key={idx} fill={COLORS_RED[idx % COLORS_RED.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* End cards row */}
        </div>

        {/* Modal Overlay */}
        {showFilter && (
          <div
            className="userdash-modal-backdrop"
            ref={backdropRef}
            onMouseDown={onBackdropClick}
          >
            <div
              className="userdash-modal"
              id="pie-filter-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pieFilterTitle"
            >
              <div className="userdash-modal-header">
                <h3 id="pieFilterTitle" className="userdash-modal-title">
                  Pie Chart Filter
                </h3>
                <div className="userdash-modal-breadcrumb">
                  User / <b>Pie Chart Filter Settings</b>
                </div>
              </div>

              <form className="userdash-modal-body" onSubmit={onApply}>
                <div className="userdash-modal-row">
                  <div className="userdash-modal-field">
                    <label htmlFor="pieFrom">From</label>
                    <input
                      id="pieFrom"
                      type="date"
                      value={pieFrom}
                      onChange={(e) => setPieFrom(e.target.value)}
                    />
                  </div>
                  <div className="userdash-modal-field">
                    <label htmlFor="pieTo">To</label>
                    <input
                      id="pieTo"
                      type="date"
                      value={pieTo}
                      onChange={(e) => setPieTo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="userdash-modal-actions">
                  <button
                    type="submit"
                    className="userdash-btn userdash-btn-primary"
                    disabled={!pieFrom || !pieTo}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="userdash-btn userdash-btn-danger"
                    onClick={closeFilterSettings}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
