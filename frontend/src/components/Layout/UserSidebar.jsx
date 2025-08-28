import { NavLink } from "react-router-dom";
import { FaThLarge } from "react-icons/fa";
import { MdUploadFile, MdAssessment } from "react-icons/md";
import "../../App.css";
import "./UserSidebar.css";
import { useUser } from "../../context/UserContext";

function getInitials(name = "") {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function UserSidebar() {
  const { user } = useUser();
  const displayName = user?.name || user?.username || "User";
  const role = (user?.role || "user").toLowerCase();

  return (
    <aside className="sidebar-user" aria-label="User navigation">
      <nav className="sidebar-links">
        <NavLink to="/user" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <FaThLarge className="sidebar-icon" /> Dashboard
        </NavLink>
        <NavLink to="/user/upload-staff-data" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdUploadFile className="sidebar-icon" /> Upload Staff Data
        </NavLink>
        <NavLink to="/user/reports" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdAssessment className="sidebar-icon" /> Reports
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{getInitials(displayName)}</div>
        <div className="user-info">
          <div className="user-name">{displayName}</div>
          <div className="user-role">{role}</div>
        </div>
      </div>
    </aside>
  );
}
