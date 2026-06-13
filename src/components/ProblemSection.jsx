import React from 'react';
import { problemData } from '../data/mockData';
import { motion } from 'framer-motion';
import { FolderOpen, MessageCircle, RefreshCw, TrendingDown } from 'lucide-react';
import { blurRise, container, viewportOnce } from '../lib/motion';

const iconMap = { FolderOpen, MessageCircle, RefreshCw, TrendingDown };

const ProblemSection = () => {
  return (
    <section className="bg-panel py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.06)}>
          <motion.span variants={blurRise} className="inline-flex items-center gap-3 text-muted/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-5">
            <div className="w-8 h-px bg-line" />The Reality
          </motion.span>

          <motion.h2 variants={blurRise}
            className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] mb-4 max-w-3xl tracking-tight font-tight">
            You&apos;re spending more time on admin than behind the lens.
          </motion.h2>

          <motion.p variants={blurRise} className="text-muted text-base mb-12 max-w-xl">
            20–40 events a year means hundreds of hours burned on media management.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.07)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {problemData.painPoints.map((point, i) => {
            const Icon = iconMap[point.icon];
            return (
              <motion.div key={i} variants={blurRise} whileHover={{ y: -3 }}
                className="rounded-xl p-5 flex items-start gap-3 group bg-surface/50 backdrop-blur-sm border border-line/20 hover:border-accent/40 transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-accent-2/70" />
                </div>
                <p className="text-muted text-[13px] leading-relaxed font-medium">{point.title}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={blurRise}
          className="mt-16 p-7 md:p-10 rounded-2xl border border-brand/10 bg-surface/40 backdrop-blur-sm relative overflow-hidden">
          <span className="inline-flex items-center gap-3 text-brand/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
            <div className="w-8 h-px bg-brand/20" />The Opportunity
          </span>
          <h3 className="text-[1.5rem] md:text-[2rem] font-bold text-ink leading-[1.1] mb-4 max-w-2xl tracking-tight font-tight">
            Couples spend ₹3–5L on photography. They&apos;d pay more for the right experience.
          </h3>
          <p className="text-muted text-sm leading-relaxed mb-5 max-w-xl">
            Photographers who deliver an end-to-end digital experience command premium pricing.
          </p>
          <div className="border-l-2 border-brand/20 pl-5">
            <p className="text-brand/80 text-[13px] italic font-medium">
              The question is whether you can currently offer — and charge for — a premium delivery experience.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
