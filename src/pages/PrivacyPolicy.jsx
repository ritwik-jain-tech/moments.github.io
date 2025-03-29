import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const privacySections = [
  {
    title: "Information We Collect",
    content: [
      "Personal Information: Name, email address, etc.",
      "Photos & Videos: Images and videos uploaded.",
      "Event Details: Event names, dates, and guest lists.",
      "Usage Data: Activity logs and engagement patterns.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "Personalize your experience on the platform.",
      "Allow you to create and share moments with guests.",
      "Enhance platform performance and provide better customer support.",
    ],
  },
  {
    title: "Data Sharing & Disclosure",
    content: [
      "We do not sell or share your data, except in these cases:",
      "With your explicit consent.",
      "When required by law.",
      "For service providers (e.g., hosting).",
    ],
  },
  {
    title: "Security of Your Data",
    content: [
      "We implement industry-leading security measures to protect your data, but no system is 100% secure.",
    ],
  },
  {
    title: "Your Data Choices",
    content: [
      "Access, correct, or delete your personal data.",
      "Opt out of marketing messages.",
      "Request a copy or deletion of your data.",
      "To exercise your rights, email us at support@moments.live",
    ],
  },
  {
    title: "Changes to This Privacy Policy",
    content: [
      "We may update this Privacy Policy as necessary. Please check back for updates.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen text-white px-6 pb-16 space-y-24 font-sans relative overflow-hidden bg-[#000001]">
      {/* Header gradient + arc line */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#67143A] via-[#1a0015] to-transparent z-0" />
      <div className="absolute top-[320px] left-0 w-full h-[1px] z-0">
        <svg viewBox="0 0 1440 20" className="w-full h-full">
          <path d="M0,10 C360,-10 1080,-10 1440,10" fill="transparent" stroke="#D64897" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 pt-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <img src="/public/logo.png" alt="Moments Logo" className="w-8 h-8 mr-2" />
            <span className="text-[#F1A2D5] text-2xl font-bold">moments</span>
          </motion.div>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-[#67143A] hover:bg-[#4f0f2d] text-white px-6 py-2 rounded-full"
          >
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-8"
        >
          Privacy Policy
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-300 text-lg mb-12 text-center"
        >
          At Moments.live, your privacy is important to us. This Privacy Policy explains how we handle your personal data and the steps we take to protect it.
        </motion.p>

        <div className="space-y-6">
          {privacySections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1C1C1C] rounded-xl p-6 shadow-lg border border-gray-800"
            >
              <h2 className="text-2xl font-semibold mb-4 text-[#F1A2D5]">
                {section.title}
              </h2>
              <ul className="space-y-2 text-gray-300">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center text-sm text-gray-500">
        © 2025 moments.live — All rights reserved.
      </footer>
    </div>
  );
} 