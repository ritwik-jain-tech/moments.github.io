import React from "react";
import { motion } from "framer-motion";

export default function MomentsLiveLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3A003D] to-black text-white px-6 py-16 space-y-24 font-sans">
      {/* ... existing code ... */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        <h2 className="text-4xl font-semibold">Plan your wedding like never before</h2>
        <p className="text-gray-300 text-lg max-w-xl mx-auto">
          Let Moments.live help you create a shared memory vault from your big day. Designed especially for couples who want to cherish every angle of their celebration.
        </p>
        <button className="bg-[#2a4d32] hover:bg-[#1e3b27] text-white text-lg px-10 py-4 rounded-full shadow-xl">
          Contact Us
        </button>
      </motion.section>
    </div>
  );
} 