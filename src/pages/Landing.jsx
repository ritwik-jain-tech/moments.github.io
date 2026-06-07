import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ChevronUp, Star, ArrowRight, Check, X, MessageCircle } from "lucide-react";

const LOGO = "/logo.png";
const HERO_PHONE = "/iosCreative1.png";
const PHONE_FEED = "/iosCreative2.png";
const PHONE_QR = "/iosCreative3.png";

const FRAMER = "https://framerusercontent.com/images/";
const IMG_ONBOARDING = `${FRAMER}9uII71v5xBbuKsydXxfhr9VKAE.png?scale-down-to=512`;
const IMG_FEED = `${FRAMER}R3U796O2tu9nCkGBUHnkHx4rI.png?scale-down-to=512`;
const IMG_QR = `${FRAMER}h1tSvmSRqHbQMtCgolC3gtJXec.png?scale-down-to=512`;
const GIF_NO_APP = `${FRAMER}9x0p4ZxiCSze0wcp64zauZxYVtU.gif`;
const IMG_AI_PHONE = `${FRAMER}TRuW5KyTVGVAWBgXC6MeefzvIs.png?scale-down-to=512`;
const GIF_AI = `${FRAMER}puPnByXfJCIwtnXHsryGdtLFkAA.gif`;
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

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

const PhoneMockup = ({ src, alt = "", className = "", isGif = false }) => (
  <div className={`relative ${className}`}>
    <div className="relative bg-black rounded-[2.5rem] shadow-2xl overflow-hidden border-[3px] border-black/80"
      style={{ width: "100%", aspectRatio: "9/19.5" }}>
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 rounded-[2.5rem] shadow-inner pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
    </div>
  </div>
);

