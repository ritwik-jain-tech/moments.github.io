import React from 'react';
import { pricingData } from '../data/mockData';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const PricingCard = ({ plan, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    whileHover={{ y: -6 }}
    className={`relative rounded-2xl p-6 md:p-7 flex flex-col border transition-all duration-300 ${
      plan.popular
        ? 'border-[#294D32]/20 bg-[#294D32]/[0.03] shadow-md shadow-[#294D32]/5'
        : 'border-[#D1D7C9]/20 bg-white/50 backdrop-blur-sm'
    }`}
  >
    {plan.popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-[#294D32] text-white text-[9px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
          <Sparkles size={9} />Most Popular
        </span>
      </div>
    )}
    <div className="mb-4">
      <h4 className="text-[#000000] font-bold text-sm tracking-tight">{plan.name}</h4>
      <p className="text-[#68798B]/40 text-[11px] font-medium">{plan.subtitle}</p>
    </div>
    <div className="mb-6">
      <span className="text-[#000000] font-bold text-3xl md:text-4xl tracking-tight">₹{plan.price}</span>
      <span className="text-[#68798B]/40 text-xs font-medium">{plan.period}</span>
    </div>
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className={`w-full py-3 rounded-full text-[13px] font-bold transition-colors mb-6 ${
        plan.popular
          ? 'bg-[#294D32] text-white hover:bg-[#1e3a25] shadow-sm'
          : 'border border-[#D1D7C9] text-[#68798B] hover:border-[#294D32]/30 hover:text-[#000]'
      }`}>
      Start Free Trial
    </motion.button>
    <ul className="space-y-2.5 flex-1">
      {plan.features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Check size={12} className="text-[#294D32]/50 mt-0.5 flex-shrink-0" />
          <span className="text-[#68798B] text-[12px] font-medium">{f}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const B2BPricing = () => {
  return (
    <section id="pricing" className="bg-[#F3F7EF] py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-[#294D32] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Pricing</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] mb-3 tracking-tight">
            Plans that pay for themselves.
          </h2>
          <p className="text-[#68798B] text-sm max-w-md mx-auto">Pay for storage and capabilities, not per event. Unlimited events on every tier.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pricingData.plans.map((plan, i) => (<PricingCard key={plan.name} plan={plan} index={i} />))}
        </div>
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-6 p-5 rounded-xl bg-white/40 border border-[#D1D7C9]/15 text-center">
          <p className="text-[#68798B] text-[12px] font-medium">Free trial includes all features. No credit card required.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default B2BPricing;
