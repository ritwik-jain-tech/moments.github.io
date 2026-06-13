import React from 'react';
import { heroData, STUDIO_SIGNUP } from '../data/mockData';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

const GRADIENT_BG = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/ts2432xm_Frame%2026085796.png';

const LandingHero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#FFF5E9]">
      <div className="absolute inset-0 pointer-events-none">
        <img src={GRADIENT_BG} alt="" className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[120%] max-w-[1600px] h-auto opacity-35 blur-sm" />
      </div>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-24 md:pt-28 pb-12 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#F3F7EF] border border-[#D1D7C9] rounded-full px-4 py-2 mb-7"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#294D32]" />
              <span className="text-[#294D32] text-[11px] font-semibold tracking-wide uppercase">Media Management for Professionals</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[2.6rem] md:text-[3.2rem] lg:text-[3.8rem] font-bold text-[#000000] leading-[1.1] mb-3 tracking-tight"
            >
              Your Creative Hub.
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[2.6rem] md:text-[3.2rem] lg:text-[3.8rem] font-bold leading-[1.1] mb-7 tracking-tight gradient-text-green"
            >
              Manage &amp; Deliver Seamlessly.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[#68798B] text-base md:text-lg leading-relaxed mb-9 max-w-md"
            >
              One platform to manage, deliver, and monetize your event media — less admin, more creative work.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.a
                href={STUDIO_SIGNUP}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#294D32] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors flex items-center justify-center gap-2 btn-shine shadow-md shadow-[#294D32]/15"
              >
                Start Free Trial
                <ArrowRight size={14} />
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={() => { const el = document.querySelector('#how-it-works'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                className="border border-[#D1D7C9] text-[#68798B] px-7 py-3.5 rounded-full text-sm font-medium hover:border-[#294D32]/30 hover:text-[#000] transition-all flex items-center justify-center gap-2"
              >
                <Play size={12} fill="currentColor" />
                See How It Works
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full max-w-xl lg:max-w-[580px]"
          >
            <div className="relative">
              <div className="absolute -inset-5 bg-[#F4D0D8]/10 rounded-3xl blur-2xl" />
              <img src={heroData.dashboardImage} alt="Moments.Live Dashboard" className="dashboard-screenshot w-full relative z-10" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FFF5E9] to-transparent" />
    </section>
  );
};

export default LandingHero;
