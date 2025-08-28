// REPLACE FILE CONTENT
import React, { useState } from "react";
import "./AddNewStation.css";
import { createStation } from "../lib/api";

function AddNewStation({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!name.trim() || !code.trim()) {
      alert("Please fill both name and code");
      return;
    }
    setSaving(true);
    try {
      await createStation({ name: name.trim(), code: code.trim().toUpperCase(), is_active: active });
      onSaved && onSaved();
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="addstation-modal-overlay">
      <div className="addstation-modal">
        <div className="addstation-modal-header-row">
          <div className="addstation-modal-title">Add a new Station</div>
          <div className="addstation-modal-breadcrumb">
            Admin / shifts / <b>Add a new Station</b>
          </div>
        </div>
        <form className="addstation-modal-form" autoComplete="off" onSubmit={(e)=>e.preventDefault()}>
          <div className="addstation-fields-row">
            <div className="addstation-field">
              <label>Station Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div className="addstation-field">
              <label>Station Code</label>
              <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="addstation-fields-row" style={{ marginTop: "8px" }}>
            <div className="addstation-toggle-field">
              <label className="switch">
                <input type="checkbox" checked={active} onChange={()=>setActive(a=>!a)} />
                <span className="slider"></span>
              </label>
              <span className="addstation-toggle-label">Active / Inactive</span>
            </div>
          </div>
          <div className="addstation-modal-btn-row">
            <button type="button" className="addstation-modal-btn save" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="addstation-modal-btn cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AddNewStation;
