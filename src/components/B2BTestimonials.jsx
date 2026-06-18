import React, { useState, useCallback, useEffect } from 'react';
import { testimonialsData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Instagram } from 'lucide-react';
import { zoomBlur, popIn, container, viewportOnce } from '../lib/motion';

const B2BTestimonials = () => {
  const [current, setCurrent] = useState(0);
  const t = testimonialsData.testimonials;
  const next = useCallback(() => setCurrent((p) => (p + 1) % t.length), [t.length]);
  const prev = () => setCurrent((p) => (p - 1 + t.length) % t.length);

  const single = t.length <= 1;

  useEffect(() => {
    if (single) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, single]);

  return (
    <section className="bg-canvas py-14 md:py-20 relative overflow-hidden">
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/15 rounded-full blur-[120px] animate-aurora" />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={zoomBlur} className="text-center mb-8">
          <span className="text-muted/50 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">{testimonialsData.sectionTag}</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] mb-3 tracking-tight font-tight">
            Already tested. <span className="text-muted/40">Already loved.</span>
          </h2>
          <p className="text-muted text-sm font-medium">{testimonialsData.subtitle}</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={container(0.08)}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 max-w-3xl mx-auto">
          {testimonialsData.stats.map((s) => (
            <motion.div key={s.label} variants={popIn} className="rounded-2xl p-4 text-center bg-surface/50 backdrop-blur-sm border border-line/20">
              <div className={`font-bold text-ink mb-1 tracking-tight font-tight whitespace-nowrap ${s.value.includes('→') ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>{s.value}</div>
              <div className="text-muted text-[10px] font-semibold uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-5 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-surface/50 backdrop-blur-sm border border-line/20">
              <div className={`w-full md:w-48 h-44 md:h-56 flex-shrink-0 rounded-xl overflow-hidden ${t[current].logo ? 'bg-white flex items-center justify-center p-8' : ''}`}>
                <img src={t[current].image} alt={t[current].names} className={`w-full h-full ${t[current].logo ? 'object-contain' : 'object-cover'}`} />
              </div>
              <div className="flex-1">
                <Quote size={18} className="text-brand/20 mb-3" />
                <p className="text-muted text-sm md:text-base leading-relaxed mb-5 font-light italic">&ldquo;{t[current].quote}&rdquo;</p>
                {t[current].instagram ? (
                  <a href={t[current].instagram} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-ink font-bold text-[13px] tracking-tight hover:text-brand transition-colors">
                    {t[current].names}
                    <Instagram size={13} className="opacity-60" />
                  </a>
                ) : (
                  <p className="text-ink font-bold text-[13px] tracking-tight">{t[current].names}</p>
                )}
                <p className="text-muted/50 text-[11px] font-medium">{t[current].location}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {!single && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <motion.button whileHover={{ scale: 1.1 }} onClick={prev} className="w-10 h-10 rounded-full border border-line/30 bg-surface/50 flex items-center justify-center hover:border-brand/30 transition-colors">
                <ChevronLeft size={15} className="text-muted" />
              </motion.button>
              <div className="flex gap-2">
                {t.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-brand w-8' : 'bg-line w-1.5 hover:bg-muted/40'}`} />
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.1 }} onClick={next} className="w-10 h-10 rounded-full border border-line/30 bg-surface/50 flex items-center justify-center hover:border-brand/30 transition-colors">
                <ChevronRight size={15} className="text-muted" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default B2BTestimonials;
