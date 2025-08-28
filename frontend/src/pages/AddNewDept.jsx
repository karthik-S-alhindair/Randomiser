import React, { useState } from "react";
import { createDepartment } from "../lib/api";
import "./AddNewDept.css";

function AddNewDept({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter a department name.");
    const pct = Number(percentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return alert("Percentage must be 0–100.");

    try {
      setSaving(true);
      await createDepartment({ name: name.trim(), percent: pct, is_active: !!active });
      onSaved?.();
    } catch (err) {
      alert(err.message || "Failed to create department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adddept-modal-overlay">
      <div className="adddept-modal">
        <div className="adddept-modal-header-row">
          <div className="adddept-modal-title">Upload new Department</div>
          <div className="adddept-modal-breadcrumb">
            Admin / Department / <b>Upload new Department</b>
          </div>
        </div>
        <form className="adddept-modal-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="adddept-fields-row">
            <div className="adddept-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter department name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="adddept-field">
              <label>Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Enter %"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="adddept-switch-row">
            <label className="switch">
              <input type="checkbox" checked={active} onChange={() => setActive((v) => !v)} />
              <span className="slider"></span>
            </label>
            <span className="adddept-switch-label">Active / Inactive</span>
          </div>
          <div className="adddept-modal-btn-row">
            <button type="submit" className="adddept-modal-btn save" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="adddept-modal-btn cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddNewDept;
