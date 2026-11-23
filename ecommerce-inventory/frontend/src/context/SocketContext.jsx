import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useNotifications = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    // Load old notifications, then listen for new ones in real time
    api.get("/notifications").then((r) => setNotifications(r.data.data.items)).catch(() => {});
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("accessToken") }, // server checks this JWT
    });
    socket.on("notification", (n) => {
      setNotifications((prev) => [n, ...prev]);
      setToast(n.message);
      setTimeout(() => setToast(null), 5000);
    });
    socket.on("connect_error", (err) => console.warn("Socket error:", err.message));
    return () => socket.disconnect();
  }, [user]);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <SocketContext.Provider value={{ notifications, unread, markAllRead }}>
      {children}
      {toast && <div className="toast" role="status">🔔 {toast}</div>}
    </SocketContext.Provider>
  );
}
