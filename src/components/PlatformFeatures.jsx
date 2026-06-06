import React, { useState } from 'react';
import { platformFeaturesData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';

const PlatformFeatures = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-[#F3F7EF] py-20 md:py-28 relative overflow-hidden">
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#D1D7C9]/20 rounded-full blur-[150px]" />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
          <span className="inline-flex items-center gap-3 text-[#68798B]/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
            <div className="w-8 h-px bg-[#D1D7C9]" />{platformFeaturesData.sectionTag}
          </span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] mb-3 max-w-3xl tracking-tight">
            {platformFeaturesData.headline}
          </h2>
          <p className="text-[#294D32] text-sm md:text-base font-semibold">{platformFeaturesData.tagline}</p>
        </motion.div>

        <div className="mt-12 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[300px] flex-shrink-0">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {platformFeaturesData.features.map((f, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActive(i)}
                  whileHover={{ x: active === i ? 0 : 4 }}
                  className={`text-left px-4 py-4 rounded-xl transition-all duration-300 flex-shrink-0 lg:flex-shrink w-[200px] lg:w-auto border ${
                    active === i
                      ? 'bg-white/70 backdrop-blur-sm border-[#D1D7C9]/40 shadow-sm'
                      : 'border-transparent hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${active === i ? 'bg-[#294D32]' : 'bg-[#D1D7C9]'}`} />
                    <h4 className={`text-sm font-bold transition-colors duration-300 ${active === i ? 'text-[#000000]' : 'text-[#68798B]/50'}`}>{f.title}</h4>
                  </div>
                  <p className={`text-xs leading-relaxed pl-4 transition-colors duration-300 ${active === i ? 'text-[#68798B]' : 'text-[#68798B]/30'}`}>{f.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-[#294D32]/3 rounded-3xl blur-2xl" />
                <img src={platformFeaturesData.features[active].image} alt={platformFeaturesData.features[active].title} className="dashboard-screenshot w-full relative z-10" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
