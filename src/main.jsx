import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import AdminLogin from "./pages/AdminLogin";
import AdminEvents from "./pages/AdminEvents";
import ProtectedRoute from "./components/ProtectedRoute";
import EventDetails from "./pages/EventDetails";
import AdminRedirect from "./components/AdminRedirect";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<AdminRedirect />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/deleteAccount" element={<DeleteAccount />} />
        <Route path="/admin" element={<AdminRedirect />} />
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
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
