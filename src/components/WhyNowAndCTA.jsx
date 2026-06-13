import React from 'react';
import { whyNowData, ctaData, STUDIO_SIGNUP } from '../data/mockData';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Cpu, Users, MessageCircle } from 'lucide-react';
import { popIn, clipReveal, container, viewportOnce } from '../lib/motion';
import LiquidButton from './LiquidButton';
import { setSheen } from './LiquidButton';

const whyNowIcons = [Clock, Cpu, Users];

const WhyNowAndCTA = () => {
  return (
    <>
      <section className="bg-canvas pt-12 md:pt-16 pb-20 md:pb-28 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-12">
            <span className="text-muted/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Why Now</span>
            <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] tracking-tight font-tight">
              The photographers who move first <span className="text-muted/40">will own the market.</span>
            </h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.08)}
            className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {whyNowData.reasons.map((reason, i) => {
              const Icon = whyNowIcons[i];
              return (
                <motion.div key={i} variants={popIn} whileHover={{ y: -5 }} onMouseMove={setSheen}
                  className="liquid-card relative overflow-hidden rounded-2xl p-6 bg-surface/50 backdrop-blur-sm border border-line/20 hover:border-brand/20 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center mb-4">
                    <Icon size={16} className="text-brand/60" />
                  </div>
                  <h4 className="text-ink font-bold text-[13px] mb-2 leading-snug tracking-tight">{reason.title}</h4>
                  <p className="text-muted text-[12px] leading-relaxed font-medium">{reason.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-canvas via-panel to-canvas">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-aurora absolute top-1/2 left-1/4 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-brand/15 blur-[130px]" />
          <div className="animate-aurora absolute top-1/3 right-1/4 w-[34vw] h-[34vw] max-w-[440px] max-h-[440px] rounded-full bg-accent/25 blur-[120px]" style={{ animationDelay: '-9s' }} />
        </div>
        <div className="max-w-3xl mx-auto px-5 md:px-10 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal}>
            <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] mb-5 tracking-tight font-tight">
              Start your free trial. <span className="gradient-text-green">Try it on your next event.</span>
            </h2>
            <p className="text-muted text-base leading-relaxed mb-10 max-w-xl mx-auto">{ctaData.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <LiquidButton as="a" href={STUDIO_SIGNUP} variant="primary" className="px-7 py-3.5 text-sm">
                {ctaData.primaryCTA}<ArrowRight size={14} />
              </LiquidButton>
              <LiquidButton as="a" href={ctaData.contactLink} target="_blank" rel="noopener noreferrer" variant="ghost" className="px-7 py-3.5 text-sm font-semibold">
                <MessageCircle size={14} />Let&apos;s Talk
              </LiquidButton>
            </div>
            <p className="mt-6 text-muted/40 text-[11px] font-medium tracking-wide">No credit card required &middot; Full platform access &middot; Cancel anytime</p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default WhyNowAndCTA;
