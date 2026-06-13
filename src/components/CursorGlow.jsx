import React, { useEffect, useRef } from 'react';

/**
 * Gooey liquid cursor — a chain of blobs that lag behind the pointer at
 * staggered rates and merge through an SVG goo filter, so the cursor leaves a
 * stretchy, liquid-metal trail. Desktop only; disabled for reduced-motion.
 */
const DOTS = 6;

const CursorGlow = () => {
  const dotRefs = useRef([]);
  const target = useRef({ x: -300, y: -300 });
  const points = useRef(Array.from({ length: DOTS }, () => ({ x: -300, y: -300 })));
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('pointermove', onMove, { passive: true });

    const tick = () => {
      for (let i = 0; i < DOTS; i++) {
        const p = points.current[i];
        const lead = i === 0 ? target.current : points.current[i - 1];
        const ease = 0.32 - i * 0.035; // each blob lags a bit more → liquid stretch
        p.x += (lead.x - p.x) * ease;
        p.y += (lead.y - p.y) * ease;
        const el = dotRefs.current[i];
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id="cursor-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2] hidden md:block opacity-70 dark:opacity-90"
        style={{ filter: 'url(#cursor-goo)', mixBlendMode: 'plus-lighter' }}
      >
        {Array.from({ length: DOTS }).map((_, i) => (
          <span
            key={i}
            ref={(el) => (dotRefs.current[i] = el)}
            className="absolute top-0 left-0 rounded-full will-change-transform"
            style={{
              width: `${46 - i * 5}px`,
              height: `${46 - i * 5}px`,
              background: 'rgb(var(--glow) / 0.45)',
            }}
          />
        ))}
      </div>
    </>
  );
};

export default CursorGlow;
