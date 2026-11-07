import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./auth-context.js";
import api from "../api/axios";

function getStoredUser() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) return null;

  try {
    const user = JSON.parse(storedUser);
    return user && typeof user === "object" ? user : null;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const setSession = ({ token, user: nextUser }) => {
    if (!token || !nextUser || typeof nextUser !== "object") {
      throw new Error("Cannot create a session without a token and user");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token")) await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const hasRole = useCallback((...roles) => roles.includes(user?.role), [user?.role]);
  const value = useMemo(
    () => ({ user, setUser, setSession, logout, hasRole }),
    [user, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
