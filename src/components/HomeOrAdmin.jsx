import React from "react";
import Landing from "../pages/Landing";
import AdminRedirect from "./AdminRedirect";

/**
 * At "/" (root):
 * - On admin.moments.live → redirect to admin app (AdminRedirect)
 * - On moments.live or any other host → show landing page
 */
const HomeOrAdmin = () => {
  const isAdminHost =
    typeof window !== "undefined" &&
    window.location.hostname.startsWith("admin.");

  if (isAdminHost) {
    return <AdminRedirect />;
  }
  return <Landing />;
};

export default HomeOrAdmin;
