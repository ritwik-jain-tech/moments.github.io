import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function DeleteAccount() {
  const [phone, setPhone] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setShowConfirm(false);
    setDeleted(true);
    // Here you would call your backend API to actually delete the account
  };

  return (
    <div className="min-h-screen text-[#2a4d32] px-6 pb-16 font-sans relative overflow-hidden bg-[#f3efe6]">
      {/* Header gradient + arc line */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#67143A] via-[#1a0015] to-transparent z-0" />
      <div className="absolute top-[320px] left-0 w-full h-[1px] z-0">
        <svg viewBox="0 0 1440 20" className="w-full h-full">
          <path d="M0,10 C360,-10 1080,-10 1440,10" fill="transparent" stroke="#D64897" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-xl mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C1C1C] rounded-2xl shadow-xl p-8"
        >
          <h1 className="text-3xl font-bold mb-6 text-center text-[#2a4d32]">Delete Account</h1>
          {!deleted ? (
            <form onSubmit={handleDelete} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block mb-2 text-sm font-medium">
                  Enter your phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#f3efe6] border border-gray-700 text-[#2a4d32] focus:outline-none focus:ring-2 focus:ring-[#2a4d32]"
                  placeholder="e.g. +919876543210"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#67143A] hover:bg-[#4f0f2d] text-white font-semibold py-3 rounded-lg transition"
              >
                Delete My Account
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-[#2a4d32] mb-4">Your account is deleted</h2>
              <p className="text-gray-300">We're sorry to see you go.</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 bg-[#f3efe6] bg-opacity-60 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1C1C1C] rounded-xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <h2 className="text-xl font-bold mb-4 text-[#2a4d32]">Are you sure?</h2>
            <p className="mb-6 text-gray-300">
              Deleting your account may cause you to lose access to events and moments you're part of.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="bg-[#67143A] hover:bg-[#4f0f2d] text-white px-6 py-2 rounded-lg font-semibold"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-[#2a4d32] px-6 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="relative z-10 text-center text-sm text-gray-500 pt-20">
        © 2025 moments.live — All rights reserved.
      </footer>
    </div>
  );
} 