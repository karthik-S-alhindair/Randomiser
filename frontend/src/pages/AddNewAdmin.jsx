import React, { useState } from "react";
import { createAdmin, createSuperadmin } from "../lib/api";
import "./AddNewAdmin.css";

const ROLE_OPTIONS = ["Admin", "Super admin"]; // no "User"

function toApiRole(role = "") {
  const r = String(role || "").toLowerCase();
  if (r.startsWith("super")) return "superadmin";
  return "admin";
}

export default function AddNewAdmin({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    phone: "",
    station: "",
    role: "Admin",
    username: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      const payload = {
        username: form.username.trim() || null,
        password: form.password,
        name: form.name.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone || null,
        department: null, // optional / can stay null
        station: form.station || null,
        role: toApiRole(form.role),
      };

      if (!payload.username || !payload.password) {
        alert("Username and password are required");
        return;
      }

      if ((form.role || "").toLowerCase().startsWith("super")) {
        await createSuperadmin(payload); 
      } else {
        await createAdmin(payload); 
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create account");
    }
  }

  return (
    <div className="addadmin-modal-overlay">
      <div className="addadmin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="addadmin-modal-header-row">
          <div className="addadmin-modal-title">New Admin User</div>
          <div className="addadmin-modal-breadcrumb">
            Admin / Users / <b>Create</b>
          </div>
        </div>

        <form
          className="addadmin-modal-form"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="addadmin-fields-row">
            <div className="addadmin-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={form.name}
                onChange={change("name")}
              />
            </div>
            <div className="addadmin-field">
              <label>Designation</label>
              <input
                type="text"
                placeholder="Enter designation"
                value={form.designation}
                onChange={change("designation")}
              />
            </div>
            <div className="addadmin-field">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="Enter email"
                value={form.email}
                onChange={change("email")}
              />
            </div>
            <div className="addadmin-field">
              <label>Phone No</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={change("phone")}
              />
            </div>
          </div>

          <div className="addadmin-fields-row">
            <div className="addadmin-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={change("password")}
              />
            </div>
            <div className="addadmin-field">
              <label>User Name</label>
              <input
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={change("username")}
              />
            </div>
            <div className="addadmin-field">
              <label>Role</label>
              <select value={form.role} onChange={change("role")}>
                <option>Admin</option>
                <option>Super admin</option>
              </select>
            </div>
            <div className="addadmin-field">
              <label>Station</label>
              <input
                type="text"
                placeholder="Enter station"
                value={form.station}
                onChange={change("station")}
              />
            </div>
          </div>

          <div className="addadmin-modal-btn-row">
            <button
              type="button"
              className="addadmin-modal-btn save"
              onClick={save}
              disabled={busy}
            >
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="addadmin-modal-btn cancel"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
