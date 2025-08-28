import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaThLarge } from "react-icons/fa";
import { MdUploadFile, MdAssessment } from "react-icons/md";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import DooreBlue from "../../assets/icons/Doore_blue.png";
import DooreWhite from "../../assets/icons/Doore_white.png";
import "../../App.css";
import "./AdminSidebar.css";
import { useUser } from "../../context/UserContext";

function getInitials(fullName = "") {
  const str = (fullName || "").trim();
  if (!str) return "?";
  const parts = str.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "?";
}

export default function AdminSidebar() {
  const { user } = useUser();
  const location = useLocation();

  const [adminOpen, setAdminOpen] = useState(true);

  // Persist dropdown state
  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarOpen");
    if (saved !== null) setAdminOpen(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("adminSidebarOpen", String(adminOpen));
  }, [adminOpen]);

  const displayName = user?.name || user?.username || "User";
  const initials = getInitials(displayName);

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="adminsidebar-outer" aria-label="Admin navigation sidebar">
      {/* Scroll area holds all links */}
      <div className="adminsidebar-scroll">
        <NavLink
          to="/admin"
          className={`adminsidebar-link ${isActive("/admin") ? "active" : ""}`}
        >
          <FaThLarge className="adminsidebar-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/upload-staff-data"
          className={`adminsidebar-link ${isActive("/admin/upload-staff-data") ? "active" : ""}`}
        >
          <MdUploadFile className="adminsidebar-icon" />
          <span>Upload Staff Data</span>
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={`adminsidebar-link ${isActive("/admin/reports") ? "active" : ""}`}
        >
          <MdAssessment className="adminsidebar-icon" />
          <span>Reports</span>
        </NavLink>

        {/* Collapsible Admin group */}
        <button
          type="button"
          className="adminsidebar-panel-header"
          onClick={() => setAdminOpen(v => !v)}
          aria-expanded={adminOpen}
          aria-controls="admin-panel"
        >
          <div className="adminsidebar-panel-title">
            <img src={DooreWhite} alt="" className="adminsidebar-panel-icon" />
            <span>Admin</span>
          </div>
          {adminOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
        </button>

        <div
          id="admin-panel"
          className={`adminsidebar-panel-menu ${adminOpen ? "open" : "closed"}`}
        >
          <NavLink
            to="/admin/users"
            className={`adminsidebar-panel-link ${isActive("/admin/users") ? "sub-active" : ""}`}
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/departments"
            className={`adminsidebar-panel-link ${isActive("/admin/departments") ? "sub-active" : ""}`}
          >
            Departments
          </NavLink>
          <NavLink
            to="/admin/shifts"
            className={`adminsidebar-panel-link ${isActive("/admin/shifts") ? "sub-active" : ""}`}
          >
            Shifts
          </NavLink>
          <NavLink
            to="/admin/station"
            className={`adminsidebar-panel-link ${isActive("/admin/station") ? "sub-active" : ""}`}
          >
            Station
          </NavLink>
        </div>
      </div>

      {/* Footer pinned to bottom */}
      <div className="adminsidebar-footer">
        <div className="adminsidebar-avatar" aria-hidden="true">{initials}</div>
        <div className="adminsidebar-userinfo">
          <div className="adminsidebar-username" title={displayName}>
            {displayName}
          </div>
          <div className="adminsidebar-role">
            {user?.department || "Department"}
          </div>
        </div>
      </div>
    </aside>
  );
}
