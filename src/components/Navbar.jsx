import React, { useState, useEffect } from 'react';
import { navLinks, STUDIO_URL, STUDIO_LOGIN } from '../data/mockData';
import { Menu, X, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const LOGO_SMALL = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/c8l9vrm3_small%20moments%20logo.png';
const LOGO_FULL = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/i9w6b5xn_Full%20moments%20logo.png';
const WHATSAPP = 'https://wa.me/918962364626';
const STUDIO = STUDIO_URL;

const guestNavLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Photographers', href: STUDIO, isExternal: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isGuestApp = location.pathname === '/guestApp';
  const links = isGuestApp ? guestNavLinks : navLinks;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (link) => {
    setMobileOpen(false);
    if (link.isExternal) {
      window.open(link.href, '_blank', 'noopener noreferrer');
    } else if (link.isRoute) {
      navigate(link.href);
    } else {
      if (location.pathname !== '/' && location.pathname !== '/guestApp') {
        navigate('/');
        setTimeout(() => {
          document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleCTA = () => {
    setMobileOpen(false);
    if (isGuestApp) {
      window.open(WHATSAPP, '_blank', 'noopener noreferrer');
      return;
    }
    // B2B: scroll to the Free Trial form (navigate home first if needed)
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.querySelector('#free-trial')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      document.querySelector('#free-trial')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Branded links: MOMENTS wordmark on line 1, sub-label (studio / app) on
  // line 2 aligned under it. Plain links render uppercase for consistency.
  const LinkInner = ({ link, align = 'start', logoH = 'h-[11px]' }) =>
    link.brand ? (
      <span className="inline-flex flex-col items-start gap-[3px] leading-none">
        <img src={LOGO_FULL} alt="Moments" className={`${logoH} w-auto object-contain dark:brightness-0 dark:invert [image-rendering:auto]`} />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted/70">{link.brand}</span>
      </span>
    ) : (
      <span className="uppercase tracking-[0.14em] inline-flex items-center gap-1">
        {link.label}
        {link.isExternal && <ExternalLink size={10} className="opacity-50" />}
      </span>
    );

  return (
    <div className="fixed top-3 md:top-4 left-0 right-0 z-50 flex justify-center px-3">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full max-w-[1080px] border transition-all duration-500 ${
          mobileOpen ? 'rounded-[1.75rem]' : 'rounded-full'
        } ${
          scrolled || mobileOpen
            ? 'bg-surface/95 backdrop-blur-2xl border-line/60 shadow-[0_14px_44px_rgb(var(--shadow-rgb)/calc(var(--shadow-strength)+0.12))]'
            : 'bg-surface/60 backdrop-blur-xl border-line/35 shadow-[0_8px_28px_rgb(var(--shadow-rgb)/calc(var(--shadow-strength)+0.04))]'
        }`}
      >
        <div className="px-4 md:px-5 py-2.5 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 pl-1 shrink-0">
            <img src={LOGO_SMALL} alt="Moments" className="w-7 h-7 object-contain dark:brightness-0 dark:invert transition-[filter] duration-500" />
            <img src={LOGO_FULL} alt="Moments" className="h-[18px] object-contain dark:brightness-0 dark:invert transition-[filter] duration-500" />
          </button>

          <div className="hidden lg:flex items-center gap-7">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="text-muted hover:text-ink text-[12px] font-semibold transition-colors duration-300 flex items-center"
              >
                <LinkInner link={link} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isGuestApp && (
              <a
                href={STUDIO_LOGIN}
                className="hidden md:inline-flex items-center border border-line text-muted hover:text-ink hover:border-brand/40 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300"
              >
                Login
              </a>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCTA}
              className="liquid-btn hidden sm:flex bg-brand text-on-brand px-4 lg:px-5 py-2 rounded-full text-[13px] font-bold hover:opacity-90 transition-all duration-300 items-center gap-1.5 shadow-md shadow-brand/20"
            >
              {isGuestApp ? 'Contact' : 'Free Trial'}
              <ArrowRight size={13} />
            </motion.button>
            <button className="lg:hidden text-brand ml-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden border-t border-line/30 mx-1"
            >
              <div className="p-5 flex flex-col gap-3">
                {links.map((link) => (
                  <button key={link.label} onClick={() => handleNavClick(link)}
                    className="text-muted hover:text-ink text-sm font-semibold py-2 text-left transition-colors flex items-center">
                    <LinkInner link={link} align="start" logoH="h-3.5" />
                  </button>
                ))}
                {!isGuestApp && (
                  <a href={STUDIO_LOGIN}
                    className="border border-line text-muted hover:text-ink hover:border-brand/40 px-5 py-3 rounded-full text-sm font-semibold w-full text-center transition-all mt-1">
                    Login
                  </a>
                )}
                <button onClick={handleCTA}
                  className="bg-brand text-on-brand px-5 py-3 rounded-full text-sm font-bold w-full">
                  {isGuestApp ? 'Contact Us' : 'Free Trial'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
};

export default Navbar;
