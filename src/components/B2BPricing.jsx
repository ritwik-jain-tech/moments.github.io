import React from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle } from 'lucide-react';
import { clipReveal, container, blurRise, viewportOnce } from '../lib/motion';
import LiquidButton, { setSheen } from './LiquidButton';

const WHATSAPP = 'https://wa.me/918962364626?text=Hi%20Moments%2C%20I%27d%20like%20pricing%20details%20for%20my%20studio.';

const includes = [
  'Unlimited events on every plan',
  'Pay for storage & capability — never per event',
  'Fast client review & delivery built in',
  'Guest experience app as a premium add-on',
  'Onboarding help to launch on your next shoot',
];

const B2BPricing = () => {
  return (
    <section id="pricing" className="bg-gradient-to-b from-canvas via-panel to-canvas py-14 md:py-20 relative overflow-hidden scroll-mt-28 md:scroll-mt-32">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-aurora absolute top-1/3 left-1/4 w-[36vw] h-[36vw] max-w-[460px] max-h-[460px] rounded-full bg-brand/15 blur-[130px]" />
        <div className="animate-aurora absolute bottom-0 right-1/4 w-[32vw] h-[32vw] max-w-[420px] max-h-[420px] rounded-full bg-accent/20 blur-[120px]" style={{ animationDelay: '-9s' }} />
      </div>

      <div className="max-w-[960px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal}
          onMouseMove={setSheen}
          className="liquid-card liquid-glass relative overflow-hidden rounded-[2.2rem] p-8 md:p-14 text-center"
        >
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Pricing</span>
          <h2 className="text-[2rem] md:text-[3rem] font-bold text-ink leading-[1.08] mb-4 tracking-tight font-tight">
            Pricing built around <span className="gradient-text-green">your studio.</span>
          </h2>
          <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-9">
            Every studio runs differently. Tell us your volume and storage needs, and we&apos;ll tailor a plan that pays for itself — usually in a single event.
          </p>

          <motion.ul
            initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.07)}
            className="grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-xl mx-auto mb-10 text-left"
          >
            {includes.map((item) => (
              <motion.li key={item} variants={blurRise} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={11} className="text-brand" />
                </span>
                <span className="text-muted text-[13.5px] font-medium">{item}</span>
              </motion.li>
            ))}
          </motion.ul>

          <div className="flex flex-col items-center gap-3">
            <LiquidButton as="a" href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              variant="primary" className="px-8 py-4 text-sm">
              <MessageCircle size={16} /> Chat on WhatsApp for Pricing
            </LiquidButton>
            <p className="text-muted/50 text-[11px] font-medium tracking-wide">Quick reply · No obligation · Custom quote for your studio</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default B2BPricing;
