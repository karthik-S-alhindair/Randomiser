// src/pages/EditShift.jsx
import React, { useState } from "react";
import { updateShift } from "../lib/api";
import "./AddNewShift.css";

function EditShift({ shift, onClose, onCancel }) {
  const [name, setName] = useState(shift?.name || "");
  const [active, setActive] = useState(!!shift?.is_active);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return alert("Please enter a shift name");
    setSaving(true);
    try {
      await updateShift(shift.id, { name: name.trim(), is_active: active });
      onClose?.();
    } catch (e) {
      alert(e.message || "Failed to update shift");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="addshift-modal-overlay">
      <div className="addshift-modal">
        <div className="addshift-modal-header-row">
          <div className="addshift-modal-title">Edit Shift</div>
          <div className="addshift-modal-breadcrumb">
            Admin / <span>shifts</span> / <b>Edit Shift</b>
          </div>
        </div>
        <form className="addshift-modal-form" onSubmit={(e)=>{e.preventDefault(); save();}} autoComplete="off">
          <div className="addshift-fields-row">
            <div className="addshift-field">
              <label>Shift Name</label>
              <input type="text" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
          </div>
          <div className="addshift-bottom-row">
            <label className="switch-label">
              <span className="switch">
                <input type="checkbox" checked={active} onChange={()=>setActive(a=>!a)} />
                <span className="slider"></span>
              </span>
              <span className="switch-desc">Active / Inactive</span>
            </label>
            <div className="addshift-modal-btn-row">
              <button type="submit" className="addshift-modal-btn save" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" className="addshift-modal-btn cancel" onClick={()=>onCancel?.()}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default EditShift;
