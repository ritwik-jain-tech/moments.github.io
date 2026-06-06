import React, { useState } from 'react';
import { dualValueData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DualValueSection = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  const navigate = useNavigate();

  return (
    <section id="platform" className="bg-[#FFF5E9] py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="text-[#294D32] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">One Platform. Two Ways to Win.</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-[#000000] leading-[1.1] tracking-tight">
            Manage more. Charge more. <span className="gradient-text-green">Deliver better.</span>
          </h2>
        </motion.div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white/60 backdrop-blur-sm rounded-full p-1 border border-[#D1D7C9]/25">
            {dualValueData.layers.map((layer, i) => (
              <button key={i} onClick={() => setActiveLayer(i)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                  activeLayer === i ? 'bg-[#294D32] text-white shadow-sm' : 'text-[#68798B] hover:text-[#000]'
                }`}>{layer.tag}</button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeLayer}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 max-w-md">
              <div className="inline-flex items-center gap-2 bg-[#F3F7EF] border border-[#D1D7C9] rounded-full px-3 py-1 mb-4">
                <span className="text-[#294D32] text-[11px] font-semibold">{dualValueData.layers[activeLayer].subtitle}</span>
              </div>
              <h3 className="text-[1.8rem] md:text-[2.3rem] font-bold text-[#000000] leading-[1.1] mb-4 tracking-tight">{dualValueData.layers[activeLayer].title}</h3>
              <p className="text-[#68798B] text-sm leading-relaxed mb-6">{dualValueData.layers[activeLayer].description}</p>
              <ul className="space-y-2.5 mb-6">
                {dualValueData.layers[activeLayer].features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#294D32]/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Check size={10} className="text-[#294D32]" /></div>
                    <span className="text-[#68798B] text-[13px] font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              {activeLayer === 1 && (
                <motion.button whileHover={{ x: 4 }} onClick={() => navigate('/guestApp')} className="text-[#294D32] text-[13px] font-bold flex items-center gap-2">
                  Explore the Guest App <ArrowRight size={13} />
                </motion.button>
              )}
            </div>
            <div className="flex-1 w-full max-w-lg">
              {dualValueData.layers[activeLayer].isPhone ? (
                <div className="flex justify-center">
                  <motion.div whileHover={{ y: -6 }} className="w-48 md:w-56">
                    <div className="bg-[#1a1a1a] rounded-[2.5rem] p-2 shadow-2xl"><img src={dualValueData.layers[activeLayer].image} alt="" className="w-full rounded-[2rem]" /></div>
                  </motion.div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#AC5BC0]/4 rounded-2xl blur-xl" />
                  <img src={dualValueData.layers[activeLayer].image} alt="" className="dashboard-screenshot w-full relative z-10" />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DualValueSection;
