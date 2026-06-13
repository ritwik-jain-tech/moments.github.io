import React, { useState, useEffect } from 'react';
import { platformFeaturesData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import BrowserFrame from './BrowserFrame';
import { slideLeft, slideRight, viewportOnce } from '../lib/motion';

const URLS = ['studio.moments.live/review', 'studio.moments.live/uploads', 'studio.moments.live/storage', 'studio.moments.live/team', 'studio.moments.live/activity'];
const CYCLE_MS = 4000;

const PlatformFeatures = () => {
  const features = platformFeaturesData.features;
  const [active, setActive] = useState(0);

  // Auto-advance; re-armed whenever `active` changes (so a manual click resets it).
  useEffect(() => {
    const id = setTimeout(() => setActive((p) => (p + 1) % features.length), CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, features.length]);

  return (
    <section id="features" className="bg-panel py-20 md:py-28 relative overflow-hidden scroll-mt-28 md:scroll-mt-32">
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-brand/10 rounded-full blur-[150px] animate-aurora" />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={slideLeft} className="mb-8">
          <span className="inline-flex items-center gap-3 text-muted/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
            <div className="w-8 h-px bg-line" />{platformFeaturesData.sectionTag}
          </span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] mb-3 max-w-3xl tracking-tight font-tight">
            {platformFeaturesData.headline}
          </h2>
          <p className="text-brand text-sm md:text-base font-semibold">{platformFeaturesData.tagline}</p>
        </motion.div>

        <div className="mt-12 flex flex-col lg:flex-row gap-6">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={slideLeft} className="lg:w-[320px] flex-shrink-0">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {features.map((f, i) => {
                const isActive = active === i;
                return (
                  <motion.button
                    key={i}
                    onClick={() => setActive(i)}
                    whileHover={{ x: isActive ? 0 : 4 }}
                    className={`relative text-left px-4 py-4 rounded-xl transition-all duration-300 flex-shrink-0 lg:flex-shrink w-[220px] lg:w-auto border overflow-hidden ${
                      isActive
                        ? 'bg-surface/70 backdrop-blur-sm border-line/40 shadow-sm'
                        : 'border-transparent hover:bg-surface/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-brand' : 'bg-line'}`} />
                      <h4 className={`text-sm font-bold transition-colors duration-300 ${isActive ? 'text-ink' : 'text-muted/60'}`}>{f.title}</h4>
                    </div>
                    <p className={`text-xs leading-relaxed pl-4 transition-colors duration-300 ${isActive ? 'text-muted' : 'text-muted/40'}`}>{f.description}</p>
                    {/* auto-advance progress bar */}
                    {isActive && (
                      <motion.span key={active} className="absolute left-0 bottom-0 h-[2px] bg-brand"
                        initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: CYCLE_MS / 1000, ease: 'linear' }} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={slideRight} className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.01, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <BrowserFrame
                  src={features[active].image}
                  url={URLS[active] || 'studio.moments.live'}
                  height={420}
                  scroll
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
