// Shared Framer Motion presets — a distinct entrance per section
// so the page never repeats the same reveal twice in a row.

const EASE = [0.22, 1, 0.36, 1]; // premium ease-out-quint

export const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Blur + rise (Problem section)
export const blurRise = {
  hidden: { opacity: 0, y: 28, filter: 'blur(12px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};

// Slide in from left (Platform features heading)
export const slideLeft = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};
export const slideRight = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};

// Scale-pop with spring (How It Works steps)
export const popIn = {
  hidden: { opacity: 0, scale: 0.8, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

// Clip / unmask reveal (Dual value)
export const clipReveal = {
  hidden: { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: 16 },
  visible: { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0, transition: { duration: 0.85, ease: EASE } },
};

// Tilt + rise (Business case cards)
export const tiltRise = {
  hidden: { opacity: 0, y: 40, rotateX: 12 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: EASE } },
};

// Zoom blur (Testimonials)
export const zoomBlur = {
  hidden: { opacity: 0, scale: 0.94, filter: 'blur(8px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};

// Staggered container helpers
export const container = (stagger = 0.08, delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const viewportOnce = { once: true, amount: 0.25 };

export { EASE };
