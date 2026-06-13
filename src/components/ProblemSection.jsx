import React from 'react';
import { problemData } from '../data/mockData';
import { motion } from 'framer-motion';
import { FolderOpen, MessageCircle, RefreshCw, TrendingDown, ArrowDownRight, Sparkles } from 'lucide-react';
import { blurRise, clipReveal, container, viewportOnce, EASE } from '../lib/motion';

const iconMap = { FolderOpen, MessageCircle, RefreshCw, TrendingDown };

const ProblemSection = () => {
  return (
    <section className="bg-panel py-24 md:py-32 relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full bg-accent/15 blur-[150px] animate-aurora pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        {/* ───────────── THE REALITY ───────────── */}
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.08)} className="max-w-4xl">
          <motion.span variants={blurRise} className="inline-flex items-center gap-3 text-accent-2 text-xs font-bold uppercase tracking-[0.28em] mb-6">
            <span className="w-10 h-px bg-accent-2/40" />The Reality
          </motion.span>

          <motion.h2 variants={blurRise}
            className="font-tight font-extrabold text-ink text-[2.6rem] md:text-[4rem] leading-[1.02] tracking-[-0.02em] mb-6">
            You&apos;re spending more time on admin <span className="text-muted/40">than behind the lens.</span>
          </motion.h2>

          <motion.p variants={blurRise} className="text-muted text-lg md:text-xl leading-relaxed max-w-2xl font-medium">
            20–40 events a year means <span className="text-ink font-semibold">hundreds of hours</span> burned on media management — time that has a real, untracked cost.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.08)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-14">
          {problemData.painPoints.map((point, i) => {
            const Icon = iconMap[point.icon];
            return (
              <motion.div key={i} variants={blurRise} whileHover={{ y: -5 }}
                className="rounded-2xl p-6 group bg-surface/50 backdrop-blur-sm border border-line/20 hover:border-accent/40 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={18} className="text-accent-2" />
                </div>
                <p className="text-muted text-[13.5px] leading-relaxed font-medium">{point.title}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* connector */}
        <motion.div initial={{ opacity: 0, scaleY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }} viewport={viewportOnce}
          transition={{ duration: 0.5 }} className="flex flex-col items-center my-14 origin-top">
          <span className="w-px h-12 bg-gradient-to-b from-line to-brand/50" />
          <span className="w-9 h-9 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center -mt-1">
            <ArrowDownRight size={15} className="text-brand" />
          </span>
        </motion.div>

        {/* ───────────── THE OPPORTUNITY ───────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal}
          className="relative rounded-[2rem] overflow-hidden"
        >
          {/* dramatic brand panel */}
          <div className="relative bg-gradient-to-br from-brand to-brand-2 p-8 md:p-14">
            {/* texture glows */}
            <div className="absolute top-[-80px] right-[-40px] w-[320px] h-[320px] rounded-full bg-white/10 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-40px] w-[300px] h-[300px] rounded-full bg-black/10 blur-[90px] pointer-events-none" />

            <span className="inline-flex items-center gap-2 text-on-brand/80 text-xs font-bold uppercase tracking-[0.28em] mb-7">
              <Sparkles size={13} />The Opportunity
            </span>

            <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-14 items-center relative z-10">
              {/* the big number */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                className="text-center md:text-left md:border-r md:border-on-brand/20 md:pr-14"
              >
                <div className="font-tight font-extrabold text-on-brand text-[3.4rem] md:text-[5rem] leading-none tracking-tight">
                  ₹3–5L
                </div>
                <p className="text-on-brand/70 text-sm font-semibold mt-2 uppercase tracking-wide">spent on photography</p>
              </motion.div>

              <div>
                <h3 className="font-tight font-bold text-on-brand text-[1.7rem] md:text-[2.5rem] leading-[1.08] mb-4 tracking-tight">
                  They&apos;d gladly pay more for the right experience.
                </h3>
                <p className="text-on-brand/80 text-base md:text-lg leading-relaxed mb-6 max-w-xl">
                  Photographers who deliver an end-to-end digital experience command premium pricing. The only question:
                </p>
                <p className="text-on-brand font-semibold text-base md:text-lg leading-snug border-l-2 border-on-brand/40 pl-5">
                  Can you currently offer — and charge for — a premium delivery experience?
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
