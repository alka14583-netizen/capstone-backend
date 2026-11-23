import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Blocks pages for logged-out users or users with the wrong role (the backend also enforces this)
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <div className="container section"><div className="alert error">You do not have access to this page.</div></div>;
  }
  return children;
}
