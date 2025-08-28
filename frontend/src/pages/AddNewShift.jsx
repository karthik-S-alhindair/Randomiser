// src/pages/AddNewShift.jsx  (REPLACE FILE)
import React, { useState } from "react";
import { createShift } from "../lib/api";
import "./AddNewShift.css";

function AddNewShift({ onClose }) {
  const [shiftName, setShiftName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!shiftName.trim()) return alert("Please enter a shift name");
    setSaving(true);
    try {
      await createShift({ name: shiftName.trim(), is_active: active });
      onClose?.(); // parent will reload
    } catch (e) {
      alert(e.message || "Failed to create shift");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="addshift-modal-overlay">
      <div className="addshift-modal">
        <div className="addshift-modal-header-row">
          <div className="addshift-modal-title">Add a new Shift</div>
          <div className="addshift-modal-breadcrumb">
            Admin / <span>shifts</span> / <b>Add a new Shift</b>
          </div>
        </div>
        <form className="addshift-modal-form" onSubmit={(e)=>{e.preventDefault(); save();}} autoComplete="off">
          <div className="addshift-fields-row">
            <div className="addshift-field">
              <label>Shift Name</label>
              <input
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
              />
            </div>
          </div>
          <div className="addshift-bottom-row">
            <label className="switch-label">
              <span className="switch">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => setActive((a) => !a)}
                />
                <span className="slider"></span>
              </span>
              <span className="switch-desc">Active / Inactive</span>
            </label>
            <div className="addshift-modal-btn-row">
              <button type="submit" className="addshift-modal-btn save" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" className="addshift-modal-btn cancel" onClick={() => onClose?.()}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AddNewShift;
