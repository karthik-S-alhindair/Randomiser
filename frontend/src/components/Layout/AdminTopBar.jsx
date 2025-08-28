import React from "react";
import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdChatBubbleOutline, MdSettings } from "react-icons/md";
import logo from "../../assets/Images/AlhindairLogo.png";
import "./AdminTopBar.css";
import { useUser } from "../../context/UserContext";

export default function AdminTopBar() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const displayName = user?.name || user?.username || "Admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin-topbar" role="navigation" aria-label="Admin top bar">
      <div className="admin-topbar__left">
        <img src={logo} alt="AlhindAir" className="admin-topbar__logo" />
      </div>

      <div className="admin-topbar__right">
        <span className="admin-topbar__username" title={displayName}>{displayName}</span>

        <button className="admin-topbar__iconbtn" aria-label="Notifications">
          <MdNotificationsNone className="admin-topbar__icon" />
        </button>
        <button className="admin-topbar__iconbtn" aria-label="Settings">
          <MdSettings className="admin-topbar__icon" />
        </button>
        <button className="admin-topbar__logout" onClick={handleLogout} aria-label="Log out">
          Log Out
        </button>
      </div>
    </div>
  );
}
