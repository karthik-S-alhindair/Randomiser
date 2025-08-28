import React, { useEffect, useMemo, useState } from "react";
import UserSidebar from "../components/Layout/UserSidebar";
import UserTopBar from "../components/Layout/UserTopBar";
import downloadIcon from "../assets/icons/download_arrow.png";
import "./UserReports.css";
import { useUser } from "../context/UserContext";
import { listUserReports, downloadReport } from "../lib/api";

// UI lists (for locked dropdowns to show a value)
const departmentOptions = [
  "Ground Ops",
  "Flight Ops",
  "In Flight services",
  "Security",
  "Engineering",
];
const stationOptions = ["COK", "MAA", "HYD", "DEL", "BLR"];
const shiftOptions = ["Morning", "Night"];

export default function UserReports() {
  const { user } = useUser();

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    shift: "",
    department: "",
    station: "",
  });
  const [searched, setSearched] = useState(false);

  const [serverRows, setServerRows] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fmt = (iso) => (iso ? iso.split("-").reverse().join("-") : "");

  // Lock dept/station to the logged-in user
  useEffect(() => {
    if (!user) return;
    setFilters((prev) => ({
      ...prev,
      department: user.department || prev.department || "",
      station: user.station || prev.station || "",
    }));
  }, [user]);

  // keep the locked values in the option lists
  const departmentChoices = useMemo(() => {
    const set = new Set([filters.department, ...departmentOptions]);
    return Array.from(set).filter(Boolean);
  }, [filters.department]);
  const stationChoices = useMemo(() => {
    const set = new Set([filters.station, ...stationOptions]);
    return Array.from(set).filter(Boolean);
  }, [filters.station]);

  function handleFilterChange(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSearched(false);
    setShowWarning(false);
    setPage(1);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!filters.from || !filters.to) {
      setShowWarning(true);
      return;
    }
    if (!user?.username) return;

    setLoading(true);
    setErr("");
    try {
      const res = await listUserReports({
        username: user.username,
        date_from: filters.from,
        date_to: filters.to,
        page: 1,
        page_size: 100,
      });
      setServerRows(res?.items ?? []);
      setSearched(true);
      setTableSearch("");
      setPage(1);
    } catch (e2) {
      setErr(
        typeof e2?.message === "string" ? e2.message : "Failed to load reports"
      );
      setServerRows([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return (serverRows || []).filter((r) => {
      if (
        filters.shift &&
        (r.shift || "").toLowerCase() !== filters.shift.toLowerCase()
      )
        return false;
      if (filters.department && (r.department || "") !== filters.department)
        return false;
      if (filters.station && (r.station || "") !== filters.station)
        return false;
      if (!q) return true;
      return (r.file_name || "").toLowerCase().includes(q);
    });
  }, [
    serverRows,
    tableSearch,
    filters.shift,
    filters.department,
    filters.station,
  ]);

  const perPage = 7;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const paginated = useMemo(
    () => filteredRows.slice((page - 1) * perPage, page * perPage),
    [filteredRows, page]
  );

  async function handleDownload(id) {
    try {
      const { blob, fileName } = await downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      alert(typeof e?.message === "string" ? e.message : "Download failed");
    }
  }

  return (
    <div className="ur-outer">
      <UserTopBar />
      <UserSidebar />
      <div className="ur-inner">
        <main className="ur-main">
          <div className="ur-header">
            <div className="ur-title">Search Reports</div>
            <div className="ur-breadcrumb">
              User / <span className="ur-bold">Search Reports</span>
            </div>
          </div>

          <form className="ur-filters" onSubmit={handleSearch}>
            <div className="ur-filter-group">
              <label htmlFor="from">From</label>
              <input
                id="from"
                name="from"
                type="date"
                value={filters.from}
                onChange={handleFilterChange}
                className="ur-input ur-input-date"
              />
            </div>
            <div className="ur-filter-group">
              <label htmlFor="to">To</label>
              <input
                id="to"
                name="to"
                type="date"
                value={filters.to}
                onChange={handleFilterChange}
                className="ur-input ur-input-date"
              />
            </div>
            <div className="ur-filter-group">
              <label htmlFor="shift">Shift</label>
              <select
                id="shift"
                name="shift"
                value={filters.shift}
                onChange={handleFilterChange}
                className="ur-input ur-input-select"
              >
                <option value="">All</option>
                {shiftOptions.map((opt) => (
                  <option value={opt} key={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="ur-filter-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={filters.department}
                onChange={() => {}}
                className="ur-input ur-input-select"
                disabled
                title="Locked to your assigned department"
                style={{ cursor: "not-allowed", opacity: 0.8 }}
              >
                {departmentChoices.map((opt) => (
                  <option value={opt} key={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="ur-filter-group">
              <label htmlFor="station">Station</label>
              <select
                id="station"
                name="station"
                value={filters.station}
                onChange={() => {}}
                className="ur-input ur-input-select"
                disabled
                title="Locked to your assigned station"
                style={{ cursor: "not-allowed", opacity: 0.8 }}
              >
                {stationChoices.map((opt) => (
                  <option value={opt} key={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="ur-search-btn"
              type="submit"
              disabled={!filters.from || !filters.to || loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </form>

          {showWarning && (
            <div className="ur-warning">
              Please select both "From" and "To" dates before searching.
            </div>
          )}
          {err && <div className="ur-warning">{err}</div>}

          {searched && (
            <div className="ur-table-card">
              <div className="ur-table-search-row">
                <input
                  type="text"
                  className="ur-search-input"
                  placeholder="Search here"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <table className="ur-table">
                <thead>
                  <tr>
                    <th>File name</th>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Department</th>
                    <th>Station</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((r) => (
                      <tr key={r.id}>
                        <td>{r.file_name}</td>
                        <td>{fmt(r.date)}</td>
                        <td>{r.shift}</td>
                        <td>{r.department}</td>
                        <td>{r.station}</td>
                        <td>
                          <button
                            className="ur-dl-btn"
                            onClick={() => handleDownload(r.id)}
                          >
                            <img src={downloadIcon} alt="Download" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {searched && (
            <div className="ur-pagination">
              <button
                className="ur-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt; Previous
              </button>
              <span className="ur-page-num">{page}</span>
              <button
                className="ur-page-btn"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount || pageCount === 0}
              >
                Next &gt;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
