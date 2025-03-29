import React from "react";

export default function Layout({ children }) {
  return (
    <div className="bg-[#000001] text-white font-sans overflow-x-hidden relative">
      {children}
      <footer className="pt-20 text-center text-sm text-gray-500">
        © 2025 moments.live — All rights reserved.
      </footer>
    </div>
  );
}
