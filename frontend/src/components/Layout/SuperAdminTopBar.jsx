import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdSettings } from "react-icons/md";
import logo from "../../assets/Images/AlhindairLogo.png";
import { useUser } from "../../context/UserContext";
import "./SuperAdminTopBar.css";

export default function SuperAdminTopBar({ onOpenChangePassword }) {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.name || user?.username || "";

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="sadb-topbar">
      <div className="sadb-topbar__left">
        <img src={logo} alt="Alhindair" className="sadb-topbar__logo" />
      </div>

      <div className="sadb-topbar__right">
        <span className="sadb-topbar__username">{displayName}</span>

        <button className="sadb-iconbtn" aria-label="Notifications">
          <MdNotificationsNone className="sadb-icon" />
        </button>

        <div className="sadb-settings" ref={menuRef}>
          <button
            className="sadb-iconbtn"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MdSettings className="sadb-icon" />
          </button>

          {menuOpen && (
            <div className="sadb-menu" role="menu">
              <button
                className="sadb-menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenChangePassword?.();
                }}
              >
                Change password
              </button>
            </div>
          )}
        </div>

        <button className="sadb-logout" onClick={handleLogout}>
          [→ Log Out
        </button>
      </div>
    </div>
  );
}
