import React, { useEffect, useRef, useState } from "react";
import AdminSidebar from "../components/Layout/AdminSidebar";
import AdminTopBar from "../components/Layout/AdminTopBar";
import { getDropdowns } from "../lib/api";
import "./AdminUploadStaffData.css";

// force a real file download from the response
async function adminGenerateAndDownload(apiBase, form) {
  const res = await fetch(`${apiBase}/api/uploads/admin-generate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText || "Upload failed";
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null);
      if (j && (j.detail || j.message)) detail = j.detail || j.message;
    } else {
      const t = await res.text().catch(() => "");
      if (t) detail = t;
    }
    throw new Error(detail);
  }

  const cd = res.headers.get("Content-Disposition") || "";
  const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(cd);
  const filename = decodeURIComponent(m?.[1] || m?.[2] || "report.xlsx");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminUploadStaffData() {
  // dropdowns (ACTIVE only). stations are CODES
  const [departments, setDepartments] = useState([]);
  const [stations, setStations] = useState([]);
  const [shifts, setShifts] = useState([]);

  // selections
  const [date] = useState(() => new Date().toISOString().slice(0, 10)); // shown only; server uses IST
  const [shift, setShift] = useState("");
  const [department, setDepartment] = useState("");
  const [station, setStation] = useState("");
  const [percentage, setPercentage] = useState("");
  const [mode, setMode] = useState("BA"); // BA | PA
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await getDropdowns();
        const dep = (d.departments || [])
          .filter((x) => x.is_active)
          .map((x) => x.name);
        const stn = (d.stations || [])
          .filter((x) => x.is_active)
          .map((x) => x.code);
        const shf = (d.shifts || [])
          .filter((x) => x.is_active)
          .map((x) => x.name);
        setDepartments(dep);
        setStations(stn);
        setShifts(shf);
        // defaults
        setDepartment(dep[0] || "");
        setStation(stn[0] || "");
        setShift(shf[0] || "");
      } catch (e) {
        // fallback to hard-coded values if dropdown API fails
        setDepartments([
          "Flight Ops",
          "Cabin Crew",
          "Ground Staff",
          "Engineering",
          "Security",
        ]);
        setStations(["COK", "DEL", "BOM", "BLR", "MAA", "HYD", "TRV"]);
        setShifts(["Day", "Night"]);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      const msg = "Please choose an Excel file.";
      setError(msg);
      alert(msg);
      return;
    }
    const name = (file.name || "").toLowerCase();
    if (!(name.endsWith(".xlsx") || name.endsWith(".xls"))) {
      const msg = "Only Excel files (.xlsx or .xls) are allowed.";
      setError(msg);
      alert(msg);
      return;
    }
    if (!station) {
      const msg = "Please select a Station.";
      setError(msg);
      alert(msg);
      return;
    }
    if (
      percentage !== "" &&
      (Number.isNaN(+percentage) || +percentage < 0 || +percentage > 100)
    ) {
      const msg = "Percentage must be a number between 0 and 100.";
      setError(msg);
      alert(msg);
      return;
    }

    const form = new FormData();
    form.append("shift", shift);
    form.append("department", department);
    form.append("station", station); // code
    form.append("percent", String(percentage || 0));
    form.append("test_type", mode); // BA/PA
    form.append("file", file);

    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL || "";
      await adminGenerateAndDownload(API, form);
    } catch (err) {
      const msg =
        err?.message || "Something went wrong while generating the report.";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    setShift(shifts[0] || "");
    setDepartment(departments[0] || "");
    setStation(stations[0] || "");
    setPercentage("");
    setMode("BA");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    if (formRef.current) formRef.current.reset();
  };

  return (
    <div className="userdash-outer">
      <AdminTopBar />
      <div className="userdash-inner">
        <AdminSidebar />
        <div className="userdash-main">
          <div className="useruploadstaff-content">
            <div className="useruploadstaff-header-row">
              <div className="useruploadstaff-title">New File Upload</div>
              <div className="useruploadstaff-breadcrumb">
                <span>Upload Staff Data/</span>
                <span style={{ fontWeight: 700 }}> Daily Documents Upload</span>
              </div>
            </div>

            <form
              className="useruploadstaff-form"
              onSubmit={handleSubmit}
              ref={formRef}
            >
              {/* First row */}
              <div className="useruploadstaff-fields">
                <div className="useruploadstaff-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={date}
                    disabled
                    readOnly
                    title="Date is set by server (IST)"
                  />
                </div>

                <div className="useruploadstaff-field">
                  <label>Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                  >
                    {shifts.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="useruploadstaff-field">
                  <label>Departments</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {departments.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="useruploadstaff-field">
                  <label>File</label>
                  <input
                    type="file"
                    ref={fileRef}
                    accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f) {
                        const nm = (f.name || "").toLowerCase();
                        const ok = nm.endsWith(".xlsx") || nm.endsWith(".xls");
                        if (!ok) {
                          alert(
                            "Only Excel files (.xlsx or .xls) are allowed."
                          );
                          e.target.value = "";
                          setFile(null);
                          return;
                        }
                      }
                      setFile(f);
                    }}
                  />
                </div>
              </div>

              {/* Second row */}
              <div
                className="useruploadstaff-fields useruploadstaff-fields-bottom"
                style={{ alignItems: "flex-end" }}
              >
                <div className="useruploadstaff-field">
                  <label>Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="Enter %"
                  />
                </div>

                <div className="useruploadstaff-field">
                  <label>Station</label>
                  <select
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                  >
                    <option value="">Select</option>
                    {stations.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginLeft: "18px",
                    minWidth: "110px",
                  }}
                >
                  <label
                    className="admin-radio-label"
                    style={{ marginBottom: 0 }}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value="BA"
                      checked={mode === "BA"}
                      onChange={() => setMode("BA")}
                      className="admin-radio-input"
                    />
                    <span className="admin-radio-custom"></span>
                    BA
                  </label>
                  <label
                    className="admin-radio-label"
                    style={{ marginBottom: 0 }}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value="PA"
                      checked={mode === "PA"}
                      onChange={() => setMode("PA")}
                      className="admin-radio-input"
                    />
                    <span className="admin-radio-custom"></span>
                    PA
                  </label>
                </div>

                <div style={{ flex: 1 }} />

                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    marginBottom: 0,
                  }}
                >
                  <button
                    type="submit"
                    className="useruploadstaff-btn submit"
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                  <button
                    type="button"
                    className="useruploadstaff-btn cancel"
                    onClick={handleUndo}
                    disabled={loading}
                  >
                    Undo
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="form-error"
                  role="alert"
                  style={{ marginTop: 10 }}
                >
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
