import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, ArrowRight, Check, X, MessageCircle, Instagram, Mail, ArrowUpRight, Sparkles, Upload, ScanFace } from "lucide-react";
import Navbar from "../components/Navbar";
import ContactSection from "../components/ContactSection";
import LiquidButton from "../components/LiquidButton";

const HERO_PHONE = "/iosCreative1.png"; // full iPhone mockup (transparent), floats on any bg
const LOGO_FULL_WHITE = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/i9w6b5xn_Full%20moments%20logo.png';

const FRAMER = "https://framerusercontent.com/images/";
const IMG_ONBOARDING = `${FRAMER}9uII71v5xBbuKsydXxfhr9VKAE.png?scale-down-to=512`;
const IMG_FEED = `${FRAMER}R3U796O2tu9nCkGBUHnkHx4rI.png?scale-down-to=512`;
const IMG_QR = `/qrFeature.png`; // local, background removed (transparent)
const GIF_NO_APP = `/noApp.webp`; // local, background removed (transparent)
const GIF_AI = `/appFinder.webp`; // local, background removed (transparent)
const IMG_BOT = `${FRAMER}3vxslAO6bbysl4xwkMAPfppOGpo.png?scale-down-to=512`;

const TESTIMONIAL_IMGS = [
  `${FRAMER}wbFhpX5uSAGIwczrG2Ervvaj4ac.png?width=600`,
  `${FRAMER}OXF8xG3iqQafwQSyt2UnzF9vfg.png?width=600`,
  `${FRAMER}nRoPUCnNqKTD4j7rms4YwXUzmc.png?width=600`,
];

const WHATSAPP = "https://wa.me/918962364626";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// The source images are already-rendered phone mockups (bezel, notch, status bar)
// on a transparent background — so we show them at their natural aspect ratio
// instead of cropping them into a second device frame.
const PhoneMockup = ({ src, alt = "", className = "" }) => (
  <div className={`relative ${className}`}>
    <img
      src={src}
      alt={alt}
      className="w-full h-auto block object-contain drop-shadow-2xl"
      loading="lazy"
    />
  </div>
);

