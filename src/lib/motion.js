// Shared Framer Motion presets — a distinct entrance per section
// so the page never repeats the same reveal twice in a row.

const EASE = [0.22, 1, 0.36, 1]; // premium ease-out-quint

export const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Rise (Problem section). Transform+opacity only so it always ends visible.
export const blurRise = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
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

// Unmask reveal (section headers). Transform+opacity only — clipPath could
// leave the element clipped (invisible) if the reveal didn't complete.
export const clipReveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Tilt + rise (Business case cards)
export const tiltRise = {
  hidden: { opacity: 0, y: 40, rotateX: 12 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: EASE } },
};

// Zoom (Testimonials). Transform+opacity only so it always ends visible.
export const zoomBlur = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

// Staggered container helpers
export const container = (stagger = 0.08, delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const viewportOnce = { once: true, amount: 0.25 };

export { EASE };
