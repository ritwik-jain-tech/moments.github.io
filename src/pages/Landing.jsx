import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ChevronUp, Star, ArrowRight, Check, X, MessageCircle, ExternalLink } from "lucide-react";
import Navbar from "../components/Navbar";

const HERO_PHONE = "/iosCreative1.png";

const FRAMER = "https://framerusercontent.com/images/";
const IMG_ONBOARDING = `${FRAMER}9uII71v5xBbuKsydXxfhr9VKAE.png?scale-down-to=512`;
const IMG_FEED = `${FRAMER}R3U796O2tu9nCkGBUHnkHx4rI.png?scale-down-to=512`;
const IMG_QR = `${FRAMER}h1tSvmSRqHbQMtCgolC3gtJXec.png?scale-down-to=512`;
const GIF_NO_APP = `${FRAMER}9x0p4ZxiCSze0wcp64zauZxYVtU.gif`;
const GIF_AI = `${FRAMER}puPnByXfJCIwtnXHsryGdtLFkAA.gif`;
const IMG_BOT = `${FRAMER}3vxslAO6bbysl4xwkMAPfppOGpo.png?scale-down-to=512`;

const TESTIMONIAL_IMGS = [
  `${FRAMER}wbFhpX5uSAGIwczrG2Ervvaj4ac.png?width=600`,
  `${FRAMER}OXF8xG3iqQafwQSyt2UnzF9vfg.png?width=600`,
  `${FRAMER}nRoPUCnNqKTD4j7rms4YwXUzmc.png?width=600`,
];

const WHATSAPP = "https://wa.me/918962364626";
const STUDIO = "https://studio.moments.live";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const PhoneMockup = ({ src, alt = "", className = "" }) => (
  <div className={`relative ${className}`}>
    <div className="relative bg-black rounded-[2.5rem] shadow-2xl overflow-hidden border-[3px] border-black/80"
      style={{ width: "100%", aspectRatio: "9/19.5" }}>
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
    </div>
  </div>
);

