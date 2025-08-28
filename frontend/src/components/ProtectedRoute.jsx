import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ProtectedRoute({ allow = [], children }) {
  const { user } = useUser();
  const role = user?.role;
  if (!role) return <Navigate to="/" replace />;
  if (allow.length && !allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}
