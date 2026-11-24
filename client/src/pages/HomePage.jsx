import React from "react";
import { useAuth } from "../context/AuthContext";
import LandingPage from "./LandingPage";

export default function HomePage() {
  const { session, logout } = useAuth();
  return <LandingPage session={session} onLogout={logout} />;
}
