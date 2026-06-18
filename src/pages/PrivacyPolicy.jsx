import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, ScanFace, Share2, Lock, UserCog, FileText, Camera, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const privacySections = [
  {
    icon: Camera,
    title: "Information We Collect",
    content: [
      "Account details — name, email, and phone number for studios and their guests.",
      "Photos & videos — media uploaded by photographers and contributed by guests.",
      "Face data — facial features used only to help guests find the photos they appear in.",
      "Event details — event names, dates, and guest lists.",
      "WhatsApp messages — when you interact with our WhatsApp bot to share or receive photos.",
      "Usage data — activity logs that help us keep the platform running smoothly.",
    ],
  },
  {
    icon: FileText,
    title: "How We Use Your Information",
    content: [
      "Collect, organise, and deliver event media for studios and their clients.",
      "Use AI face matching so each guest can instantly find their own photos.",
      "Send gentle WhatsApp reminders that invite guests to add their photos.",
      "Improve platform performance and provide customer support.",
    ],
  },
  {
    icon: ScanFace,
    title: "Face Recognition",
    content: [
      "We use face matching for one purpose only: helping guests find the photos they appear in.",
      "We never sell this data or use it for advertising.",
      "You can ask us to delete your face data at any time.",
    ],
  },
  {
    icon: Share2,
    title: "Data Sharing & Disclosure",
    content: [
      "We do not sell your data. We only share it:",
      "With the photography studio hosting your event.",
      "With your explicit consent.",
      "With trusted service providers (such as cloud hosting) that help us run Moments.",
      "When required by law.",
    ],
  },
  {
    icon: Lock,
    title: "Security of Your Data",
    content: [
      "We use industry-standard security measures to protect your data, though no system can be guaranteed 100% secure.",
    ],
  },
  {
    icon: UserCog,
    title: "Your Choices & Rights",
    content: [
      "Access, correct, or delete your personal data.",
      "Opt out of marketing messages at any time.",
      "Request a copy of your data, or ask us to delete it.",
      "Delete your account anytime from the Delete Account page.",
      "To exercise any of these rights, email us at hello@moments.live.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Changes to This Privacy Policy",
    content: [
      "We may update this policy from time to time. Any changes will be posted on this page.",
    ],
  },
];

export default function PrivacyPolicy() {
  // Reset scroll on mount — React Router keeps the prior page's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans relative overflow-hidden">
      <Navbar />

      {/* soft brand aurora, matching the rest of the site */}
      <div className="absolute top-[-160px] right-[-160px] w-[460px] h-[460px] rounded-full bg-accent/15 blur-[150px] animate-aurora pointer-events-none" />
      <div className="absolute top-[200px] left-[-160px] w-[420px] h-[420px] rounded-full bg-brand/10 blur-[150px] animate-aurora pointer-events-none" style={{ animationDelay: "-8s" }} />

      <main className="relative z-10 max-w-3xl mx-auto px-5 md:px-10 pt-32 md:pt-36 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
            <ShieldCheck size={13} /> Legal
          </span>
          <h1 className="text-[2.4rem] md:text-[3.2rem] font-bold text-ink leading-[1.08] tracking-tight font-tight mb-4">
            Privacy <span className="gradient-text-green">Policy</span>
          </h1>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Moments is a media platform for professional photographers and the people they create for. This policy explains what we collect, how we use it, and the choices you have.
          </p>
          <p className="text-subtle text-xs font-medium mt-4">Last updated: June 2026</p>
        </motion.div>

        <div className="space-y-4 md:space-y-5">
          {privacySections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-surface/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-line/40"
              >
                <h2 className="flex items-center gap-3 text-lg md:text-xl font-bold text-ink mb-4 tracking-tight font-tight">
                  <span className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-brand" />
                  </span>
                  {section.title}
                </h2>
                <ul className="space-y-2.5">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted text-sm md:text-[15px] leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand/50 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/deleteAccount" className="text-brand hover:underline text-sm font-semibold">
            Request account deletion →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
