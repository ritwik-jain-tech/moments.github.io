import React, { useState, useEffect } from 'react';
import { problemData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, MessageCircle, RefreshCw, TrendingDown, Sparkles } from 'lucide-react';
import { blurRise, clipReveal, container, viewportOnce, EASE } from '../lib/motion';

const iconMap = { FolderOpen, MessageCircle, RefreshCw, TrendingDown };

// One sharp consequence per pain point, surfaced in the visual panel.
const consequences = [
  'Hours per event vanish into sorting, renaming, and exporting.',
  'Links expire, clients lose access, and your inbox fills with "can you resend?"',
  'Every follow-up is unpaid time you can never bill back.',
  'No premium tier to sell — so you compete on price, not on experience.',
];

const CYCLE_MS = 2600;

const ProblemSection = () => {
  const points = problemData.painPoints;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % points.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [points.length]);

  const ActiveIcon = iconMap[points[active].icon];

  return (
    <section id="reality" className="bg-panel relative overflow-hidden py-20 md:py-28 scroll-mt-24">
      <div className="absolute top-[-140px] right-[-120px] w-[460px] h-[460px] rounded-full bg-accent/15 blur-[150px] animate-aurora pointer-events-none" />
      <div className="absolute bottom-[-160px] left-[-120px] w-[420px] h-[420px] rounded-full bg-brand/10 blur-[150px] animate-aurora pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        {/* ───────────── THE REALITY ───────────── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* left — copy + auto-highlight list */}
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.08)}>
            <motion.span variants={blurRise} className="inline-flex items-center gap-3 text-accent-2 text-xs font-bold uppercase tracking-[0.28em] mb-6">
              <span className="w-10 h-px bg-accent-2/40" />The Reality
            </motion.span>
            <motion.h2 variants={blurRise}
              className="font-tight font-extrabold text-ink text-[2.4rem] md:text-[3.4rem] leading-[1.04] tracking-[-0.02em] mb-5">
              More time on admin <span className="text-muted/40">than behind the lens.</span>
            </motion.h2>
            <motion.p variants={blurRise} className="text-muted text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              20–40 events a year means <span className="text-ink font-semibold">hundreds of hours</span> lost to media chaos — and slow client delivery that makes you look anything but premium.
            </motion.p>

            <motion.ul variants={container(0.06)} className="space-y-2.5">
              {points.map((point, i) => {
                const Icon = iconMap[point.icon];
                const isActive = i === active;
                return (
                  <motion.li key={i} variants={blurRise}>
                    <button
                      onClick={() => setActive(i)}
                      className={`w-full text-left flex items-center gap-4 rounded-2xl px-4 py-3.5 border transition-all duration-500 ${
                        isActive
                          ? 'bg-surface/70 backdrop-blur-sm border-accent/40 shadow-sm scale-[1.015]'
                          : 'bg-transparent border-transparent hover:bg-surface/30'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${isActive ? 'bg-accent/25' : 'bg-surface/50'}`}>
                        <Icon size={17} className={isActive ? 'text-accent-2' : 'text-muted/60'} />
                      </span>
                      <span className={`text-[13.5px] font-medium transition-colors duration-500 ${isActive ? 'text-ink' : 'text-muted/70'}`}>
                        {point.title}
                      </span>
                      {/* progress bar for the active item */}
                      {isActive && (
                        <span className="ml-auto hidden sm:block w-10 h-1 rounded-full bg-line/60 overflow-hidden flex-shrink-0">
                          <motion.span key={active} className="block h-full bg-accent-2"
                            initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: CYCLE_MS / 1000, ease: 'linear' }} />
                        </span>
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>

          {/* right — synced visual */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative">
            <div className="liquid-glass rounded-[2rem] p-8 md:p-10 min-h-[340px] flex flex-col justify-between overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
              <AnimatePresence mode="wait">
                <motion.div key={active}
                  initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="relative z-10"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/25 flex items-center justify-center mb-6">
                    <ActiveIcon size={28} className="text-accent-2" />
                  </div>
                  <h3 className="font-tight font-bold text-ink text-2xl md:text-3xl leading-tight tracking-tight mb-3">
                    {points[active].title}
                  </h3>
                  <p className="text-muted text-base leading-relaxed max-w-md">{consequences[active]}</p>
                </motion.div>
              </AnimatePresence>

              {/* dots */}
              <div className="relative z-10 flex gap-2 mt-8">
                {points.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'bg-accent-2 w-7' : 'bg-line w-2 hover:bg-muted/40'}`} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ───────────── THE OPPORTUNITY ───────────── */}
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal}
          className="relative rounded-[2rem] overflow-hidden mt-12 md:mt-16">
          <div className="relative bg-gradient-to-br from-brand to-brand-2 p-8 md:p-14">
            <div className="absolute top-[-80px] right-[-40px] w-[320px] h-[320px] rounded-full bg-white/10 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-40px] w-[300px] h-[300px] rounded-full bg-black/10 blur-[90px] pointer-events-none" />

            <span className="inline-flex items-center gap-2 text-on-brand/80 text-xs font-bold uppercase tracking-[0.28em] mb-7">
              <Sparkles size={13} />The Opportunity
            </span>

            <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-14 items-center relative z-10">
              <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                className="text-center md:text-left md:border-r md:border-on-brand/20 md:pr-14">
                <div className="font-tight font-extrabold text-on-brand text-[3.4rem] md:text-[5rem] leading-none tracking-tight">₹3–5L</div>
                <p className="text-on-brand/70 text-sm font-semibold mt-2 uppercase tracking-wide">spent on photography</p>
              </motion.div>
              <div>
                <h3 className="font-tight font-bold text-on-brand text-[1.7rem] md:text-[2.5rem] leading-[1.08] mb-4 tracking-tight">
                  They&apos;d gladly pay more for a faster, premium experience.
                </h3>
                <p className="text-on-brand/80 text-base md:text-lg leading-relaxed mb-6 max-w-xl">
                  Photographers who deliver instant galleries and same-day client review command premium pricing. The only question:
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
