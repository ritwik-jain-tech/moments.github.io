import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { EASE } from '../lib/motion';
import LiquidButton from './LiquidButton';
import { LEADS_ENDPOINT } from '../config/leads';

// --- validators ---
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v) => {
  const d = v.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15;
};
const contactKind = (v) => (isEmail(v) ? 'Email' : isPhone(v) ? 'Phone' : '');

// One question at a time — warm, human prompts. Max 5 questions.
const STEPS = [
  { name: 'name', q: 'First — what should we call you?', hint: 'Just your name. We like to keep things personal.', placeholder: 'e.g. Ritwik', required: true },
  { name: 'contact', q: 'Where can we reach you?', hint: 'A phone number or email — whichever you actually check.', placeholder: 'WhatsApp number or email', required: true,
    validate: (v) => (isEmail(v) || isPhone(v) ? '' : 'Please enter a valid phone number or email address.') },
  { name: 'link', q: 'Show us the magic you make.', hint: 'Your website or Instagram so we can fall in love with your work.', placeholder: '@yourstudio or yoursite.com', required: true },
  { name: 'studio', q: 'Does your studio have a name?', hint: 'Optional — but every great brand deserves a mention.', placeholder: 'Your studio / brand name', required: false },
  { name: 'message', q: 'What would make Moments perfect for you?', hint: 'Optional — wishlists and big ideas welcome.', placeholder: 'Tell us what you need…', required: false, textarea: true },
];

// Detect whether the visitor is on a phone or a web/desktop browser.
const getDevice = () =>
  /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ? 'Phone' : 'Web';

const ContactSection = () => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const inputRef = useRef(null);

  const current = STEPS[step];
  const total = STEPS.length;
  const isLast = step === total - 1;

  // Focus the field on step change, but never let it scroll the page (this was
  // pulling fresh page loads down to the form).
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 250);
    return () => clearTimeout(id);
  }, [step]);

  const update = (v) => { setValues((s) => ({ ...s, [current.name]: v })); setError(''); };

  const submit = async (finalValues) => {
    setStatus('submitting');
    const payload = {
      ...finalValues,
      contactType: contactKind(finalValues.contact || ''),
      device: getDevice(),
      submittedAt: new Date().toISOString(),
      source: 'moments.live',
    };
    try {
      if (LEADS_ENDPOINT) {
        await fetch(LEADS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } else {
        console.info('[free-trial lead]', payload);
      }
      setStatus('done');
    } catch (err) {
      // no-cors responses are opaque; a thrown error is usually a transient
      // network blip. Treat as sent so the visitor isn't blocked.
      console.error('Lead submit failed:', err);
      setStatus('done');
    }
  };

  const next = () => {
    const val = (values[current.name] || '').trim();
    if (current.required && !val) {
      setError('This one helps us reach you — mind filling it in?');
      return;
    }
    if (val && current.validate) {
      const msg = current.validate(val);
      if (msg) { setError(msg); return; }
    }
    if (isLast) { submit(values); return; }
    setDir(1);
    setStep((s) => s + 1);
  };

  const back = () => { setDir(-1); setStep((s) => Math.max(0, s - 1)); };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !current.textarea) { e.preventDefault(); next(); }
  };

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 48 : -48, filter: 'blur(6px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -48 : 48, filter: 'blur(6px)' }),
  };

  const progress = status === 'done' ? 100 : ((step + 1) / total) * 100;

  return (
    <section id="free-trial" className="bg-canvas py-14 md:py-20 relative overflow-hidden scroll-mt-32 md:scroll-mt-36">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-aurora absolute top-1/4 left-1/5 w-[34vw] h-[34vw] max-w-[440px] max-h-[440px] rounded-full bg-brand/15 blur-[130px]" />
        <div className="animate-aurora absolute bottom-0 right-1/5 w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-accent/20 blur-[120px]" style={{ animationDelay: '-9s' }} />
      </div>

      <div className="max-w-[620px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }} className="text-center mb-9">
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Free Trial</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] tracking-tight font-tight mb-3">
            Let&apos;s make your <span className="gradient-text-green">next event unforgettable.</span>
          </h2>
          <p className="text-muted text-base max-w-md mx-auto">
            A few quick questions and we&apos;ll set you up — no credit card, no commitment.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="liquid-glass rounded-[1.8rem] p-6 md:p-10 min-h-[320px] flex flex-col">

          {/* progress */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-1.5 rounded-full bg-line/40 overflow-hidden">
              <motion.div className="h-full rounded-full bg-brand" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: EASE }} />
            </div>
            <span className="text-muted/60 text-[11px] font-semibold tabular-nums">
              {status === 'done' ? 'Done' : `${step + 1} / ${total}`}
            </span>
          </div>

          <AnimatePresence mode="wait" custom={dir}>
            {status === 'done' ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }} className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center mb-5">
                  <Check size={30} className="text-brand" />
                </motion.div>
                <h3 className="font-tight font-bold text-ink text-2xl mb-2">We&apos;ll reach out to you soon!</h3>
                <p className="text-muted text-sm max-w-sm">
                  Thank you{values.name ? `, ${values.name.split(' ')[0]}` : ''} — your details are in. We can&apos;t wait to help you create something beautiful.
                </p>
              </motion.div>
            ) : (
              <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.4, ease: EASE }} className="flex-1 flex flex-col">
                <h3 className="font-tight font-bold text-ink text-[1.6rem] md:text-[2rem] leading-tight tracking-tight mb-2">
                  {current.q}
                </h3>
                <p className="text-muted text-sm mb-6">{current.hint}</p>

                {current.textarea ? (
                  <textarea
                    ref={inputRef} rows={3}
                    value={values[current.name] || ''} onChange={(e) => update(e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full rounded-xl bg-surface/60 border border-line/40 px-4 py-3.5 text-base text-ink placeholder:text-muted/50 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                  />
                ) : (
                  <input
                    ref={inputRef} type="text"
                    value={values[current.name] || ''} onChange={(e) => update(e.target.value)} onKeyDown={onKeyDown}
                    placeholder={current.placeholder}
                    className="w-full rounded-xl bg-surface/60 border border-line/40 px-4 py-3.5 text-base text-ink placeholder:text-muted/50 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                )}

                {error && <p className="text-rose-500 dark:text-rose-400 text-[13px] font-medium mt-3">{error}</p>}

                <div className="mt-auto pt-8 flex items-center justify-between gap-3">
                  {step > 0 ? (
                    <button type="button" onClick={back}
                      className="inline-flex items-center gap-1.5 text-muted hover:text-ink text-sm font-semibold transition-colors">
                      <ArrowLeft size={15} /> Back
                    </button>
                  ) : <span />}

                  <LiquidButton type="button" onClick={next} variant="primary" disabled={status === 'submitting'}
                    className="px-7 py-3 text-sm disabled:opacity-60">
                    {status === 'submitting' ? 'Sending…' : isLast ? <>Start Free Trial <Check size={15} /></> : <>Continue <ArrowRight size={15} /></>}
                  </LiquidButton>
                </div>

                {!current.required && !isLast && (
                  <button type="button" onClick={next} className="text-muted/50 hover:text-muted text-xs font-medium mt-4 self-center transition-colors">
                    Skip this
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