const SectionTag = ({ children, dark = false }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 ${dark ? "text-white/40" : "text-brand/60"}`}>
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
            className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 rounded-full px-4 py-1.5 mb-8">
            <Star size={11} className="text-brand fill-brand" />
            <span className="text-brand text-[11px] font-semibold tracking-wide">The #1 Wedding Photo Sharing App</span>
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="font-tight font-bold text-ink text-[2.5rem] md:text-[4rem] lg:text-[5rem] leading-[1.05] tracking-tight max-w-3xl mb-6">
            Your Own Pinterest<br />
            <span className="gradient-text-shimmer">for Wedding Photos</span>
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-muted text-base md:text-lg leading-relaxed max-w-lg mb-10 font-medium">
            Find every photo of you and your guests, all in one beautiful place.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-16">
            <LiquidButton variant="primary"
              onClick={() => document.querySelector("#free-trial")?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3.5 text-sm">
              Start Free Trial <ArrowRight size={14} />
            </LiquidButton>
            <LiquidButton variant="ghost"
              onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3.5 text-sm font-semibold">
              See How It Works
            </LiquidButton>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: phoneY }} className="w-full flex justify-center">
          <div className="relative w-56 md:w-72">
            <div className="absolute -inset-10 bg-brand/5 rounded-full blur-3xl" />
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
  <section id="features" className="bg-panel py-14 md:py-20 relative overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag>Designed For Your Day</SectionTag></motion.div>
        <motion.h2 variants={fadeUp}
          className="font-tight font-bold text-ink text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight max-w-2xl mx-auto">
          Your Personal Wedding Pinterest Starts Here
        </motion.h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }}
            className="rounded-2xl overflow-hidden border border-line/20 bg-surface/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-brand/10">
            <div className="bg-[#FFF5E9] flex items-center justify-center p-8 h-64">
              <img src={f.img} alt={f.tag} className="h-full object-contain drop-shadow-lg" loading="lazy" />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand/60">{f.tag}</span>
              <h3 className="font-tight font-bold text-ink text-[15px] mt-1 mb-2 tracking-tight leading-snug">{f.title}</h3>
              <p className="text-muted text-[13px] leading-relaxed font-medium">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ── AI Photo Finder ───────────────────────────────────────────────────────────

const AIPhotoFinder = () => (
  <section className="bg-canvas py-14 md:py-20 relative overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-5 md:px-10">
      <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="flex-1 order-2 lg:order-1">
          <motion.div variants={fadeUp}><SectionTag>✦ Feature That Works Like Magic</SectionTag></motion.div>
          <motion.h2 variants={fadeUp}
            className="font-tight font-bold text-ink text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight mb-5">
            AI-Powered<br />Photo Finder
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted text-[15px] leading-relaxed mb-8 max-w-md font-medium">
            Guests selfie once and instantly find every photo they're in. You just enjoy the day.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            {["Find your photos with a single selfie", "Works for every guest automatically", "No manual tagging needed"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-brand" />
                </div>
                <span className="text-muted text-[13px] font-semibold">{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-56 md:w-64 order-1 lg:order-2 relative">
          <div className="absolute -inset-8 bg-brand/5 rounded-full blur-3xl" />
          <PhoneMockup src={GIF_AI} alt="AI Photo Finder" />
        </motion.div>
      </div>
    </div>
  </section>
);

// ── Guest POV (unique offering) ───────────────────────────────────────────────

const GuestPOV = () => (
  <section className="bg-canvas py-14 md:py-20 relative overflow-hidden">
    <div className="max-w-[1100px] mx-auto px-5 md:px-10">
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-brand-2 p-8 md:p-12 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-[90px] pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 text-on-brand/80 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
            <Sparkles size={12} /> Only on Moments
          </span>
          <h2 className="font-tight font-bold text-on-brand text-[2rem] md:text-[2.8rem] leading-[1.08] tracking-tight mb-4">
            Your day, through every guest&apos;s eyes.
          </h2>
          <p className="text-on-brand/80 text-[15px] leading-relaxed mb-7 max-w-lg">
            Guests don&apos;t just find their photos — they add their own. Every candid from your friends&apos;
            phones joins one shared gallery, so you relive the celebration from every single angle.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              { icon: Upload, t: 'Guests upload their own POV — photos & videos you never had' },
              { icon: Star, t: 'Every moment you missed, captured by someone who did' },
              { icon: ScanFace, t: 'Auto-sorted to the right people with FaceID' },
            ].map(({ icon: I, t }) => (
              <li key={t} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-on-brand/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <I size={12} className="text-on-brand" />
                </span>
                <span className="text-on-brand/90 text-[13.5px] font-medium">{t}</span>
              </li>
            ))}
          </ul>
          <motion.a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-on-brand text-brand px-6 py-3 rounded-full text-sm font-bold shadow-lg">
            Get Started <ArrowRight size={14} />
          </motion.a>
        </div>
        <div className="relative z-10 flex justify-center">
          <div className="w-52 md:w-60 animate-float">
            <PhoneMockup src={IMG_FEED} alt="Guest POV feed" />
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

// ── Moments Bot ───────────────────────────────────────────────────────────────

const MomentsBot = () => (
  <section id="how-it-works" className="bg-canvas py-14 md:py-20 relative overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-5 md:px-10">
      <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-56 md:w-64 relative">
          <div className="absolute -inset-8 bg-brand/5 rounded-full blur-3xl" />
          <PhoneMockup src={IMG_BOT} alt="Moments Bot" />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex-1">
          <motion.div variants={fadeUp}><SectionTag>Moments Bot</SectionTag></motion.div>
          <motion.h2 variants={fadeUp}
            className="font-tight font-bold text-ink text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight mb-5">
            The Gentle<br />Photo Collector
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted text-[15px] leading-relaxed mb-8 max-w-md font-medium">
            Our WhatsApp bot nudges guests to share photos automatically. No chasing — memories collect themselves.
          </motion.p>
          <motion.a variants={fadeUp} href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-[#294D32] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors shadow-md shadow-brand/15">
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
  <section className="bg-panel py-14 md:py-20 relative overflow-hidden">
    <div className="max-w-[700px] mx-auto px-5 md:px-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-12">
        <motion.div variants={fadeUp}><SectionTag>Before Moments</SectionTag></motion.div>
        <motion.h2 variants={fadeUp}
          className="font-tight font-bold text-ink text-[2rem] md:text-[2.8rem] leading-[1.1] tracking-tight">
          Wave goodbye to
        </motion.h2>
      </motion.div>

      <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="space-y-3">
        {painPoints.map((point, i) => (
          <motion.li key={i} variants={fadeUp}
            className="flex items-center gap-4 rounded-2xl px-6 py-4 border border-line/20 bg-surface/50 backdrop-blur-sm">
            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <X size={11} className="text-red-400" />
            </div>
            <span className="text-muted text-[13px] font-medium line-through decoration-muted/30">{point}</span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-5 rounded-2xl bg-[#294D32] px-6 py-5 text-center">
        <img src={LOGO_FULL_WHITE} alt="Moments" className="h-6 md:h-7 w-auto mx-auto mb-2 brightness-0 invert" />
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
  <section className="py-14 md:py-20 relative overflow-hidden" style={{ background: '#1e1e1e' }}>
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

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-14 max-w-3xl mx-auto">
        {[
          { value: "3", label: "Weddings Tested" },
          { value: "500+", label: "Guests on App" },
          { value: "2,000+", label: "Guest Photos Uploaded" },
          { value: "< 1hr", label: "vs. Days Traditional" },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp}
            className="rounded-2xl p-4 text-center bg-white/5 border border-white/10">
            <div className="font-tight font-bold text-2xl md:text-3xl text-white mb-1 tracking-tight">{s.value}</div>
            <div className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ── Footer ────────────────────────────────────────────────────────────────────

const FOOTER_LINK = "text-white/30 hover:text-white text-xs transition-colors font-medium text-left";
const FOOTER_HEAD = "font-bold text-white/60 text-[10px] mb-5 uppercase tracking-[0.2em]";

const appExperienceLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "For Photographers", href: "/" },
];
const guestCompanyLinks = [
  { label: "About", href: "#" },
  { label: "Contact", href: WHATSAPP, external: true },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Delete Account", href: "/deleteAccount" },
];
const guestSocialLinks = [
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "WhatsApp", href: WHATSAPP, Icon: MessageCircle },
];

const LandingFooter = () => (
  <footer className="bg-[#294D32] text-white">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
        <div className="md:col-span-1">
          <img src={LOGO_FULL_WHITE} alt="Moments" className="h-6 mb-4 brightness-0 invert" />
          <p className="text-white/40 text-xs leading-relaxed mb-4 font-medium">The #1 Wedding Photo Sharing App</p>
          <a href="mailto:hello@moments.live" className="inline-flex items-center gap-2 text-white/35 hover:text-white text-xs transition-colors font-medium">
            <Mail size={12} />hello@moments.live
          </a>
        </div>

        <div>
          <h4 className={FOOTER_HEAD}>App Experience</h4>
          <ul className="space-y-3">
            {appExperienceLinks.map((link) => (
              <li key={link.label}>
                {link.href.startsWith("/") ? (
                  <Link to={link.href} className={FOOTER_LINK}>{link.label}</Link>
                ) : (
                  <button onClick={() => document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" })} className={FOOTER_LINK}>{link.label}</button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={FOOTER_HEAD}>Company</h4>
          <ul className="space-y-3">
            {guestCompanyLinks.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>{link.label}</a>
                ) : link.href.startsWith("/") ? (
                  <Link to={link.href} className={FOOTER_LINK}>{link.label}</Link>
                ) : (
                  <button className={FOOTER_LINK}>{link.label}</button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={FOOTER_HEAD}>Connect</h4>
          <div className="flex flex-col gap-3">
            {guestSocialLinks.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/30 hover:text-white text-xs transition-colors font-medium">
                <Icon size={12} />{label}<ArrowUpRight size={10} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/10 my-10" />

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
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeaturesSection />
      <AIPhotoFinder />
      <GuestPOV />
      <MomentsBot />
      <WaveGoodbye />
      <Testimonials />
      <ContactSection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