const SectionTag = ({ children, dark = false }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 ${dark ? "text-white/40" : "text-[#294D32]/60"}`}>
    {children}
  </span>
);

// ── Hero ─────────────────────────────────────────────────────────────────────

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={ref} className="relative pt-28 md:pt-32 pb-0 overflow-hidden min-h-screen flex flex-col">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 w-full flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center">
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 bg-[#294D32]/8 border border-[#294D32]/15 rounded-full px-4 py-1.5 mb-8">
            <Star size={11} className="text-[#294D32] fill-[#294D32]" />
            <span className="text-[#294D32] text-[11px] font-semibold tracking-wide">The #1 Wedding Photo Sharing App</span>
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="font-tight font-bold text-[#000000] text-[2.5rem] md:text-[4rem] lg:text-[5rem] leading-[1.05] tracking-tight max-w-3xl mb-6">
            Your Own Pinterest<br />
            <span className="text-[#294D32]">for Wedding Photos</span>
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-[#68798B] text-base md:text-lg leading-relaxed max-w-lg mb-10 font-medium">
            Find photos of you, your guests, and the ones clicked by your photographer — all in one beautiful place.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-16">
            <motion.a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
              className="bg-[#294D32] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#294D32]/15 btn-shine">
              Get Started <ArrowRight size={14} />
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
              className="border border-[#D1D7C9] text-[#68798B] px-7 py-3.5 rounded-full text-sm font-semibold hover:border-[#294D32]/30 hover:text-[#000000] transition-all">
              See How It Works
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: phoneY }} className="w-full flex justify-center">
          <div className="relative w-56 md:w-72">
            <div className="absolute -inset-10 bg-[#294D32]/5 rounded-full blur-3xl" />
            <PhoneMockup src={HERO_PHONE} alt="Moments app" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ── Features ─────────────────────────────────────────────────────────────────

const features = [
  { tag: "Personalized Onboarding", title: "Your Names. Your Story. Your Welcome.", desc: "A custom illustration and personalized greeting welcome every guest — unmistakably YOUR celebration.", img: IMG_ONBOARDING },
  { tag: "Your Personalized Feed", title: "Your Own Pinterest-Style Photo Feed", desc: "Beautiful, curated, and organized — your wedding photos arranged the way you love them.", img: IMG_FEED },
  { tag: "Personalised QR Code", title: "Share With Every Guest Instantly", desc: "One scan unlocks the whole gallery. Your custom QR code turns every guest into a photographer.", img: IMG_QR },
  { tag: "No App Download", title: "Just Scan & Go", desc: "App Clips and Instant Apps let guests join your wedding gallery in seconds — no download needed.", img: GIF_NO_APP },
];

const FeaturesSection = () => (
  <section id="features" className="bg-[#F3F7EF] py-20 md:py-28 relative overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag>Designed For Your Day</SectionTag></motion.div>
        <motion.h2 variants={fadeUp}
          className="font-tight font-bold text-[#000000] text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight max-w-2xl mx-auto">
          Your Personal Wedding Pinterest Starts Here
        </motion.h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }}
            className="rounded-2xl overflow-hidden border border-[#D1D7C9]/20 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-[#294D32]/10">
            <div className="bg-[#FFF5E9] flex items-center justify-center p-8 h-64">
              <img src={f.img} alt={f.tag} className="h-full object-contain drop-shadow-lg" loading="lazy" />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#294D32]/60">{f.tag}</span>
              <h3 className="font-tight font-bold text-[#000000] text-[15px] mt-1 mb-2 tracking-tight leading-snug">{f.title}</h3>
              <p className="text-[#68798B] text-[13px] leading-relaxed font-medium">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ── AI Photo Finder ───────────────────────────────────────────────────────────

const AIPhotoFinder = () => (
  <section className="bg-[#FFF5E9] py-20 md:py-28 relative overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-5 md:px-10">
      <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="flex-1 order-2 lg:order-1">
          <motion.div variants={fadeUp}><SectionTag>✦ Feature That Works Like Magic</SectionTag></motion.div>
          <motion.h2 variants={fadeUp}
            className="font-tight font-bold text-[#000000] text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight mb-5">
            AI-Powered<br />Photo Finder
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#68798B] text-[15px] leading-relaxed mb-8 max-w-md font-medium">
            The #1 post-wedding headache — solved. Guests take a quick selfie and instantly find every photo they appear in. You enjoy being newlyweds.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            {["Find your photos with a single selfie", "Works for every guest automatically", "No manual tagging needed"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#294D32]/10 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-[#294D32]" />
                </div>
                <span className="text-[#68798B] text-[13px] font-semibold">{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-56 md:w-64 order-1 lg:order-2 relative">
          <div className="absolute -inset-8 bg-[#294D32]/5 rounded-full blur-3xl" />
          <PhoneMockup src={GIF_AI} alt="AI Photo Finder" />
        </motion.div>
      </div>
    </div>
  </section>
);

// ── Social Proof ──────────────────────────────────────────────────────────────

const SocialProof = () => {
  const avatarColors = ["bg-rose-100", "bg-amber-100", "bg-sky-100", "bg-violet-100", "bg-emerald-100"];
  const initials = ["R", "A", "S", "M", "K"];
  return (
    <section className="py-14 px-5 bg-[#F3F7EF]">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-5">
        <div className="flex items-center">
          {avatarColors.map((c, i) => (
            <div key={i}
              className={`w-10 h-10 rounded-full ${c} border-2 border-[#F3F7EF] flex items-center justify-center font-bold text-sm text-[#294D32]/60 ${i > 0 ? "-ml-3" : ""}`}>
              {initials[i]}
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1.5">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-[#68798B] text-sm font-semibold">Trusted by 500+ happy couples across India</p>
        </div>
      </div>
    </section>
  );
};

// ── Moments Bot ───────────────────────────────────────────────────────────────

