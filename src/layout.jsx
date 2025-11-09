import React from "react";

export default function Layout({ children }) {
  return (
    <div className="bg-[##1C1C1C] text-[#2a4d32] font-sans overflow-x-hidden relative">
      {children}
      <footer className="pt-20 text-center text-sm text-gray-500">
        © 2025 admin.moments.live — All rights reserved.
      </footer>
    </div>
  );
}
