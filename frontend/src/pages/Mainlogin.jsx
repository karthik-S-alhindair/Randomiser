// src/pages/Mainlogin.jsx
import React, { useState } from "react";
import "./Mainlogin.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Images/AlhindairLogo.png";
import logo1 from "../assets/icons/Rand.png"
import bgImage from "../assets/Images/Login_Bg.jpg";
import eyeOpen from "../assets/icons/eye_open.png";
import eyeClosed from "../assets/icons/eye_closed.png";
import { useUser } from "../context/UserContext";
import { login as apiLogin } from "../lib/api";

function Mainlogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login: setSession } = useUser();

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await apiLogin(username.trim(), password);
      // Persist in context: (username, role, name, department)
      setSession(data.username, data.role, data.name, data.department, data.station || "");
      if (data.role === "superadmin") navigate("/superadmin");
      else if (data.role === "admin") navigate("/admin");
      else navigate("/user");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split-container">
      {/* LEFT WHITE PANEL */}
      <div className="login-left-panel">
        <img src={logo} alt="Alhindair Logo" className="login-logo" />
        <img src={logo1} alt="Randomiser Logo" className="login-logo-1" />
        <form className="login-form" onSubmit={handleLogin} autoComplete="off">
          <label htmlFor="username">Username</label>
          <input
            autoFocus
            id="username"
            type="text"
            name="login_user"
            autoComplete="off"
            readOnly
            onFocus={(e) => e.target.removeAttribute("readOnly")}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={64}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />

          <label htmlFor="password">Password</label>
          <div className="pwd-box">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              name="login_pass"
              autoComplete="new-password"
              readOnly
              onFocus={(e) => e.target.removeAttribute("readOnly")}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <img
              src={showPwd ? eyeClosed : eyeOpen}
              alt={showPwd ? "Hide password" : "Show password"}
              className="eye-icon"
              tabIndex={0}
              onClick={() => setShowPwd((v) => !v)}
              style={{ cursor: "pointer" }}
            />
          </div>

          {err && <div className="login-error">{err}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>

      {/* RIGHT IMAGE PANEL */}
      <div className="login-right-panel" style={{ backgroundImage: `url(${bgImage})` }} />
    </div>
  );
}

export default Mainlogin;
