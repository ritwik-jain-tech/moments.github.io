import React from 'react';
import { pricingData, STUDIO_SIGNUP } from '../data/mockData';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { popIn, clipReveal, container, viewportOnce } from '../lib/motion';
import LiquidButton, { setSheen } from './LiquidButton';

const PricingCard = ({ plan }) => (
  <motion.div
    variants={popIn}
    whileHover={{ y: -8 }}
    onMouseMove={setSheen}
    className={`liquid-card relative overflow-hidden rounded-2xl p-6 md:p-7 flex flex-col border transition-colors duration-300 ${
      plan.popular
        ? 'border-brand/25 bg-brand/[0.05] shadow-lg shadow-brand/10'
        : 'border-line/20 bg-surface/50 backdrop-blur-sm'
    }`}
  >
    {plan.popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-brand text-on-brand text-[9px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
          <Sparkles size={9} />Most Popular
        </span>
      </div>
    )}
    <div className="mb-4">
      <h4 className="text-ink font-bold text-sm tracking-tight">{plan.name}</h4>
      <p className="text-muted/50 text-[11px] font-medium">{plan.subtitle}</p>
    </div>
    <div className="mb-6">
      <span className="text-ink font-bold text-3xl md:text-4xl tracking-tight font-tight">₹{plan.price}</span>
      <span className="text-muted/50 text-xs font-medium">{plan.period}</span>
    </div>
    <LiquidButton as="a" href={STUDIO_SIGNUP} variant={plan.popular ? 'primary' : 'ghost'}
      className="w-full py-3 text-[13px] mb-6">
      Start Free Trial
    </LiquidButton>
    <ul className="space-y-2.5 flex-1">
      {plan.features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Check size={12} className="text-brand/60 mt-0.5 flex-shrink-0" />
          <span className="text-muted text-[12px] font-medium">{f}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const B2BPricing = () => {
  return (
    <section id="pricing" className="bg-panel py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-12">
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Pricing</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] mb-3 tracking-tight font-tight">
            Plans that pay for themselves.
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">Pay for storage and capabilities, not per event. Unlimited events on every tier.</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.1)}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pricingData.plans.map((plan) => (<PricingCard key={plan.name} plan={plan} />))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          className="mt-6 p-5 rounded-xl bg-surface/40 border border-line/15 text-center">
          <p className="text-muted text-[12px] font-medium">Free trial includes all features. No credit card required.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default B2BPricing;
