import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import downloadIcon from "../assets/icons/download_arrow.png";
import "./AdminReports.css";
import { listAdminReports, downloadReport, getDropdowns } from "../lib/api";

const AdminReports = () => {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    shift: "",
    department: "",
    station: "",
    testType: "BA", // BA | PA
  });

  // dropdowns (ACTIVE only)
  const [departments, setDepartments] = useState([]);
  const [stations, setStations] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [searched, setSearched] = useState(false);
  const [serverRows, setServerRows] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await getDropdowns();
        setDepartments((d.departments || []).filter(x => x.is_active).map(x => x.name));
        setStations((d.stations || []).filter(x => x.is_active).map(x => x.code)); // codes only
        setShifts((d.shifts || []).filter(x => x.is_active).map(x => x.name));
      } catch {
        // fallback options (keeps UI usable)
        setDepartments(["Ground Ops", "Flight Ops", "In Flight services", "Security", "Engineering"]);
        setStations(["COK", "MAA", "HYD", "DEL", "BLR"]);
        setShifts(["Morning", "Night"]);
      }
    })();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setSearched(false);
    setShowWarning(false);
    setPage(1);
  };

  const handleRadioChange = (e) => {
    setFilters({ ...filters, testType: e.target.value });
    setSearched(false);
    setShowWarning(false);
    setPage(1);
  };

  const handleTableSearch = (e) => {
    setTableSearch(e.target.value);
    setPage(1);
  };

  async function handleSearch(e) {
    e.preventDefault();
    if (!filters.from || !filters.to) {
      setShowWarning(true);
      return;
    }

    setLoading(true);
    setErr("");
    try {
      const res = await listAdminReports({
        date_from: filters.from,
        date_to: filters.to,
        shift: filters.shift || "",
        department: filters.department || "",
        station: filters.station || "",   // code
        test_type: filters.testType || "",
        page: 1,
        page_size: 200,
      });
      setServerRows(res?.items ?? []);
      setSearched(true);
      setTableSearch("");
      setPage(1);
    } catch (e2) {
      setErr(typeof e2?.message === "string" ? e2.message : "Failed to load reports");
      setServerRows([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return (serverRows || []).filter((r) =>
      q ? (r.file_name || "").toLowerCase().includes(q) : true
    );
  }, [serverRows, tableSearch]);

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

  const fmt = (iso) => (iso ? iso.split("-").reverse().join("-") : "");

  return (
    <div className="ar-outer">
      <AdminSidebar />
      <div className="ar-inner">
        <AdminTopBar />
        <main className="ar-main">
          <div className="ar-header">
            <div className="ar-title">Search Reports</div>
            <div className="ar-breadcrumb">
              Admin / <span className="ar-bold">Search Reports</span>
            </div>
          </div>

          <form className="ar-filters" onSubmit={handleSearch}>
            <div className="ar-filter-group">
              <label htmlFor="from">From</label>
              <input
                id="from"
                name="from"
                type="date"
                value={filters.from}
                onChange={handleFilterChange}
                className="ar-input ar-input-date"
              />
            </div>
            <div className="ar-filter-group">
              <label htmlFor="to">To</label>
              <input
                id="to"
                name="to"
                type="date"
                value={filters.to}
                onChange={handleFilterChange}
                className="ar-input ar-input-date"
              />
            </div>
            <div className="ar-filter-group">
              <label htmlFor="shift">Shift</label>
              <select
                id="shift"
                name="shift"
                value={filters.shift}
                onChange={handleFilterChange}
                className="ar-input ar-input-select"
              >
                <option value="">All</option>
                {shifts.map((opt) => (
                  <option value={opt} key={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="ar-filter-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="ar-input ar-input-select"
              >
                <option value="">All</option>
                {departments.map((opt) => (
                  <option value={opt} key={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="ar-filter-group">
              <label htmlFor="station">Station</label>
              <select
                id="station"
                name="station"
                value={filters.station}
                onChange={handleFilterChange}
                className="ar-input ar-input-select"
              >
                <option value="">All</option>
                {stations.map((opt) => (
                  <option value={opt} key={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="ar-radio-group">
              <label className="ar-radio-label">
                <input
                  type="radio"
                  name="testType"
                  value="BA"
                  checked={filters.testType === "BA"}
                  onChange={handleRadioChange}
                  className="ar-radio-input"
                />
                <span className="ar-radio-custom"></span>
                BA
              </label>
              <label className="ar-radio-label" style={{ marginLeft: "20px" }}>
                <input
                  type="radio"
                  name="testType"
                  value="PA"
                  checked={filters.testType === "PA"}
                  onChange={handleRadioChange}
                  className="ar-radio-input"
                />
                <span className="ar-radio-custom"></span>
                PA
              </label>
            </div>

            <button className="ar-search-btn" type="submit" disabled={!filters.from || !filters.to || loading}>
              {loading ? "Loading..." : "Search"}
            </button>
          </form>

          {showWarning && (
            <div className="ar-warning">Please select both "From" and "To" dates before searching.</div>
          )}
          {err && <div className="ar-warning">{err}</div>}

          {searched && (
            <div className="ar-table-card">
              <div className="ar-table-search-row">
                <input
                  type="text"
                  className="ar-search-input"
                  placeholder="Search here"
                  value={tableSearch}
                  onChange={handleTableSearch}
                />
              </div>
              <table className="ar-table">
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
                          <button className="ar-dl-btn" onClick={() => handleDownload(r.id)}>
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
            <div className="ar-pagination">
              <button
                className="ar-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt; Previous
              </button>
              <span className="ar-page-num">{page}</span>
              <button
                className="ar-page-btn"
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
};

export default AdminReports;
