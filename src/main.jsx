import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import AdminLogin from "./pages/AdminLogin";
import AdminEvents from "./pages/AdminEvents";
import ProtectedRoute from "./components/ProtectedRoute";
import EventDetails from "./pages/EventDetails";
import PublicEvent from "./pages/PublicEvent";
import AdminRedirect from "./components/AdminRedirect";
import HomeOrAdmin from "./components/HomeOrAdmin";
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
        <Route 
          path="/admin/events" 
          element={
            <ProtectedRoute>
              <AdminEvents />
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
        <Route path="/admin" element={<AdminRedirect />} />
        
        {/* Root: landing on moments.live, admin redirect on admin.moments.live */}
        <Route path="/" element={<HomeOrAdmin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
