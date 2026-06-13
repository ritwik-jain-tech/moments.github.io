import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * A soft, brand-tinted liquid blob that trails the cursor with spring physics —
 * gives the page a sense of "liquid flow" as the pointer moves. Desktop only,
 * pointer-events-none, and disabled under prefers-reduced-motion.
 */
const CursorGlow = () => {
  const mx = useMotionValue(-500);
  const my = useMotionValue(-500);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.7 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.7 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e) => { mx.set(e.clientX - 260); my.set(e.clientY - 260); };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [mx, my]);

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed top-0 left-0 z-[2] hidden md:block w-[520px] h-[520px] rounded-full will-change-transform"
    >
      <div
        className="w-full h-full rounded-full opacity-70 dark:opacity-90"
        style={{
          background: 'radial-gradient(circle, rgb(var(--glow) / 0.16), rgb(var(--accent-2) / 0.06) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </motion.div>
  );
};

export default CursorGlow;