const MomentsBot = () => (
  <section id="how-it-works" className="bg-[#FFF5E9] py-20 md:py-28 relative overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-5 md:px-10">
      <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-56 md:w-64 relative">
          <div className="absolute -inset-8 bg-[#294D32]/5 rounded-full blur-3xl" />
          <PhoneMockup src={IMG_BOT} alt="Moments Bot" />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex-1">
          <motion.div variants={fadeUp}><SectionTag>Moments Bot</SectionTag></motion.div>
          <motion.h2 variants={fadeUp}
            className="font-tight font-bold text-[#000000] text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight mb-5">
            The Gentle<br />Photo Collector
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#68798B] text-[15px] leading-relaxed mb-8 max-w-md font-medium">
            Our WhatsApp bot gently nudges guests to share their photos — so you don't have to chase anyone for months. Memories collect themselves.
          </motion.p>
          <motion.a variants={fadeUp} href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-[#294D32] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors shadow-md shadow-[#294D32]/15">
            <MessageCircle size={14} /> Try on WhatsApp
          </motion.a>
        </motion.div>
      </div>
    </div>
  </section>
);

// ── Wave Goodbye ──────────────────────────────────────────────────────────────

const painPoints = [
  "Endless WhatsApp forwards filling your inbox",
  "Chasing guests for photos for months",
  'Guests asking "Where are my photos?"',
  "Memories scattered across 10 different apps",
  "Candid moments getting lost forever",
];

const WaveGoodbye = () => (
  <section className="bg-[#F3F7EF] py-20 md:py-28 relative overflow-hidden">
    <div className="max-w-[700px] mx-auto px-5 md:px-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-12">
        <motion.div variants={fadeUp}><SectionTag>Before Moments</SectionTag></motion.div>
        <motion.h2 variants={fadeUp}
          className="font-tight font-bold text-[#000000] text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight">
          Wave goodbye to
        </motion.h2>
      </motion.div>

      <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="space-y-3">
        {painPoints.map((point, i) => (
          <motion.li key={i} variants={fadeUp}
            className="flex items-center gap-4 rounded-2xl px-6 py-4 border border-[#D1D7C9]/20 bg-white/50 backdrop-blur-sm">
            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <X size={11} className="text-red-400" />
            </div>
            <span className="text-[#68798B] text-[13px] font-medium line-through decoration-[#68798B]/30">{point}</span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-5 rounded-2xl bg-[#294D32] px-6 py-5 text-center">
        <p className="text-white font-tight font-bold text-lg">Hello, Moments ✦</p>
        <p className="text-white/60 text-sm mt-1">All your wedding memories. One beautiful place.</p>
      </motion.div>
    </div>
  </section>
);

// ── Testimonials ──────────────────────────────────────────────────────────────

const testimonials = [
  { quote: "We thought we'd only have our photographer's shots, but Moments gave us hundreds of candid pictures from our friends and family. It felt like reliving the wedding through everyone's eyes.", names: "Rhea & Arjun", location: "Udaipur", img: TESTIMONIAL_IMGS[0] },
  { quote: "Normally, we chase relatives for months for photos. This time, by the next morning, we had everything beautifully organized. It was the easiest part of the whole wedding!", names: "Ananya (Bride's Sister)", location: "Mumbai", img: TESTIMONIAL_IMGS[1] },
  { quote: "At such a big wedding, so many small moments get lost. With Moments, nothing slipped away — every smile, every dance step, every hug was waiting for us in one place.", names: "Siddharth & Meera", location: "Delhi", img: TESTIMONIAL_IMGS[2] },
];

const Testimonials = () => (
  <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: '#1e1e1e' }}>
    <div className="max-w-[1200px] mx-auto px-5 md:px-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag dark>Love Letters from Our Couples</SectionTag></motion.div>
        <motion.h2 variants={fadeUp}
          className="font-tight font-bold text-white text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight max-w-2xl mx-auto">
          The choice of couples who believe every moment matters.
        </motion.h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }}
            className="rounded-2xl overflow-hidden border border-white/8 bg-white/5 flex flex-col transition-all duration-300">
            <div className="h-56 overflow-hidden">
              <img src={t.img} alt={t.names} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <p className="text-white/60 text-[13px] leading-relaxed italic flex-1 mb-4">"{t.quote}"</p>
              <div>
                <p className="text-white font-semibold text-[13px]">{t.names}</p>
                <p className="text-white/30 text-xs">{t.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ── FAQ ───────────────────────────────────────────────────────────────────────

const faqs = [
  { q: "Do guests need to download an app?", a: "No. Moments App Clips and Instant Apps let guests join your wedding gallery instantly — no app download required." },
  { q: "How quickly do photos appear in the gallery?", a: "Instantly! As soon as guests or photographers upload, photos appear in your live feed." },
  { q: "Is it private? Who can see the photos?", a: "Your gallery is private and only accessible to people with your event link or QR code. You control who can view and upload." },
  { q: "What happens after 3 years?", a: "We notify you before the period ends. You can download all photos or extend storage — we'll help you keep your memories safe." },
  { q: "Can our photographer upload directly?", a: "Yes. Photographers can upload directly to your event. You get professional and candid photos in one place." },
];

const FAQ = () => {
  const [open, setOpen] = useState(null);
  return (
    <section className="bg-[#FFF5E9] py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[700px] mx-auto px-5 md:px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="text-center mb-12">
          <motion.div variants={fadeUp}><SectionTag>FAQs</SectionTag></motion.div>
          <motion.h2 variants={fadeUp}
            className="font-tight font-bold text-[#000000] text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight">
            Frequently Asked Questions
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl border border-[#D1D7C9]/20 bg-white/50 backdrop-blur-sm overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-4 text-left flex justify-between items-center gap-4">
                <span className="font-tight font-semibold text-[#000000] text-[13px] leading-snug">{faq.q}</span>
                <span className="flex-shrink-0 text-[#294D32]">
                  {open === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                    <p className="px-6 pb-5 text-[#68798B] text-[13px] leading-relaxed font-medium">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ── Studio CTA ────────────────────────────────────────────────────────────────

const StudioCTA = () => (
  <section className="bg-[#F3F7EF] py-16 md:py-20 relative overflow-hidden">
    <div className="max-w-[700px] mx-auto px-5 md:px-10 text-center">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.div variants={fadeUp}><SectionTag>For Photographers</SectionTag></motion.div>
        <motion.h2 variants={fadeUp}
          className="font-tight font-bold text-[#000000] text-[1.8rem] md:text-[2.4rem] leading-[1.1] tracking-tight mb-4">
          Are you a photographer or event planner?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-[#68798B] text-[14px] leading-relaxed mb-8 font-medium">
          Manage events, deliver media, and offer guests a premium photo experience — all from one platform.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.a href={STUDIO} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            className="bg-[#294D32] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#294D32]/15 btn-shine">
            Go to Studio <ExternalLink size={13} />
          </motion.a>
          <motion.a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            className="border border-[#D1D7C9] text-[#68798B] px-7 py-3.5 rounded-full text-sm font-semibold hover:border-[#294D32]/30 hover:text-[#000000] transition-all flex items-center justify-center gap-2">
            <MessageCircle size={13} /> Talk to Us
          </motion.a>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

// ── Footer ────────────────────────────────────────────────────────────────────

const LOGO_FULL_WHITE = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/i9w6b5xn_Full%20moments%20logo.png';

const LandingFooter = () => (
  <footer className="bg-[#294D32] text-white">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
        <div>
          <img src={LOGO_FULL_WHITE} alt="Moments" className="h-5 mb-3 brightness-0 invert" />
          <p className="text-white/40 text-xs font-medium">The #1 Wedding Photo Sharing App</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <a href={STUDIO} target="_blank" rel="noopener noreferrer"
            className="text-white/40 hover:text-white text-xs font-medium transition-colors flex items-center gap-1">
            For Photographers <ExternalLink size={10} />
          </a>
          <Link to="/privacy-policy" className="text-white/40 hover:text-white text-xs font-medium transition-colors">Privacy Policy</Link>
          <Link to="/deleteAccount" className="text-white/40 hover:text-white text-xs font-medium transition-colors">Delete Account</Link>
          <Link to="/admin" className="text-white/40 hover:text-white text-xs font-medium transition-colors">Admin</Link>
        </div>
      </div>
      <div className="w-full h-px bg-white/10 mb-8" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/40 text-xs font-medium">© 2025 Moments.Live. All rights reserved.</p>
        <p className="text-white/25 text-[10px] font-semibold tracking-[0.1em] uppercase">Your Memories. Forever.</p>
      </div>
    </div>
  </footer>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const Landing = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#FFF5E9] text-[#000000] overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeaturesSection />
      <AIPhotoFinder />
      <SocialProof />
      <MomentsBot />
      <WaveGoodbye />
      <Testimonials />
      <FAQ />
      <StudioCTA />
      <LandingFooter />
    </div>
  );
};

export default Landing;
