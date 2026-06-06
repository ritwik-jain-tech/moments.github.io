import React from 'react';
import { howItWorksData } from '../data/mockData';
import { motion } from 'framer-motion';
import { Plus, Upload, QrCode, Sparkles, Heart } from 'lucide-react';

const iconMap = { Plus, Upload, QrCode, Sparkles, Heart };

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-[#FFF5E9] py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="text-[#294D32] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">How It Works</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] tracking-tight">
            Set up once. Run it like a pro.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {howItWorksData.steps.map((step, i) => {
            const Icon = iconMap[step.icon];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-5 text-center group bg-white/50 backdrop-blur-sm border border-[#D1D7C9]/20 hover:border-[#294D32]/15 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7EF] flex items-center justify-center group-hover:bg-[#294D32]/10 transition-colors">
                    <Icon size={18} className="text-[#294D32]/50 group-hover:text-[#294D32] transition-colors" />
                  </div>
                  <span className="text-[#D1D7C9] font-bold text-2xl select-none">{step.number}</span>
                </div>
                <h4 className="text-[#000000] font-bold text-[13px] mb-1.5 tracking-tight">{step.title}</h4>
                <p className="text-[#68798B] text-[11px] leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
