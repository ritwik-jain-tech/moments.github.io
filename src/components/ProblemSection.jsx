import React from 'react';
import { problemData } from '../data/mockData';
import { motion } from 'framer-motion';
import { FolderOpen, MessageCircle, RefreshCw, TrendingDown } from 'lucide-react';

const iconMap = { FolderOpen, MessageCircle, RefreshCw, TrendingDown };

const ProblemSection = () => {
  return (
    <section className="bg-[#F3F7EF] py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-3 text-[#68798B]/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-5">
            <div className="w-8 h-px bg-[#D1D7C9]" />The Reality
          </span>
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
          className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] mb-4 max-w-3xl tracking-tight">
          You&apos;re spending more time on admin than behind the lens.
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="text-[#68798B] text-base mb-12 max-w-xl">
          20–40 events a year means hundreds of hours burned on media management.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {problemData.painPoints.map((point, i) => {
            const Icon = iconMap[point.icon];
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ y: -2 }}
                className="rounded-xl p-5 flex items-start gap-3 group bg-white/50 backdrop-blur-sm border border-[#D1D7C9]/15 hover:border-[#F4D0D8]/30 transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#F4D0D8]/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#AC5BC0]/50" />
                </div>
                <p className="text-[#68798B] text-[13px] leading-relaxed font-medium">{point.title}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-16 p-7 md:p-10 rounded-2xl border border-[#294D32]/8 bg-white/40 relative overflow-hidden">
          <span className="inline-flex items-center gap-3 text-[#294D32]/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
            <div className="w-8 h-px bg-[#294D32]/15" />The Opportunity
          </span>
          <h3 className="text-[1.5rem] md:text-[2rem] font-bold text-[#000000] leading-[1.1] mb-4 max-w-2xl tracking-tight">
            Couples spend ₹3–5L on photography. They&apos;d pay more for the right experience.
          </h3>
          <p className="text-[#68798B] text-sm leading-relaxed mb-5 max-w-xl">
            Photographers who deliver an end-to-end digital experience command premium pricing.
          </p>
          <div className="border-l-2 border-[#294D32]/15 pl-5">
            <p className="text-[#294D32]/60 text-[13px] italic font-medium">
              The question is whether you can currently offer — and charge for — a premium delivery experience.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
