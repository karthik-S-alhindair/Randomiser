import React, { useEffect, useState } from "react";
import { getAdmin, updateAdmin, updateSuperadmin } from "../../lib/api";
import eyeOpen from "../../assets/icons/eye_open.png";
import eyeClosed from "../../assets/icons/eye_closed.png";
import "./SuperAdminModals.css";

const ROLE_OPTIONS = ["Super admin", "Admin"]; // <- no "User"
const toApiRole = (r = "") =>
  String(r).toLowerCase().startsWith("super") ? "superadmin" : "admin";

export default function SuperAdminEditAdminModal({
  userId,
  open,
  onClose,
  onSaved,
}) {
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
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      try {
        const a = await getAdmin(userId); // <- GET /api/admins/{id}
        setForm({
          name: a.name || "",
          designation: a.designation || "",
          email: a.email || "",
          phone: a.phone || "",
          station: a.station || "",
          role: a.role === "superadmin" ? "Super admin" : "Admin",
          username: a.username || "",
          password: "",
        });
      } catch (e) {
        alert(e.message || "Failed to load admin");
      }
    })();
  }, [open, userId]);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      // Build payload; never send blank password
      const payload = {
        name: form.name?.trim() || null,
        designation: form.designation?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone || null,
        station: form.station || null,
        username: form.username?.trim() || null,
        role: toApiRole(form.role),
      };
      if (form.password) payload.password = form.password;

      const chosen = (form.role || "").toLowerCase();
      const isSuper = chosen.startsWith("super");

      // Call the right endpoint based on the chosen/normalized role
      if (isSuper) {
        await updateSuperadmin(userId, payload); // PATCH /api/superadmins/:id
      } else {
        await updateAdmin(userId, payload); // PUT   /api/admins/:id
      }

      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-card" onClick={(e) => e.stopPropagation()}>
        <div className="sa-card-header">
          <div className="sa-card-title">Edit Admin User</div>
          <div className="sa-breadcrumb">
            SuperAdmin / <b>Edit Admin</b>
          </div>
        </div>

        <div className="sa-card-body">
          <div className="sa-grid">
            <label className="sa-field">
              <span>Name</span>
              <input
                className="sa-input"
                value={form.name}
                onChange={change("name")}
              />
            </label>
            <label className="sa-field">
              <span>Designation</span>
              <input
                className="sa-input"
                value={form.designation}
                onChange={change("designation")}
              />
            </label>
            <label className="sa-field">
              <span>Email ID</span>
              <input
                className="sa-input"
                value={form.email}
                onChange={change("email")}
              />
            </label>
            <label className="sa-field">
              <span>Phone No</span>
              <input
                className="sa-input"
                value={form.phone}
                onChange={change("phone")}
              />
            </label>

            <label className="sa-field">
              <span>Password</span>
              <div className="sa-input-wrap">
                <input
                  className="sa-input sa-input--with-eye"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={change("password")}
                  placeholder="Leave blank to keep same"
                />
                <button
                  type="button"
                  className="sa-eye-btn"
                  onClick={() => setShowPwd((v) => !v)}
                >
                  <img src={showPwd ? eyeClosed : eyeOpen} alt="" />
                </button>
              </div>
            </label>

            <label className="sa-field">
              <span>User Name</span>
              <input
                className="sa-input"
                value={form.username}
                onChange={change("username")}
              />
            </label>

            <label className="sa-field">
              <span>Role</span>
              <select
                className="sa-select"
                value={form.role}
                onChange={change("role")}
              >
                {ROLE_OPTIONS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>

            <label className="sa-field">
              <span>Station</span>
              <input
                className="sa-input"
                value={form.station}
                onChange={change("station")}
              />
            </label>
          </div>
        </div>

        <div className="sa-card-actions">
          <button
            className="sa-btn sa-btn-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="sa-btn sa-btn-danger" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
