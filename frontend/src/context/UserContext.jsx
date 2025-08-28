import React, { createContext, useContext, useMemo, useState } from "react";

const Ctx = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const value = useMemo(
    () => ({
      user,
      // (username, role, name, department?) OR ({ username, role, name, department })
      login: (...args) => {
        let username, role, name, department;
        if (args.length === 1 && typeof args[0] === "object") {
          ({ username, role, name, department } = args[0]);
        } else {
          [username, role, name, department] = args;
        }
        const u = { username, role, name, department };
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      },
      update: (patch) => {
        const next = { ...(user || {}), ...(patch || {}) };
        setUser(next);
        localStorage.setItem("user", JSON.stringify(next));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem("user");
      },
    }),
    [user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUser() {
  return useContext(Ctx);
}
