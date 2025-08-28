import { NavLink } from "react-router-dom";
import "../../App.css";
import "./SuperAdminSidebar.css";
import { useUser } from "../../context/UserContext";

function getInitials(name = "") {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SuperAdminSidebar() {
  const { user } = useUser();
  const displayName = user?.name || user?.username || user?.role ;
  const subtitle = user?.department || user?.role || user?.department ;

  return (
    <div className="sidebar-superadmin">
      <div className="sidebar-links">
        <NavLink
          to="/superadmin"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Admin Users
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">{getInitials(displayName)}</div>
        <div className="user-info">
          <div className="user-name">{displayName}</div>
          <div className="user-role">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
