import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
