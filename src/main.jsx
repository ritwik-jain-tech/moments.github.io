import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminEvents from "./pages/AdminEvents";
import ProtectedRoute from "./components/ProtectedRoute";
import EventDetails from "./pages/EventDetails";
import PublicEvent from "./pages/PublicEvent";
import AdminRedirect from "./components/AdminRedirect";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import B2BLanding from "./pages/B2BLanding";
import Landing from "./pages/Landing";
import AdminStorage from "./pages/AdminStorage";
import AdminUploads from "./pages/AdminUploads";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/event/:eventId" element={<PublicEvent />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/deleteAccount" element={<DeleteAccount />} />
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route 
          path="/admin/events" 
          element={
            <ProtectedRoute>
              <AdminEvents initialSection="dashboard" />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/homepage"
          element={
            <ProtectedRoute>
              <AdminEvents initialSection="dashboard" />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/events/:eventId" 
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/uploads"
          element={
            <ProtectedRoute>
              <AdminUploads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/storage"
          element={
            <ProtectedRoute>
              <AdminStorage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute>
              <AdminPlaceholder activeKey="notifications" title="Notifications" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute>
              <AdminPlaceholder activeKey="team" title="Team Management" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminPlaceholder activeKey="settings" title="Account Settings" />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminRedirect />} />

        {/* moments.live/ → B2B landing, /guestApp → consumer landing */}
        <Route path="/guestApp" element={<Landing />} />
        <Route path="/" element={<B2BLanding />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
