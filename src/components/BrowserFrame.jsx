import React from 'react';

/**
 * BrowserFrame — a premium macOS-style browser chrome wrapping a product
 * screenshot. When `scroll` is set, the screenshot slowly auto-scrolls inside
 * the viewport (the "moving screen" effect). Fully theme-aware.
 *
 * Props:
 *  - src      screenshot URL
 *  - url      address-bar label (default studio.moments.live)
 *  - height   viewport height in px (default 440)
 *  - scroll   enable auto-scroll animation (default true)
 *  - float    add a gentle floating animation (default false)
 *  - className extra classes on the outer wrapper
 */
const BrowserFrame = ({
  src,
  url = 'studio.moments.live',
  height = 440,
  scroll = true,
  float = false,
  className = '',
  alt = 'Moments Studio product',
}) => {
  return (
    <div className={`${float ? 'animate-float-slow' : ''} ${className}`}>
      <div
        className="rounded-2xl overflow-hidden bg-surface border border-line/60 shadow-[0_30px_80px_rgb(var(--shadow-rgb)/calc(var(--shadow-strength)+0.06)),0_10px_30px_rgb(var(--shadow-rgb)/var(--shadow-strength))]"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 h-10 bg-panel border-b border-line/50">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          <div className="flex-1 flex justify-center px-6">
            <div className="w-full max-w-[280px] h-6 rounded-md bg-surface-2 border border-line/40 flex items-center justify-center gap-1.5">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="text-muted/70">
                <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 1 1 6 0v3Z" fill="currentColor"/>
              </svg>
              <span className="text-muted/70 text-[10px] font-medium tracking-tight">{url}</span>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative overflow-hidden bg-canvas" style={{ height }}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`w-full block ${scroll ? 'animate-screen' : ''}`}
            style={{ '--frame-h': `${height}px` }}
          />
          {/* subtle top/bottom fade for depth */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-canvas/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-canvas/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default BrowserFrame;
