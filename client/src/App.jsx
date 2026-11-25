import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Shell from "./components/layout/Shell";
import Guard from "./components/layout/Guard";

// Pages
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ContactPage from "./pages/ContactPage";
import RoomCatalog from "./pages/RoomCatalog";
import Dashboard from "./pages/Dashboard";
import Applications, { ApplicationDetail } from "./pages/Applications";
import RequestsPage from "./pages/RequestsPage";
import StudentsPage, { StudentDetail } from "./pages/StudentsPage";
import TransfersPage from "./pages/TransfersPage";
import InvoicesPage, { InvoiceDetail } from "./pages/InvoicesPage";
import BillingPage from "./pages/BillingPage";
import ReadingsPage from "./pages/ReadingsPage";
import StaysPage from "./pages/StaysPage";
import UsersPage, { StaffPage } from "./pages/UsersPage";
import ResourcePage from "./pages/ResourcePage";
import PricingPage from "./pages/PricingPage";
import NotificationsPage from "./pages/NotificationsPage";
import ReportPage from "./pages/ReportPage";
import ProfilePage from "./pages/ProfilePage";

function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" /> : <AuthPage />}
      />
      <Route
        path="/register"
        element={
          session ? <Navigate to="/dashboard" /> : <AuthPage register />
        }
      />
      <Route
        path="/rooms"
        element={
          session ? (
            <Shell>
              <RoomCatalog />
            </Shell>
          ) : (
            <RoomCatalog />
          )
        }
      />
      <Route
        path="/contact"
        element={
          <Guard>
            <ContactPage />
          </Guard>
        }
      />

      {/* Authenticated Routes */}
      <Route
        path="/dashboard"
        element={
          <Guard>
            <Dashboard />
          </Guard>
        }
      />
      <Route
        path="/applications"
        element={
          <Guard>
            <Applications />
          </Guard>
        }
      />
      <Route
        path="/applications/:id"
        element={
          <Guard>
            <ApplicationDetail />
          </Guard>
        }
      />
      <Route
        path="/students"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <StudentsPage />
          </Guard>
        }
      />
      <Route
        path="/students/:id"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <StudentDetail />
          </Guard>
        }
      />
      <Route
        path="/requests"
        element={
          <Guard>
            <RequestsPage />
          </Guard>
        }
      />
      <Route
        path="/transfers"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <TransfersPage />
          </Guard>
        }
      />
      <Route
        path="/invoices"
        element={
          <Guard>
            <InvoicesPage />
          </Guard>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <Guard>
            <InvoiceDetail />
          </Guard>
        }
      />
      <Route
        path="/billing"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <BillingPage />
          </Guard>
        }
      />
      <Route
        path="/readings"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <ReadingsPage />
          </Guard>
        }
      />
      <Route
        path="/stays"
        element={
          <Guard roles={["STUDENT"]}>
            <StaysPage />
          </Guard>
        }
      />
      <Route
        path="/staff"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <StaffPage />
          </Guard>
        }
      />
      <Route
        path="/users"
        element={
          <Guard roles={["ADMIN"]}>
            <UsersPage />
          </Guard>
        }
      />
      <Route
        path="/pricing"
        element={
          <Guard roles={["ADMIN"]}>
            <PricingPage />
          </Guard>
        }
      />
      <Route
        path="/buildings"
        element={
          <Guard roles={["ADMIN"]}>
            <ResourcePage kind="buildings" />
          </Guard>
        }
      />
      <Route
        path="/room-types"
        element={
          <Guard roles={["ADMIN"]}>
            <ResourcePage kind="room-types" />
          </Guard>
        }
      />
      <Route
        path="/periods"
        element={
          <Guard roles={["ADMIN"]}>
            <ResourcePage kind="periods" />
          </Guard>
        }
      />
      <Route
        path="/billing-cycles"
        element={
          <Guard roles={["ADMIN"]}>
            <ResourcePage kind="periods" />
          </Guard>
        }
      />
      <Route
        path="/notifications"
        element={
          <Guard>
            <NotificationsPage />
          </Guard>
        }
      />
      <Route
        path="/reports"
        element={
          <Guard roles={["STAFF", "ADMIN"]}>
            <ReportPage />
          </Guard>
        }
      />
      <Route
        path="/profile"
        element={
          <Guard>
            <ProfilePage />
          </Guard>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
