import React, { useState } from "react";
import "./SADBChangePasswordModal.css";

export default function SADBChangePasswordModal({ open, onApply, onCancel }) {
  const [current, setCurrent] = useState("");
  const [next1, setNext1] = useState("");
  const [next2, setNext2] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = () => {
    setErr("");
    if (!current || !next1 || !next2) return setErr("All fields are required.");
    if (next1 !== next2) return setErr("New passwords do not match.");
    onApply?.({ current, next: next1 });
  };

  return (
    <div className="sadb-cp-overlay" role="dialog" aria-modal="true">
      <div className="sadb-cp-card">
        <div className="sadb-cp-title">Change Password</div>

        <div className="sadb-cp-grid">
          <label>Current Password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />

          <label>New Password</label>
          <input type="password" value={next1} onChange={(e) => setNext1(e.target.value)} />

          <label>Re-Enter New Password</label>
          <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} />
        </div>

        {err && <div className="sadb-cp-error">{err}</div>}
        <div className="sadb-cp-note">
          Note: Contact Superior if you have forgotten the password for changes!
        </div>

        <div className="sadb-cp-actions">
          <button className="sadb-cp-apply" onClick={submit}>Apply</button>
          <button className="sadb-cp-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
