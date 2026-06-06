import React from 'react';
import { businessCaseData } from '../data/mockData';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Check, Minus } from 'lucide-react';

const BusinessCase = () => {
  return (
    <section className="bg-[#F3F7EF] py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-1/2 right-[-200px] w-[500px] h-[500px] bg-[#F4D0D8]/10 rounded-full blur-[140px] -translate-y-1/2" />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-flex items-center gap-3 text-[#68798B]/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 justify-center">
            <div className="w-8 h-px bg-[#D1D7C9]" />{businessCaseData.sectionTag}<div className="w-8 h-px bg-[#D1D7C9]" />
          </span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] tracking-tight">
            This isn&apos;t a cost &mdash; <span className="gradient-text-green">it&apos;s a profit lever.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 md:p-8 bg-white/50 backdrop-blur-sm border border-[#D1D7C9]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F3F7EF] flex items-center justify-center"><TrendingDown size={16} className="text-[#294D32]/60" /></div>
              <h3 className="text-[#000000] font-bold text-base tracking-tight">What It Saves You</h3>
            </div>
            <ul className="space-y-3">
              {businessCaseData.saves.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Minus size={12} className="text-[#D1D7C9] mt-1 flex-shrink-0" />
                  <span className="text-[#68798B] text-[13px] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 md:p-8 bg-[#294D32]/[0.03] border border-[#294D32]/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#294D32]/8 flex items-center justify-center"><TrendingUp size={16} className="text-[#294D32]/80" /></div>
              <h3 className="text-[#000000] font-bold text-base tracking-tight">What It Helps You Earn</h3>
            </div>
            <ul className="space-y-3">
              {businessCaseData.earns.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={12} className="text-[#294D32]/60 mt-1 flex-shrink-0" />
                  <span className="text-[#68798B] text-[13px] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-4 p-5 rounded-xl bg-[#294D32]/[0.04] border border-[#294D32]/8 text-center">
          <p className="text-[#294D32]/70 text-[13px] md:text-sm font-semibold tracking-tight">{businessCaseData.callout}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default BusinessCase;
