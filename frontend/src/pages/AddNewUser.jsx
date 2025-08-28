import React, { useState } from "react";
import "./AddNewUser.css";
import { createManagedUser } from "../lib/api";

function AddNewUser({ onClose, onSaved }) {
  const [active, setActive] = useState(false);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    phone: "",
    station: "",
    password: "",
    username: "",
  });

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSave = async () => {
    // minimal front validation
    if (!form.name || !form.email || !form.username || !form.password) {
      window.alert("Name, Email, Username and Password are required.");
      return;
    }
    try {
      await createManagedUser({
        name: form.name,
        designation: form.designation || null,
        email: form.email,
        phone: form.phone || null,
        station: form.station || null,
        username: form.username,
        password: form.password,
        is_active: active,
      });
      onClose?.();
      onSaved?.();
    } catch (e) {
      window.alert(e.message || "Failed to create user.");
    }
  };

  return (
    <div className="adduser-modal-overlay">
      <div className="adduser-modal">
        <div className="adduser-modal-header-row">
          <div className="adduser-modal-title">New User Upload</div>
          <div className="adduser-modal-breadcrumb">
            Admin / User / <b>Upload new User</b>
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
                placeholder="Enter password"
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

export default AddNewUser;
