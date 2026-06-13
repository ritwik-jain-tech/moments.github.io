import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * BrowserFrame — a sleek, bezel-less device frame (MacBook/iPhone-style notch
 * instead of a full title bar) wrapping a product screenshot. When `scroll` is
 * set the screenshot slowly auto-scrolls inside the viewport (the "moving
 * screen" effect).
 *
 * Theme-aware: pass `srcLight` to show a light-mode capture in light theme.
 * Falls back to `src` when no light capture is available.
 *
 * Props:
 *  - src        screenshot URL (dark / default)
 *  - srcLight   optional light-mode screenshot URL
 *  - height     viewport height in px (default 440)
 *  - scroll     enable auto-scroll animation (default true)
 *  - float      gentle floating animation (default false)
 *  - className  extra classes on the outer wrapper
 */
const BrowserFrame = ({
  src,
  srcLight,
  height = 440,
  scroll = true,
  float = false,
  className = '',
  alt = 'Moments Studio product',
  url, // accepted for back-compat, unused
}) => {
  const { theme } = useTheme();
  const resolved = theme === 'light' && srcLight ? srcLight : src;

  return (
    <div className={`${float ? 'animate-float-slow' : ''} ${className}`}>
      {/* Dark device bezel — reads as a premium object in both themes */}
      <div className="relative rounded-[1.9rem] bg-[#0c120e] p-2.5 shadow-[0_40px_90px_rgb(var(--shadow-rgb)/calc(var(--shadow-strength)+0.08)),0_12px_34px_rgb(var(--shadow-rgb)/var(--shadow-strength))] ring-1 ring-white/5">
        {/* Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 h-[18px] w-[120px] bg-[#0c120e] rounded-b-[14px] flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
          <span className="w-6 h-1 rounded-full bg-white/10" />
        </div>

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[1.4rem] bg-canvas" style={{ height }}>
          <img
            src={resolved}
            alt={alt}
            loading="lazy"
            className={`w-full block ${scroll ? 'animate-screen' : ''}`}
            style={{ '--frame-h': `${height}px` }}
          />
          {/* subtle screen sheen + depth fades */}
          <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] ring-1 ring-inset ring-white/5" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/15 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/15 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default BrowserFrame;
