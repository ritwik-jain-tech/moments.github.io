// App.jsx
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';

const sections = [
  {
    title: "Keep every guest's photo in one place — no moments missed!",
    image: "iosCreative1.png",
  },
  {
    title: "Capture special moments of the happy couple!",
    image: "iosCreative2.png",
  },
  {
    title: "A private Insta-style feed just for the couple's cherished memories!",
    image: "iosCreative3.png",
  },
  {
    title: "Access all your uploaded photos anytime – neatly organized for you!",
    image: "iosCreative4.png",
  },
  {
    title: "See every memory your friends and family are capturing!",
    image: "iosCreative5.png",
  },
  {
    title: "Save your favorite clicks – yours or others!",
    image: "iosCreative6.png",
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
  const [isScrolled, setIsScrolled] = useState(false);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleAudio = () => {

    if (audioRef.current) {
        audioRef.current.volume = 0.5;
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          console.log("Audio playback failed");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0); // Animate as soon as user scrolls
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen text-[#2a4d32] font-sans relative overflow-hidden bg-[#f3efe6]">
      <audio  ref={audioRef} src="/emotional-melody.mp3"  loop />
      
      {/* Add audio control button */}
      <button
        onClick={toggleAudio}
        className="fixed bottom-6 right-6 z-50 bg-[#67143A] hover:bg-[#4f0f2d] text-white p-3 rounded-full shadow-xl transition-all duration-300"
        aria-label={isPlaying ? "Pause Music" : "Play Music"}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Hero Section - Full viewport height */}
      <div className="h-screen relative">
        {/* Background Elements */}
        <div className="absolute inset-0">
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

          {/* Header gradient */}
          <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#67143A] via-[#1a0015] to-transparent z-0" />
        </div>

        {/* Sticky Header */}
        <motion.header
          initial={{ height: "100vh" }}
          animate={{ 
            height: isScrolled ? 45 : "100vh",
            backgroundColor: isScrolled ? '#f3efe6' : 'transparent',
          }}
          transition={{ duration: 0.9 }}
          className="fixed top-0 right-0 w-full z-50"
        >
          <div className={`h-full ${isScrolled ? '' : ''}`}>
            <motion.div
              initial={{ y: 0 }}
              animate={{ 
                y: isScrolled ? 0 : 0,
                justifyContent: isScrolled ? 'flex-start' : 'center'
              }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center h-full px-6"
            >
              {/* Center Container */}
              <div className="flex flex-col items-center justify-center flex-1">
                {/* Logo and Title Container */}
                <motion.div
                  className={`flex ${
                    isScrolled ? 'h-20 justify-start' : 'flex-col gap-6'
                  }`}
                >
                  <motion.div
                    animate={{
                      x: isScrolled ? '0%' : '0%',
                      marginLeft: isScrolled ? '24px' : '0px' // Add some margin when scrolled
                    }}
                  >
                    <img 
                      src="logo.png" 
                      alt="Moments Logo" 
                      className={`transition-all duration-300 ${
                        isScrolled ? 'w-12 h-12' : 'w-24 h-24'
                      }`}
                    />
                  </motion.div>
                  <motion.span 
                    className={`text-[#2a4d32] font-bold tracking-wide transition-all duration-300 ${
                      isScrolled ? 'text-3xl ml-3' : 'text-6xl'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: isScrolled ? 1 : 0,
                      x: isScrolled ? 0 : -20,
                      display: isScrolled ? 'block' : 'none'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                       <center>moments</center>
                  </motion.span>
                </motion.div>

                {/* Tagline - Only visible when not scrolled */}
                {/* 
                  The tagline below moves up (y: 20 -> y: 10) and fades out (opacity: 1 -> 0) 
                  WHEN isScrolled becomes true (i.e., when the user scrolls down).
                  This is the exact moment your tagline is moving up and fading out.
                */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isScrolled ? 0 : 1,
                    y: isScrolled ? 100 : 0, // <--- Tagline moves up when isScrolled is true
                    scale: isScrolled ? 0.8 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-xl md:text-2xl font-semibold tracking-tight max-w-lg mx-auto text-center mt-8"
                >
                  <div style={{ textAlign: 'left' }}>
                    <p>
                      Capture <br />
                      <span className="text-[#2a4d32] text-6xl md:text-8xl">moments</span>  <br /> 
                      through the eyes of your loved ones.
                    </p>
                  </div>
                </motion.h1>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          initial={{ opacity: 1 }}
          style={{ opacity: isScrolled ? 0 : 1 }}
        >
          <svg
            className="w-6 h-6 text-[#2a4d32] opacity-50"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="px-6 space-y-24">
        {sections.map((section, i) => (
          <motion.section
            key={i}
            className={`max-w-5xl mx-auto flex flex-col-reverse ${
              i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            } items-center gap-10`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <div className="w-full md:w-2/5">
              <img
                src={section.image}
                alt={`Feature ${i + 1}`}
                className="w-full rounded-3xl shadow-[0_0_25px_-5px_#1c1c1c,0_0_10px_-2px_#1c1c1c] bg-[#1C1C1C] max-w-[300px] mx-auto"
              />
            </div>
            <div className="text-center md:text-left space-y-6 md:w-3/5">
              <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                {section.title}
              </h2>
            </div>
          </motion.section>
        ))}

        {/* How It Works Section */}
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
              <div key={index} className="bg-[#f3efe6] border border-gray-800 rounded-3xl p-6 shadow-xl text-left">
                <div className="text-[#67143A] text-3xl font-bold mb-2">{step.step}</div>
                <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Final CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 mb-24"
        >
          <h2 className="text-4xl font-semibold">Plan your wedding like never before</h2>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Let Moments.live help you create a shared memory vault from your big day. Designed especially for couples who want to cherish every angle of their celebration.
          </p>
          <Button 
            onClick={() => {
              // Check if device is mobile
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              
              if (isMobile) {
                // WhatsApp link for mobile
                window.location.href = `https://wa.me/918962364626?text=Hi, I'm interested in knowing more about Moments.live for my wedding.`;
              } else {
                // Email link for web
                window.location.href = `mailto:moments.live.weddings@gmail.com?subject=Inquiry about Moments.live&body=Hi, I'm interested in knowing more about Moments.live for my wedding.`;
              }
            }}
            className="bg-[#67143A] hover:bg-[#4f0f2d] text-white text-lg px-10 py-4 rounded-full shadow-xl"
          >
            Contact Us
          </Button>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="bg-[#f3efe6] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/logo.png" alt="Moments" className="h-8 w-8" />
              <span className="text-xl font-semibold">moments</span>
            </div>
            <div className="flex space-x-6">
              <Link 
                to="/privacy-policy" 
                className="text-gray-400 hover:text-[#2a4d32] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/deleteAccount" 
                className="text-gray-400 hover:text-[#2a4d32] transition-colors"
              >
                Delete Account
              </Link>
              <Link 
                to="/admin/login" 
                className="text-gray-400 hover:text-[#2a4d32] transition-colors"
              >
                Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

