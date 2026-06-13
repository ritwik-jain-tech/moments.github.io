import React, { useEffect, useRef, useState } from 'react';
import { businessCaseData } from '../data/mockData';
import { motion, animate, useInView } from 'framer-motion';
import { TrendingDown, TrendingUp, Check, Minus, ArrowRight } from 'lucide-react';
import { clipReveal, viewportOnce, EASE } from '../lib/motion';
import { setSheen } from './LiquidButton';

const CountUp = ({ to, duration = 1.8 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}</span>;
};

const BusinessCase = () => {
  return (
    <section className="bg-panel py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-1/2 right-[-200px] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[140px] -translate-y-1/2 animate-aurora" />
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-14">
          <span className="inline-flex items-center gap-3 text-muted/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 justify-center">
            <div className="w-8 h-px bg-line" />{businessCaseData.sectionTag}<div className="w-8 h-px bg-line" />
          </span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] tracking-tight font-tight">
            This isn&apos;t a cost &mdash; <span className="gradient-text-green">it&apos;s a profit lever.</span>
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-2 gap-4 lg:gap-6 items-stretch">
          {/* SAVES */}
          <motion.div
            initial={{ opacity: 0, x: -32, rotateY: 10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={viewportOnce} transition={{ duration: 0.7, ease: EASE }}
            onMouseMove={setSheen}
            className="liquid-card relative overflow-hidden rounded-[1.6rem] p-7 md:p-9 bg-surface/50 backdrop-blur-sm border border-line/25"
          >
            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 rounded-xl bg-panel flex items-center justify-center"><TrendingDown size={18} className="text-muted" /></div>
              <div>
                <p className="text-muted/50 text-[10px] font-bold uppercase tracking-[0.18em]">Cut the drag</p>
                <h3 className="text-ink font-bold text-lg tracking-tight">What it saves you</h3>
              </div>
            </div>
            <ul className="space-y-3.5">
              {businessCaseData.saves.map((item, i) => (
                <motion.li key={item} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce}
                  transition={{ delay: 0.1 + i * 0.07 }} className="flex items-center gap-3 group">
                  <span className="w-6 h-6 rounded-lg bg-line/30 flex items-center justify-center flex-shrink-0 group-hover:bg-line/50 transition-colors">
                    <Minus size={12} className="text-muted" />
                  </span>
                  <span className="text-muted text-[13.5px] font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* EARNS — brand gradient, the hero of the section */}
          <motion.div
            initial={{ opacity: 0, x: 32, rotateY: -10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={viewportOnce} transition={{ duration: 0.7, ease: EASE }}
            className="relative overflow-hidden rounded-[1.6rem] p-7 md:p-9 bg-gradient-to-br from-brand to-brand-2 shadow-xl shadow-brand/20"
          >
            <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-xl bg-on-brand/10 flex items-center justify-center"><TrendingUp size={18} className="text-on-brand" /></div>
                <div>
                  <p className="text-on-brand/60 text-[10px] font-bold uppercase tracking-[0.18em]">Add the upside</p>
                  <h3 className="text-on-brand font-bold text-lg tracking-tight">What it helps you earn</h3>
                </div>
              </div>
              <ul className="space-y-3.5 mb-8">
                {businessCaseData.earns.map((item, i) => (
                  <motion.li key={item} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce}
                    transition={{ delay: 0.1 + i * 0.07 }} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-on-brand/15 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-on-brand" />
                    </span>
                    <span className="text-on-brand/90 text-[13.5px] font-medium">{item}</span>
                  </motion.li>
                ))}
              </ul>

              {/* animated revenue stat */}
              <div className="rounded-2xl bg-on-brand/10 border border-on-brand/15 px-5 py-4 flex items-baseline gap-2">
                <span className="font-tight font-extrabold text-on-brand text-[2.4rem] md:text-[3rem] leading-none tracking-tight">
                  +₹<CountUp to={100000} />
                </span>
                <span className="text-on-brand/70 text-sm font-semibold">/ year in new revenue*</span>
              </div>
            </div>
          </motion.div>

          {/* center medallion */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-12 h-12 rounded-full bg-canvas border border-line shadow-lg flex items-center justify-center">
              <ArrowRight size={16} className="text-brand" />
            </div>
          </div>
        </div>

        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          className="text-center text-muted/60 text-xs mt-5 max-w-2xl mx-auto">
          *Based on 20 events/year with a single ₹5,000 guest-experience upsell each. The platform pays for itself many times over.
        </motion.p>
      </div>
    </section>
  );
};

export default BusinessCase;
