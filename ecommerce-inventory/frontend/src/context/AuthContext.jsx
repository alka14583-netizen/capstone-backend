import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const saveSession = (data) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => saveSession((await api.post("/auth/login", { email, password })).data.data);
  const register = async (form) => saveSession((await api.post("/auth/register", form)).data.data);
  const logout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch (e) { /* ignore */ }
    ["accessToken", "refreshToken", "user"].forEach((k) => localStorage.removeItem(k));
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
