// App.jsx
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';

const sections = [
  {
    title: "Keep every guest's photo in one place — no moments missed!",
    image: "public/iosCreative1.png",
  },
  {
    title: "Capture special moments of the happy couple!",
    image: "public/iosCreative2.png",
  },
  {
    title: "A private Insta-style feed just for the couple's cherished memories!",
    image: "public/iosCreative3.png",
  },
  {
    title: "Access all your uploaded photos anytime – neatly organized for you!",
    image: "public/iosCreative4.png",
  },
  {
    title: "See every memory your friends and family are capturing!",
    image: "public/iosCreative5.png",
  },
  {
    title: "Save your favorite clicks – yours or others!",
    image: "public/iosCreative6.png",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "One-time setup of your personalised wedding app",
    desc: "We build your custom wedding gallery space in minutes — tailored just for you and your big day.",
  },
  {
    step: "02",
    title: "We'll provide QR codes to be used and shared on the venue",
    desc: "Print and display these codes at entrances, tables, and key spots to make sharing seamless for guests.",
  },
  {
    step: "03",
    title: "Guests scan the QR to use the app",
    desc: "No downloads needed — instant access via a lightweight app experience right from their phone browser.",
  },
  {
    step: "04",
    title: "Guests capture or upload moments",
    desc: "They can click candid photos live or upload them from their gallery — all in a few taps.",
  },
  {
    step: "05",
    title: "Photos are moderated & validated",
    desc: "Everything shared is checked for quality and content, aligned to your custom preferences.",
  },
  {
    step: "06",
    title: "High-quality moments, always",
    desc: "No compression, no compromise — you receive full-res memories captured by the people you love.",
  },
];

export default function App() {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen text-white px-6 pb-16 space-y-24 font-sans relative overflow-hidden bg-[#000001]">
      <audio ref={audioRef} src="/emotional-melody.mp3" loop autoPlay hidden />

      {/* Floating stars */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-40"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Header gradient + arc line */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#67143A] via-[#1a0015] to-transparent z-0" />
      <div className="absolute top-[320px] left-0 w-full h-[1px] z-0">
        <svg viewBox="0 0 1440 20" className="w-full h-full">
          <path d="M0,10 C360,-10 1080,-10 1440,10" fill="transparent" stroke="#D64897" strokeWidth="0.5" />
        </svg>
      </div>

      <header className="text-center space-y-6 relative z-10 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex justify-center items-center"
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Moments Logo" className="w-12 h-12 mr-3" />
          <span className="text-[#F1A2D5] text-4xl font-bold tracking-wide">moments</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-xl md:text-2xl font-semibold tracking-tight max-w-lg mx-auto"
        >
          Capture moments from the eye of your loved ones.
        </motion.h1>
      </header>

      {sections.map((section, i) => (
        <motion.section
          key={i}
          className={`max-w-6xl mx-auto flex flex-col-reverse ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-10`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
        >
          <img
            src={section.image}
            alt={`Feature ${i + 1}`}
            className="w-full md:w-1/2 rounded-3xl shadow-[0_0_25px_-5px_#1c1c1c,0_0_10px_-2px_#1c1c1c] bg-[#1C1C1C]"
          />
          <div className="text-center md:text-left space-y-6 md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
              {section.title}
            </h2>
          </div>
        </motion.section>
      ))}

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-12 max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-semibold">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {howItWorks.map((step, index) => (
            <div key={index} className="bg-black border border-gray-800 rounded-3xl p-6 shadow-xl text-left">
              <div className="text-[#67143A] text-3xl font-bold mb-2">{step.step}</div>
              <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-300">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

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
        <Button className="bg-[#67143A] hover:bg-[#4f0f2d] text-white text-lg px-10 py-4 rounded-full shadow-xl">
          Contact Us
        </Button>
      </motion.section>

      <footer className="pt-20 text-center text-sm text-gray-500">
        <div className="space-y-4">
          <div className="flex justify-center items-center space-x-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <p>© 2025 moments.live — All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

