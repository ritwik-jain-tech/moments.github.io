import React from 'react';
import { businessCaseData } from '../data/mockData';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Check, Minus } from 'lucide-react';
import { clipReveal, viewportOnce, EASE } from '../lib/motion';

const BusinessCase = () => {
  return (
    <section className="bg-panel py-20 md:py-28 relative overflow-hidden" style={{ perspective: 1200 }}>
      <div className="absolute top-1/2 right-[-200px] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[140px] -translate-y-1/2 animate-aurora" />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-12">
          <span className="inline-flex items-center gap-3 text-muted/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 justify-center">
            <div className="w-8 h-px bg-line" />{businessCaseData.sectionTag}<div className="w-8 h-px bg-line" />
          </span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] tracking-tight font-tight">
            This isn&apos;t a cost &mdash; <span className="gradient-text-green">it&apos;s a profit lever.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, x: -28, rotateY: 10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} viewport={viewportOnce} transition={{ duration: 0.7, ease: EASE }}
            className="rounded-2xl p-6 md:p-8 bg-surface/50 backdrop-blur-sm border border-line/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center"><TrendingDown size={16} className="text-brand/70" /></div>
              <h3 className="text-ink font-bold text-base tracking-tight">What It Saves You</h3>
            </div>
            <ul className="space-y-3">
              {businessCaseData.saves.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Minus size={12} className="text-line mt-1 flex-shrink-0" />
                  <span className="text-muted text-[13px] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 28, rotateY: -10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} viewport={viewportOnce} transition={{ duration: 0.7, ease: EASE }}
            className="rounded-2xl p-6 md:p-8 bg-brand/[0.06] border border-brand/15">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand/12 flex items-center justify-center"><TrendingUp size={16} className="text-brand" /></div>
              <h3 className="text-ink font-bold text-base tracking-tight">What It Helps You Earn</h3>
            </div>
            <ul className="space-y-3">
              {businessCaseData.earns.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={12} className="text-brand/70 mt-1 flex-shrink-0" />
                  <span className="text-muted text-[13px] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          className="mt-4 p-5 rounded-xl bg-brand/[0.07] border border-brand/15 text-center">
          <p className="text-brand text-[13px] md:text-sm font-semibold tracking-tight">{businessCaseData.callout}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default BusinessCase;
