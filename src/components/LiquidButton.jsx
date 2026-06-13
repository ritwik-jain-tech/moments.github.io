import React from 'react';
import { motion } from 'framer-motion';

/**
 * Liquid-glass button with a cursor-tracking sheen.
 * variant: 'primary' (filled brand) | 'glass' (liquid glass) | 'ghost' (outline)
 * as: 'button' | 'a'
 */
export const setSheen = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

const VARIANTS = {
  primary: 'bg-brand text-on-brand shadow-lg shadow-brand/25 hover:shadow-brand/35',
  glass: 'liquid-glass text-ink hover:text-ink',
  ghost: 'border border-line text-muted hover:text-ink hover:border-brand/40 bg-surface/20 backdrop-blur-sm',
};

const LiquidButton = ({
  as = 'button',
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const Comp = as === 'a' ? motion.a : motion.button;
  return (
    <Comp
      onMouseMove={setSheen}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`liquid-btn inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export default LiquidButton;
