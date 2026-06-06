import React, { useState, useEffect } from 'react';
import { navLinks } from '../data/mockData';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const LOGO_SMALL = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/c8l9vrm3_small%20moments%20logo.png';
const LOGO_FULL = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/i9w6b5xn_Full%20moments%20logo.png';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (link) => {
    setMobileOpen(false);
    if (link.isRoute) {
      navigate(link.href);
    } else {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector(link.href);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        const el = document.querySelector(link.href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white/80 backdrop-blur-2xl border-b border-[#D1D7C9]/30 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <img src={LOGO_SMALL} alt="Moments" className="w-7 h-7 object-contain" />
          <img src={LOGO_FULL} alt="Moments" className="h-5 object-contain hidden sm:block" />
        </button>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link)}
              className="text-[#68798B] hover:text-[#000000] text-[13px] font-semibold transition-colors duration-300 tracking-wide"
            >
              {link.label}
            </button>
          ))}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleNavClick({ href: '#pricing' })}
            className="bg-[#294D32] text-white px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-[#1e3a25] transition-colors duration-300 flex items-center gap-2 shadow-md shadow-[#294D32]/15"
          >
            Start Free Trial
            <ArrowRight size={13} />
          </motion.button>
        </div>

        <button className="lg:hidden text-[#294D32]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#D1D7C9]/20 overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-3">
              {navLinks.map((link) => (
                <button key={link.label} onClick={() => handleNavClick(link)} className="text-[#68798B] hover:text-[#000000] text-sm font-semibold py-2.5 text-left transition-colors">
                  {link.label}
                </button>
              ))}
              <button onClick={() => handleNavClick({ href: '#pricing' })} className="bg-[#294D32] text-white px-5 py-3 rounded-full text-sm font-bold w-full mt-2">
                Start Free Trial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
