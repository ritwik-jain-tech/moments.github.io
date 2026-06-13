import React from 'react';
import { howItWorksData } from '../data/mockData';
import { motion } from 'framer-motion';
import { Plus, Upload, QrCode, Sparkles, Heart } from 'lucide-react';
import { popIn, clipReveal, container, viewportOnce } from '../lib/motion';

const iconMap = { Plus, Upload, QrCode, Sparkles, Heart };

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-canvas py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-14">
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">How It Works</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] tracking-tight font-tight">
            Set up once. Run it like a pro.
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.1)}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {howItWorksData.steps.map((step, i) => {
            const Icon = iconMap[step.icon];
            return (
              <motion.div
                key={i}
                variants={popIn}
                whileHover={{ y: -6 }}
                className="rounded-2xl p-5 text-center group bg-surface/50 backdrop-blur-sm border border-line/20 hover:border-brand/30 transition-colors duration-300"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center group-hover:bg-brand/15 transition-colors">
                    <Icon size={18} className="text-brand/60 group-hover:text-brand transition-colors" />
                  </div>
                  <span className="text-line font-bold text-2xl select-none">{step.number}</span>
                </div>
                <h4 className="text-ink font-bold text-[13px] mb-1.5 tracking-tight">{step.title}</h4>
                <p className="text-muted text-[11px] leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
