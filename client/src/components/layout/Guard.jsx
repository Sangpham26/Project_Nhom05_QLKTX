import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../common";
import Shell from "./Shell";

export default function Guard({ roles, children, plain = false }) {
  const { session, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.user.role))
    return <Navigate to="/dashboard" replace />;
  return plain ? children : <Shell>{children}</Shell>;
}
