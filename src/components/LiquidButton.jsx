import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Liquid-glass button: cursor-tracking sheen + springy gel press + click ripple.
 * variant: 'primary' (filled brand) | 'glass' (liquid glass) | 'ghost' (outline)
 * as: 'button' | 'a'
 */
export const setSheen = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

const VARIANTS = {
  primary: 'bg-brand text-on-brand shadow-lg shadow-brand/25 hover:shadow-brand/40',
  glass: 'liquid-glass text-ink hover:text-ink',
  ghost: 'border border-line text-muted hover:text-ink hover:border-brand/40 bg-surface/20 backdrop-blur-sm',
};

const LiquidButton = ({ as = 'button', variant = 'primary', className = '', children, onClick, ...rest }) => {
  const [ripples, setRipples] = useState([]);
  const Comp = as === 'a' ? motion.a : motion.button;

  const spawnRipple = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 650);
  };

  return (
    <Comp
      onMouseMove={setSheen}
      onPointerDown={spawnRipple}
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 16 }}
      className={`liquid-btn inline-flex items-center justify-center rounded-full font-bold ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      <span className="lb-content">{children}</span>
      {ripples.map((r) => (
        <span key={r.id} className="liquid-ripple" style={{ left: r.x, top: r.y }} aria-hidden />
      ))}
    </Comp>
  );
};

export default LiquidButton;
