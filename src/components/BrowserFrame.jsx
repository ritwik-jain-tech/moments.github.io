import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Lock } from 'lucide-react';

/**
 * BrowserFrame — a clean desktop browser-window chrome (window dots + URL bar)
 * wrapping a landscape product screenshot. The screenshot is shown at its
 * natural aspect ratio so it always reads as a desktop view and never crops.
 *
 * Theme-aware: pass `srcLight` to show a light-mode capture in light theme.
 *
 * Props:
 *  - src        screenshot URL (dark / default)
 *  - srcLight   optional light-mode screenshot URL
 *  - fallback   shown if the resolved image fails to load
 *  - url        address shown in the browser bar (default 'studio.moments.live')
 *  - float      gentle floating animation (default false)
 *  - className  extra classes on the outer wrapper
 *  (height / scroll accepted for back-compat, no longer used)
 */
const BrowserFrame = ({ src, srcLight, fallback, url = 'studio.moments.live', float = false, className = '', alt = 'Moments Studio product' }) => {
  const { theme } = useTheme();
  const resolved = theme === 'light' && srcLight ? srcLight : src;
  const onErr = (e) => {
    if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
  };

  return (
    <div className={`${float ? 'animate-float-slow' : ''} ${className}`}>
      <div className="relative rounded-[0.9rem] md:rounded-[1.2rem] bg-[#0c120e] shadow-[0_40px_90px_rgb(var(--shadow-rgb)/calc(var(--shadow-strength)+0.08)),0_12px_34px_rgb(var(--shadow-rgb)/var(--shadow-strength))] ring-1 ring-white/5 overflow-hidden">
        {/* Browser toolbar */}
        <div className="flex items-center gap-3 px-3 md:px-4 h-7 md:h-9 bg-[#0c120e] border-b border-white/[0.06]">
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#28c840]/70" />
          </span>
          <span className="mx-auto flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-white/[0.06] text-white/40 text-[9px] md:text-[11px] font-medium max-w-[70%] truncate">
            <Lock size={9} className="opacity-50 flex-shrink-0" />
            <span className="truncate">{url}</span>
          </span>
        </div>

        {/* Screen — full screenshot at natural aspect ratio */}
        <div className="relative overflow-hidden bg-canvas">
          <img src={resolved} alt={alt} loading="lazy" onError={onErr} className="w-full h-auto block" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
        </div>
      </div>
    </div>
  );
};

export default BrowserFrame;
