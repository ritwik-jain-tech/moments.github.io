import React from 'react';
import { whyNowData, ctaData, STUDIO_SIGNUP } from '../data/mockData';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Cpu, Users, MessageCircle } from 'lucide-react';

const GRADIENT_BG = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/ts2432xm_Frame%2026085796.png';
const whyNowIcons = [Clock, Cpu, Users];

const WhyNowAndCTA = () => {
  return (
    <>
      <section className="bg-[#FFF5E9] py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[#68798B]/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Why Now</span>
            <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] tracking-tight">
              The photographers who move first <span className="text-[#68798B]/30">will own the market.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {whyNowData.reasons.map((reason, i) => {
              const Icon = whyNowIcons[i];
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }} whileHover={{ y: -4 }}
                  className="rounded-2xl p-6 bg-white/50 backdrop-blur-sm border border-[#D1D7C9]/20 hover:border-[#294D32]/10 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7EF] flex items-center justify-center mb-4">
                    <Icon size={16} className="text-[#68798B]/50" />
                  </div>
                  <h4 className="text-[#000000] font-bold text-[13px] mb-2 leading-snug tracking-tight">{reason.title}</h4>
                  <p className="text-[#68798B] text-[12px] leading-relaxed font-medium">{reason.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src={GRADIENT_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#FFF5E9]/60" />
        </div>
        <div className="max-w-3xl mx-auto px-5 md:px-10 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] mb-5 tracking-tight">
              Start your free trial. <span className="text-[#68798B]/30">Try it on your next event.</span>
            </h2>
            <p className="text-[#68798B] text-base leading-relaxed mb-10 max-w-xl mx-auto">{ctaData.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.a href={STUDIO_SIGNUP} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}
                className="bg-[#294D32] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#1e3a25] transition-colors duration-300 flex items-center justify-center gap-2 btn-shine shadow-lg shadow-[#294D32]/15">
                {ctaData.primaryCTA}<ArrowRight size={14} />
              </motion.a>
              <motion.a whileHover={{ scale: 1.03 }} href={ctaData.contactLink} target="_blank" rel="noopener noreferrer"
                className="border border-[#D1D7C9] text-[#68798B] px-7 py-3.5 rounded-full text-sm font-semibold hover:border-[#294D32]/30 hover:text-[#000000] transition-all duration-300 flex items-center justify-center gap-2">
                <MessageCircle size={14} />Let&apos;s Talk
              </motion.a>
            </div>
            <p className="mt-6 text-[#68798B]/30 text-[11px] font-medium tracking-wide">No credit card required &middot; Full platform access &middot; Cancel anytime</p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default WhyNowAndCTA;
