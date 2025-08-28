import React, { useState } from "react";
import { deleteAdmin, deleteSuperadmin } from "../../lib/api"; // <- use admins API
import "./SuperAdminModals.css";

export default function SuperAdminDeleteAdminModal({
  userId,
  role,
  open,
  onClose,
  onDeleted,
}) {
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  async function doDelete() {
    setLoading(true);
    try {
      if (role === "superadmin") {
        await deleteSuperadmin(userId);
      } else {
        await deleteAdmin(userId);
      }
      onDeleted?.();
      onClose?.();
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-card confirm" onClick={(e) => e.stopPropagation()}>
        <div className="sa-card-header">
          <div className="sa-card-title" style={{ margin: "0 auto" }}>
            Delete the account permanently
          </div>
        </div>
        <div className="sa-card-actions center">
          <button
            className="sa-btn sa-btn-primary"
            onClick={doDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
          <button className="sa-btn sa-btn-danger" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
