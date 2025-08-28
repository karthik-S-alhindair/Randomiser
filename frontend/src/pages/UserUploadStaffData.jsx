import React, { useEffect, useRef, useState } from "react";
import SidebarUser from "../components/Layout/UserSidebar";
import UserTopBar from "../components/Layout/UserTopBar";
import { useUser } from "../context/UserContext";
import { istInitUpload, generateUploadReport, getDropdowns } from "../lib/api";
import "./UserUploadStaffData.css";

export default function UserUploadStaffData() {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);

  // Server-authoritative defaults
  const [dateIST, setDateIST] = useState("--");
  const [department, setDepartment] = useState("");
  const [percent, setPercent] = useState(25);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [station, setStation] = useState("");
  const [shift, setShift] = useState("");

  // Dropdown options (active only); stations must be CODES
  const [stationOptions, setStationOptions] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);

  // Keep original defaults for Undo
  const defaultsRef = useRef({
    station: "",
    shift: "",
    department: "",
    percent: 25,
  });
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Init values for this user (server decides)
        const u = user?.username;
        const init = await istInitUpload(u);
        if (!mounted) return;
        setDateIST(init.date_ist);
        setDepartment(init.department || "");
        setPercent(init.percent ?? 25);
        setStation(init.station || "");
        setName(init.name || "");
        setUsername(init.username || u || "");

        // 2) Live dropdowns (ACTIVE only)
        const d = await getDropdowns();
        const activeStations = (d.stations || [])
          .filter((s) => s.is_active)
          .map((s) => s.code);
        const activeShifts = (d.shifts || [])
          .filter((s) => s.is_active)
          .map((s) => s.name);

        setStationOptions(activeStations);
        setShiftOptions(activeShifts);

        // default shift if server didn’t set
        if (!init.shift && activeShifts.length) setShift(activeShifts[0]);
        else setShift(init.shift || "");

        // save defaults for Undo
        defaultsRef.current = {
          station: init.station || activeStations[0] || "",
          shift: init.shift || activeShifts[0] || "",
          department: init.department || "",
          percent: init.percent ?? 25,
        };
      } catch (e) {
        console.error(e);
        alert(e.message || "Failed to load defaults/dropdowns");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.username]);

  function onUndo() {
    setShift(defaultsRef.current.shift);
    setStation(defaultsRef.current.station);
    setDepartment(defaultsRef.current.department);
    setPercent(defaultsRef.current.percent);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      return;
    }
    const name = (f.name || "").toLowerCase();
    const ok = name.endsWith(".xlsx") || name.endsWith(".xls");
    if (!ok) {
      alert("Only Excel files (.xlsx/.xls) are allowed");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function onGenerate(e) {
    e.preventDefault();
    if (!file) {
      alert("Please choose an Excel file");
      return;
    }
    try {
      const { blob, fileName } = await generateUploadReport({
        username,
        shift,
        station, // code like COK
        department, // locked to user’s dept from init
        percent,
        file,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "report.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate report");
    }
  }

  return (
    <div className="userdash-outer">
      <UserTopBar />
      <div className="userdash-main">
        <SidebarUser />
        <div className="useruploadstaff-content">
          <div className="useruploadstaff-card">
            <div className="useruploadstaff-header-row">
              <div className="useruploadstaff-title">New File Upload</div>
              <div className="useruploadstaff-breadcrumb">
                Upload Staff Data/ <b>Daily Documents Upload</b>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 16 }}>Loading…</div>
            ) : (
              <form className="useruploadstaff-form" onSubmit={onGenerate}>
                <div className="useruploadstaff-fields">
                  {/* Date (server IST, read-only) */}
                  <div className="useruploadstaff-field">
                    <label>Date (IST)</label>
                    <input
                      type="text"
                      value={new Date(dateIST).toLocaleDateString("en-GB")}
                      disabled
                    />
                  </div>

                  {/* Shift (editable, from ACTIVE list) */}
                  <div className="useruploadstaff-field">
                    <label>Shift</label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                    >
                      {shiftOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department (locked to user’s dept) */}
                  <div className="useruploadstaff-field">
                    <label>Departments</label>
                    <input type="text" value={department} disabled />
                  </div>

                  {/* File */}
                  <div className="useruploadstaff-field">
                    <label>File</label>
                    <input
                      ref={fileRef}
                      type="file"
                      onChange={onFileChange}
                      accept=".xlsx,.xls"
                      multiple={false}
                    />
                  </div>
                </div>

                <div className="useruploadstaff-fields useruploadstaff-fields-bottom">
                  {/* Percentage (read-only from server rule) */}
                  <div className="useruploadstaff-field">
                    <label>Percentage</label>
                    <input type="text" value={`${percent}%`} disabled />
                  </div>

                  {/* Station (codes only; default from init) */}
                  <div className="useruploadstaff-field">
                    <label>Station</label>
                    <select
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                    >
                      {stationOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{ display: "flex", gap: 16, alignItems: "flex-end" }}
                  >
                    <button
                      type="submit"
                      className="useruploadstaff-btn submit"
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      className="useruploadstaff-btn cancel"
                      onClick={onUndo}
                    >
                      Undo
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
