import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * BrowserFrame — a sleek, bezel-less device frame (MacBook/iPhone-style notch)
 * wrapping a product screenshot. The screenshot is shown at its natural aspect
 * ratio so it always reads as a clean desktop view and never crops/breaks
 * across screen sizes.
 *
 * Theme-aware: pass `srcLight` to show a light-mode capture in light theme.
 *
 * Props:
 *  - src        screenshot URL (dark / default)
 *  - srcLight   optional light-mode screenshot URL
 *  - float      gentle floating animation (default false)
 *  - className  extra classes on the outer wrapper
 *  (height / scroll / url accepted for back-compat, no longer used)
 */
const BrowserFrame = ({ src, srcLight, float = false, className = '', alt = 'Moments Studio product' }) => {
  const { theme } = useTheme();
  const resolved = theme === 'light' && srcLight ? srcLight : src;

  return (
    <div className={`${float ? 'animate-float-slow' : ''} ${className}`}>
      <div className="relative rounded-[1.4rem] md:rounded-[1.9rem] bg-[#0c120e] p-2 md:p-2.5 shadow-[0_40px_90px_rgb(var(--shadow-rgb)/calc(var(--shadow-strength)+0.08)),0_12px_34px_rgb(var(--shadow-rgb)/var(--shadow-strength))] ring-1 ring-white/5">
        {/* Notch */}
        <div className="absolute top-2 md:top-2.5 left-1/2 -translate-x-1/2 z-20 h-[14px] md:h-[18px] w-[88px] md:w-[120px] bg-[#0c120e] rounded-b-[12px] md:rounded-b-[14px] flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
          <span className="w-5 md:w-6 h-1 rounded-full bg-white/10" />
        </div>

        {/* Screen — full screenshot at natural aspect ratio */}
        <div className="relative overflow-hidden rounded-[1rem] md:rounded-[1.4rem] bg-canvas">
          <img src={resolved} alt={alt} loading="lazy" className="w-full h-auto block" />
          <div className="pointer-events-none absolute inset-0 rounded-[1rem] md:rounded-[1.4rem] ring-1 ring-inset ring-white/5" />
        </div>
      </div>
    </div>
  );
};

export default BrowserFrame;
