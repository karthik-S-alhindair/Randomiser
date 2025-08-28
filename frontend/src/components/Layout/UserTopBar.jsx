import React from "react";
import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdChatBubbleOutline, MdSettings } from "react-icons/md";
import logo from "../../assets/Images/AlhindairLogo.png";
import "./UserTopBar.css";
import { useUser } from "../../context/UserContext";

export default function UserTopBar() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const displayName = user?.name || user?.username || "User";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="user-topbar" role="banner">
      <div className="user-topbar__left">
        <img src={logo} alt="Alhindair" className="user-topbar__logo" />
      </div>

      <div className="user-topbar__right">
        <span className="user-topbar__username">{displayName}</span>
        <button className="user-topbar__iconbtn" aria-label="Notifications">
          <MdNotificationsNone className="user-topbar__icon" />
        </button>
        <button className="user-topbar__iconbtn" aria-label="Messages">
          <MdChatBubbleOutline className="user-topbar__icon" />
        </button>
        <button className="user-topbar__iconbtn" aria-label="Settings">
          <MdSettings className="user-topbar__icon" />
        </button>
        <button className="user-topbar__logout" onClick={handleLogout}>
          [→ Log Out
        </button>
      </div>
    </div>
  );
}
