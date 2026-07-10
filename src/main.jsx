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
import ReviewPage from "./pages/ReviewPage";
import AlbumPage from "./pages/AlbumPage";
import AdminRedirect from "./components/AdminRedirect";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import HomeRouter from "./components/HomeRouter";
import Landing from "./pages/Landing";
import AdminStorage from "./pages/AdminStorage";
import AdminUploads from "./pages/AdminUploads";
import AdminTeam from "./pages/AdminTeam";
import AdminSettings from "./pages/AdminSettings";
import { ThemeProvider } from "./context/ThemeContext";
import { UploadProvider } from "./context/UploadContext";
import UploadWidget from "./components/UploadWidget";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
    <BrowserRouter>
    <UploadProvider>
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/event/:eventId" element={<PublicEvent />} />
        <Route path="/review/:token" element={<ReviewPage />} />
        <Route path="/album/:token" element={<AlbumPage />} />
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
              <AdminTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminRedirect />} />

        {/* moments.live/ → B2B landing, /guestApp → consumer landing, studio.moments.live/ → admin tool */}
        <Route path="/guestApp" element={<Landing />} />
        <Route path="/" element={<HomeRouter />} />
      </Routes>
      <UploadWidget />
    </UploadProvider>
    </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