const SectionTag = ({ children, dark = false }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 ${dark ? "text-white/40" : "text-[#2a4d32]/60"}`}>
    {children}
  </span>
);

const Nav = () => {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#f3efe6]/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <img src={LOGO} alt="Moments" className="h-6 object-contain" />

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo("#features")} className="text-sm font-medium text-[#1e1e1e]/60 hover:text-[#1e1e1e] transition-colors">Features</button>
          <button onClick={() => scrollTo("#how-it-works")} className="text-sm font-medium text-[#1e1e1e]/60 hover:text-[#1e1e1e] transition-colors">How It Works</button>
          <button onClick={() => scrollTo("#pricing")} className="text-sm font-medium text-[#1e1e1e]/60 hover:text-[#1e1e1e] transition-colors">Pricing</button>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="bg-[#2a4d32] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#1e3a25] transition-colors">
            Contact Us
          </a>
        </div>

        <button className="md:hidden text-[#1e1e1e]" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="w-5 flex flex-col gap-1">
            <span className={`h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#f3efe6]/98 backdrop-blur-md border-t border-[#ded8d3] px-6 py-4 flex flex-col gap-4">
            <button onClick={() => scrollTo("#features")} className="text-sm font-medium text-[#1e1e1e]/60 text-left">Features</button>
            <button onClick={() => scrollTo("#how-it-works")} className="text-sm font-medium text-[#1e1e1e]/60 text-left">How It Works</button>
            <button onClick={() => scrollTo("#pricing")} className="text-sm font-medium text-[#1e1e1e]/60 text-left">Pricing</button>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="bg-[#2a4d32] text-white text-sm font-semibold px-5 py-2.5 rounded-full text-center">
              Contact Us
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={ref} className="relative pt-28 md:pt-32 pb-0 overflow-hidden min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto px-6 w-full flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center">
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 bg-[#2a4d32]/8 border border-[#2a4d32]/15 rounded-full px-4 py-1.5 mb-8">
            <Star size={11} className="text-[#2a4d32] fill-[#2a4d32]" />
            <span className="text-[#2a4d32] text-[11px] font-semibold tracking-wide">The #1 Wedding Photo Sharing App</span>
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="font-tight font-bold text-[#1e1e1e] text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-3xl mb-6">
            Your Own Pinterest<br />
            <span className="text-[#2a4d32]">for Wedding Photos</span>
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-[#1e1e1e]/50 text-base md:text-lg leading-relaxed max-w-lg mb-10 font-medium">
            Find photos of you, your guests, and the ones clicked by your photographer — all in one beautiful place.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-16">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="bg-[#2a4d32] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#2a4d32]/20">
              Get Started <ArrowRight size={14} />
            </a>
            <button onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
              className="border border-[#ded8d3] text-[#1e1e1e]/60 px-7 py-3.5 rounded-full text-sm font-semibold hover:border-[#2a4d32]/30 hover:text-[#1e1e1e] transition-all">
              See How It Works
            </button>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: phoneY }} className="w-full flex justify-center">
          <div className="relative w-56 md:w-72">
            <div className="absolute -inset-10 bg-[#2a4d32]/5 rounded-full blur-3xl" />
            <PhoneMockup src={HERO_PHONE} alt="Moments app" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const features = [
  {
    tag: "Personalized Onboarding",
    title: "Your Names. Your Story. Your Welcome.",
    desc: "A custom illustration and personalized greeting welcome every guest — unmistakably YOUR celebration.",
    img: IMG_ONBOARDING,
  },
  {
    tag: "Your Personalized Feed",
    title: "Your Own Pinterest-Style Photo Feed",
    desc: "Beautiful, curated, and organized — your wedding photos arranged the way you love them.",
    img: IMG_FEED,
  },
  {
    tag: "Personalised QR Code",
    title: "Share With Every Guest Instantly",
    desc: "One scan unlocks the whole gallery. Your custom QR code turns every guest into a photographer.",
    img: IMG_QR,
  },
  {
    tag: "No App Download",
    title: "Just Scan & Go",
    desc: "App Clips and Instant Apps let guests join your wedding gallery in seconds — no download needed.",
    img: GIF_NO_APP,
  },
];

const FeaturesSection = () => (
  <section id="features" className="py-20 md:py-28 px-6">
    <div className="max-w-6xl mx-auto">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag>Designed For Your Day</SectionTag></motion.div>
        <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-5xl leading-tight tracking-tight max-w-2xl mx-auto">
          Your Personal Wedding Pinterest Starts Here
        </motion.h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {features.map((f, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
            className="bg-white rounded-3xl overflow-hidden border border-[#ded8d3]/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="bg-[#f8f5ef] flex items-center justify-center p-8 h-72">
              <img src={f.img} alt={f.tag} className="h-full object-contain drop-shadow-lg" loading="lazy" />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2a4d32]/60">{f.tag}</span>
              <h3 className="font-tight font-bold text-[#1e1e1e] text-lg mt-1 mb-2 tracking-tight">{f.title}</h3>
              <p className="text-[#1e1e1e]/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const AIPhotoFinder = () => (
  <section className="py-20 md:py-28 px-6 bg-[#f8f5ef]">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="flex-1 order-2 lg:order-1">
          <motion.div variants={fadeUp}><SectionTag>✦ Feature That Works Like Magic</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-5xl leading-tight tracking-tight mb-5">
            AI-Powered<br />Photo Finder
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#1e1e1e]/50 text-base leading-relaxed mb-8 max-w-md">
            The #1 post-wedding headache — solved. Guests take a quick selfie and instantly find every photo they appear in. You enjoy being newlyweds.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            {["Find your photos with a single selfie", "Works for every guest automatically", "No manual tagging needed"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#2a4d32]/10 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-[#2a4d32]" />
                </div>
                <span className="text-[#1e1e1e]/70 text-sm font-medium">{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-56 md:w-72 order-1 lg:order-2 relative">
          <div className="absolute -inset-8 bg-[#2a4d32]/5 rounded-full blur-3xl" />
          <PhoneMockup src={GIF_AI} alt="AI Photo Finder" />
        </motion.div>
      </div>
    </div>
  </section>
);

const SocialProof = () => {
  const avatarColors = ["bg-rose-200", "bg-amber-200", "bg-sky-200", "bg-violet-200", "bg-emerald-200"];
  const initials = ["R", "A", "S", "M", "K"];
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center">
          {avatarColors.map((c, i) => (
            <div key={i} className={`w-10 h-10 rounded-full ${c} border-2 border-[#f3efe6] flex items-center justify-center font-bold text-sm text-[#1e1e1e]/60 ${i > 0 ? "-ml-3" : ""}`}>
              {initials[i]}
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-[#1e1e1e]/70 text-sm font-medium">Trusted by 500+ happy couples across India</p>
        </div>
      </div>
    </section>
  );
};

const MomentsBot = () => (
  <section id="how-it-works" className="py-20 md:py-28 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-56 md:w-72 relative">
          <div className="absolute -inset-8 bg-[#2a4d32]/5 rounded-full blur-3xl" />
          <PhoneMockup src={IMG_BOT} alt="Moments Bot" />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex-1">
          <motion.div variants={fadeUp}><SectionTag>Moments Bot</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-5xl leading-tight tracking-tight mb-5">
            The Gentle<br />Photo Collector
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#1e1e1e]/50 text-base leading-relaxed mb-8 max-w-md">
            Our WhatsApp bot gently nudges guests to share their photos — so you don't have to chase anyone for months. Memories collect themselves.
          </motion.p>
          <motion.a variants={fadeUp} href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#2a4d32] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors">
            <MessageCircle size={14} /> Try on WhatsApp
          </motion.a>
        </motion.div>
      </div>
    </div>
  </section>
);

const painPoints = [
  "Endless WhatsApp forwards filling your inbox",
  "Chasing guests for photos for months",
  'Guests asking "Where are my photos?"',
  "Memories scattered across 10 different apps",
  "Candid moments getting lost forever",
];

const WaveGoodbye = () => (
  <section className="py-20 md:py-28 px-6 bg-[#f8f5ef]">
    <div className="max-w-3xl mx-auto">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag>Before Moments</SectionTag></motion.div>
        <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-5xl leading-tight tracking-tight">
          Wave goodbye to
        </motion.h2>
      </motion.div>

      <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="space-y-3">
        {painPoints.map((point, i) => (
          <motion.li key={i} variants={fadeUp}
            className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-[#ded8d3]/50">
            <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <X size={12} className="text-red-400" />
            </div>
            <span className="text-[#1e1e1e]/60 text-sm font-medium line-through decoration-[#1e1e1e]/25">{point}</span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-6 rounded-2xl bg-[#2a4d32] px-6 py-5 text-center">
        <p className="text-white font-tight font-bold text-lg">Hello, Moments ✦</p>
        <p className="text-white/60 text-sm mt-1">All your wedding memories. One beautiful place.</p>
      </motion.div>
    </div>
  </section>
);

const testimonials = [
  {
    quote: "We thought we'd only have our photographer's shots, but Moments gave us hundreds of candid pictures from our friends and family. It felt like reliving the wedding through everyone's eyes.",
    names: "Rhea & Arjun",
    location: "Udaipur",
    img: TESTIMONIAL_IMGS[0],
  },
  {
    quote: "Normally, we chase relatives for months for photos. This time, by the next morning, we had everything beautifully organized. It was the easiest part of the whole wedding!",
    names: "Ananya (Bride's Sister)",
    location: "Mumbai",
    img: TESTIMONIAL_IMGS[1],
  },
  {
    quote: "At such a big wedding, so many small moments get lost. With Moments, nothing slipped away — every smile, every dance step, every hug was waiting for us in one place.",
    names: "Siddharth & Meera",
    location: "Delhi",
    img: TESTIMONIAL_IMGS[2],
  },
];

const Testimonials = () => (
  <section className="py-20 md:py-28 px-6 bg-[#1e1e1e]">
    <div className="max-w-6xl mx-auto">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag dark>Love Letters from Our Couples</SectionTag></motion.div>
        <motion.h2 variants={fadeUp} className="font-tight font-bold text-white text-3xl md:text-5xl leading-tight tracking-tight max-w-2xl mx-auto">
          The choice of couples who believe every moment matters.
        </motion.h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
            className="rounded-3xl overflow-hidden border border-white/8 bg-white/5 flex flex-col">
            <div className="h-56 overflow-hidden">
              <img src={t.img} alt={t.names} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <p className="text-white/70 text-sm leading-relaxed italic flex-1 mb-4">"{t.quote}"</p>
              <div>
                <p className="text-white font-semibold text-sm">{t.names}</p>
                <p className="text-white/30 text-xs">{t.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const pricingPlans = [
  {
    name: "Single Day Event",
    subtitle: "Perfect for Engagement or Reception",
    price: "11,000",
    badge: "Most chosen by couples",
    features: [
      "Single event coverage",
      "3 years of secure storage",
      "Up to 5,000 photos",
      "Priority event support",
      "Unlimited guest access",
      "AI photo finder for everyone",
    ],
    popular: false,
  },
  {
    name: "Multiple Days",
    subtitle: "Perfect for Multi-Day Weddings",
    price: "21,000",
    badge: null,
    note: "We accept only a few weddings per day to ensure every couple gets the perfect experience.",
    features: [
      "Multiple events covered",
      "3 years of secure storage",
      "25,000 photos capacity",
      "Extended support period",
      "Unlimited guest access",
      "AI photo finder for everyone",
    ],
    popular: true,
  },
];

const Pricing = () => (
  <section id="pricing" className="py-20 md:py-28 px-6 bg-[#f3efe6]">
    <div className="max-w-4xl mx-auto">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="text-center mb-14">
        <motion.div variants={fadeUp}><SectionTag>Investment in Forever</SectionTag></motion.div>
        <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-5xl leading-tight tracking-tight max-w-xl mx-auto">
          Every Celebration Deserves Its Perfect Plan
        </motion.h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {pricingPlans.map((plan, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
            className={`relative rounded-3xl p-8 border flex flex-col transition-all duration-300 ${plan.popular ? "border-[#2a4d32]/25 bg-white shadow-lg shadow-[#2a4d32]/8" : "border-[#ded8d3] bg-white/60"}`}>
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#2a4d32] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  ✦ Most Popular
                </span>
              </div>
            )}
            <div className="mb-1">
              <h3 className="font-tight font-bold text-[#1e1e1e] text-lg tracking-tight">{plan.name}</h3>
              <p className="text-[#1e1e1e]/40 text-sm">{plan.subtitle}</p>
            </div>
            <div className="my-5">
              <span className="font-tight font-bold text-[#1e1e1e] text-5xl">₹{plan.price}</span>
              <span className="text-[#1e1e1e]/30 text-sm font-medium"> /-</span>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className={`w-full py-3 rounded-full text-sm font-bold text-center transition-colors mb-6 block ${plan.popular ? "bg-[#2a4d32] text-white hover:bg-[#1e3a25]" : "border border-[#ded8d3] text-[#1e1e1e]/60 hover:border-[#2a4d32]/30 hover:text-[#1e1e1e]"}`}>
              Reserve Your Date
            </a>
            <ul className="space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check size={12} className="text-[#2a4d32] flex-shrink-0" />
                  <span className="text-[#1e1e1e]/60 text-sm">{f}</span>
                </li>
              ))}
            </ul>
            {plan.badge && <p className="mt-4 text-xs font-bold text-[#2a4d32]">{plan.badge}</p>}
            {plan.note && <p className="mt-4 text-xs text-[#1e1e1e]/30 leading-relaxed">{plan.note}</p>}
          </motion.div>
        ))}
      </motion.div>

      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-center mt-8 text-[#1e1e1e]/30 text-sm">
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="text-[#2a4d32] font-semibold hover:underline">Get Your Spot Now!</a>
        {" · "}
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="text-[#2a4d32] font-semibold hover:underline">Know More</a>
      </motion.p>
    </div>
  </section>
);

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
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="text-center mb-12">
          <motion.div variants={fadeUp}><SectionTag>FAQs</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-4xl leading-tight tracking-tight">
            Frequently Asked Questions
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl border border-[#ded8d3]/50 bg-white overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-4 text-left flex justify-between items-center gap-4">
                <span className="font-tight font-semibold text-[#1e1e1e] text-sm leading-snug">{faq.q}</span>
                <span className="flex-shrink-0 text-[#2a4d32]">
                  {open === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                    <p className="px-6 pb-5 text-[#1e1e1e]/50 text-sm leading-relaxed">{faq.a}</p>
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

const CTA = () => (
  <section className="py-16 md:py-24 px-6 bg-[#f8f5ef]">
    <div className="max-w-xl mx-auto text-center">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.h2 variants={fadeUp} className="font-tight font-bold text-[#1e1e1e] text-3xl md:text-4xl leading-tight tracking-tight mb-4">
          Have Questions?<br />We're Here to Help.
        </motion.h2>
        <motion.p variants={fadeUp} className="text-[#1e1e1e]/50 text-base mb-8">
          Reach out to our team — we're happy to walk you through everything.
        </motion.p>
        <motion.div variants={fadeUp}>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#2a4d32] text-white px-8 py-4 rounded-full font-bold hover:bg-[#1e3a25] transition-colors shadow-lg shadow-[#2a4d32]/20">
            <MessageCircle size={16} /> Contact Us on WhatsApp
          </a>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const LandingFooter = () => (
  <footer className="py-8 px-6 bg-[#1e1e1e] text-center">
    <img src={LOGO} alt="Moments" className="h-5 object-contain mx-auto mb-3 brightness-0 invert opacity-50" />
    <p className="text-white/20 text-xs mb-3">© 2025 Moments.Live. All rights reserved.</p>
    <div className="flex items-center justify-center gap-6 text-white/30 text-xs">
      <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
      <Link to="/deleteAccount" className="hover:text-white transition-colors">Delete Account</Link>
      <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
    </div>
  </footer>
);

const Landing = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#1e1e1e] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Nav />
      <Hero />
      <FeaturesSection />
      <AIPhotoFinder />
      <SocialProof />
      <MomentsBot />
      <WaveGoodbye />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <LandingFooter />
    </div>
  );
};

export default Landing;
