import React, { useState } from "react";
import "./AddNewUser.css"; // reuse same styles
import { updateManagedUser } from "../lib/api";

const ROLES = ["Admin", "User"];

function EditUser({ user, onClose, onSaved }) {
  const [active, setActive] = useState(!!user.is_active);
  const [form, setForm] = useState({
    name: user.name || "",
    designation: user.designation || "",
    email: user.email || "",
    phone: user.phone || "",
    station: user.station || "",
    username: user.username || "",
    role: user.role || "User",
    password: "", // optional change
  });

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        designation: form.designation,
        email: form.email,
        phone: form.phone,
        station: form.station,
        username: form.username,
        role: form.role,
        is_active: active,
      };
      if (form.password) payload.password = form.password;
      await updateManagedUser(user.id, payload);
      onClose?.();
      onSaved?.();
    } catch (e) {
      window.alert(e.message || "Failed to update user.");
    }
  };

  return (
    <div className="adduser-modal-overlay">
      <div className="adduser-modal">
        <div className="adduser-modal-header-row">
          <div className="adduser-modal-title">Edit User</div>
          <div className="adduser-modal-breadcrumb">
            Admin / <b>Edit</b> User
          </div>
        </div>
        <form
          className="adduser-modal-form"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="adduser-fields-row">
            <div className="adduser-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={form.name}
                onChange={set("name")}
              />
            </div>
            <div className="adduser-field">
              <label>Designation</label>
              <input
                type="text"
                placeholder="Enter designation"
                value={form.designation}
                onChange={set("designation")}
              />
            </div>
            <div className="adduser-field">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="Enter email"
                value={form.email}
                onChange={set("email")}
              />
            </div>
            <div className="adduser-field">
              <label>Phone No</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={set("phone")}
              />
            </div>
            <div className="adduser-field">
              <label>Station</label>
              <input
                type="text"
                placeholder="Enter station"
                value={form.station}
                onChange={set("station")}
              />
            </div>
          </div>

          <div className="adduser-fields-row">
            <div className="adduser-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password (leave blank to keep)"
                value={form.password}
                onChange={set("password")}
              />
            </div>
            <div className="adduser-field">
              <label>User Name</label>
              <input
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={set("username")}
              />
            </div>
            <div className="adduser-field">
              <label>Role</label>
              <select
                value={form.role}
                onChange={set("role")}
                style={{
                  padding: "12px 14px",
                  border: "1.1px solid #bfcbe1",
                  borderRadius: 6,
                  background: "#f8fafc",
                }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="adduser-field" style={{ visibility: "hidden" }} />
            <div className="adduser-field" style={{ visibility: "hidden" }} />
          </div>

          <div className="adduser-modal-btn-row">
            <div className="adduser-active-toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => setActive((a) => !a)}
                />
                <span className="slider"></span>
              </label>
              <span className="adduser-toggle-label">Active / Inactive</span>
            </div>
            <button
              type="button"
              className="adduser-modal-btn save"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              type="button"
              className="adduser-modal-btn cancel"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUser;
