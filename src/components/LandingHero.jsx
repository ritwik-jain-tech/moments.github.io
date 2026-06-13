import React, { useRef } from 'react';
import { heroData, platformFeaturesData, STUDIO_SIGNUP } from '../data/mockData';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Star } from 'lucide-react';
import BrowserFrame from './BrowserFrame';
import { EASE } from '../lib/motion';

const SECONDARY = platformFeaturesData.features[1]?.image || heroData.dashboardImage;

const LandingHero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const frameY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const frameScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const frameOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center overflow-hidden bg-canvas pt-28 md:pt-32">
      {/* Aurora background */}
      <motion.div style={{ y: auroraY }} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-aurora absolute top-[-10%] left-[8%] w-[42vw] h-[42vw] max-w-[560px] max-h-[560px] rounded-full bg-brand/20 blur-[120px]" />
        <div className="animate-aurora absolute top-[5%] right-[6%] w-[38vw] h-[38vw] max-w-[520px] max-h-[520px] rounded-full bg-accent/30 blur-[130px]" style={{ animationDelay: '-7s' }} />
        <div className="animate-aurora absolute bottom-[0%] left-1/2 -translate-x-1/2 w-[50vw] h-[34vw] max-w-[640px] max-h-[440px] rounded-full bg-accent-2/10 blur-[140px]" style={{ animationDelay: '-13s' }} />
      </motion.div>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10 w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-surface/60 backdrop-blur-sm border border-line/50 rounded-full px-4 py-1.5 mb-7"
        >
          <Star size={11} className="text-brand fill-brand" />
          <span className="text-ink/70 text-[11px] font-semibold tracking-wide uppercase">Media Management for Professional Photographers</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
          className="font-tight font-bold text-ink text-[2.6rem] md:text-[4rem] lg:text-[4.6rem] leading-[1.04] tracking-tight max-w-4xl mb-5"
        >
          Your Creative Hub.<br />
          <span className="gradient-text-shimmer">Manage &amp; Deliver Seamlessly.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
          className="text-muted text-base md:text-lg leading-relaxed max-w-xl mb-9 font-medium"
        >
          One platform to manage, deliver, and monetize your event media — less admin, more creative work.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28 }}
          className="flex flex-col sm:flex-row gap-3 mb-14"
        >
          <motion.a href={STUDIO_SIGNUP} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}
            className="bg-brand text-on-brand px-7 py-3.5 rounded-full text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 btn-shine shadow-lg shadow-brand/20">
            Start Free Trial <ArrowRight size={14} />
          </motion.a>
          <motion.button whileHover={{ scale: 1.03 }}
            onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="border border-line text-muted px-7 py-3.5 rounded-full text-sm font-semibold hover:border-brand/40 hover:text-ink transition-all flex items-center justify-center gap-2">
            <Play size={12} fill="currentColor" /> See How It Works
          </motion.button>
        </motion.div>
      </div>

      {/* Animated product showcase */}
      <motion.div
        style={{ y: frameY, scale: frameScale, opacity: frameOpacity }}
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
        className="relative z-10 w-full max-w-[920px] px-5 md:px-10 pb-10"
      >
        <div className="relative">
          <BrowserFrame src={heroData.dashboardImage} url="studio.moments.live" height={480} scroll />
          {/* floating secondary card for depth */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
            className="hidden md:block absolute -right-6 lg:-right-12 bottom-[-32px] w-[230px] animate-float"
          >
            <BrowserFrame src={SECONDARY} url="uploads" height={150} scroll={false} />
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-canvas to-transparent pointer-events-none z-20" />
    </section>
  );
};

export default LandingHero;
