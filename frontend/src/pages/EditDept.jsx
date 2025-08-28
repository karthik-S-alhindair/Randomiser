import React, { useState } from "react";
import { updateDepartment } from "../lib/api";
import "./AddNewDept.css";

function EditDept({ dept, onClose, onSaved }) {
  const [name, setName] = useState(dept?.name || "");
  const [percentage, setPercentage] = useState(String(dept?.percent ?? ""));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pct = Number(percentage);
    if (!name.trim()) return alert("Please enter a department name.");
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return alert("Percentage must be 0–100.");
    try {
      setSaving(true);
      await updateDepartment(dept.id, { name: name.trim(), percent: pct });
      onSaved?.();
    } catch (err) {
      alert(err.message || "Failed to update department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adddept-modal-overlay">
      <div className="adddept-modal">
        <div className="adddept-modal-header-row">
          <div className="adddept-modal-title">Edit Department</div>
          <div className="adddept-modal-breadcrumb">
            Admin / Department / <b>Edit Department</b>
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

export default EditDept;
