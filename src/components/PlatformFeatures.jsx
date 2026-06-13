import React, { useState } from 'react';
import { platformFeaturesData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import BrowserFrame from './BrowserFrame';
import { slideLeft, slideRight, viewportOnce } from '../lib/motion';

const URLS = ['studio.moments.live', 'studio.moments.live/uploads', 'studio.moments.live/storage', 'studio.moments.live/team', 'studio.moments.live/activity'];

const PlatformFeatures = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="features" className="bg-panel py-20 md:py-28 relative overflow-hidden">
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
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={slideLeft} className="lg:w-[300px] flex-shrink-0">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {platformFeaturesData.features.map((f, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActive(i)}
                  whileHover={{ x: active === i ? 0 : 4 }}
                  className={`text-left px-4 py-4 rounded-xl transition-all duration-300 flex-shrink-0 lg:flex-shrink w-[200px] lg:w-auto border ${
                    active === i
                      ? 'bg-surface/70 backdrop-blur-sm border-line/40 shadow-sm'
                      : 'border-transparent hover:bg-surface/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${active === i ? 'bg-brand' : 'bg-line'}`} />
                    <h4 className={`text-sm font-bold transition-colors duration-300 ${active === i ? 'text-ink' : 'text-muted/60'}`}>{f.title}</h4>
                  </div>
                  <p className={`text-xs leading-relaxed pl-4 transition-colors duration-300 ${active === i ? 'text-muted' : 'text-muted/40'}`}>{f.description}</p>
                </motion.button>
              ))}
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
                  src={platformFeaturesData.features[active].image}
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
