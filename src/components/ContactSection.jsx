import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { clipReveal, container, blurRise, viewportOnce, EASE } from '../lib/motion';
import LiquidButton from './LiquidButton';
import { LEADS_ENDPOINT } from '../config/leads';

// Max 5 questions — 3 required, 2 optional.
const FIELDS = [
  { name: 'name', label: 'Your name', placeholder: 'e.g. Ritwik Jain', required: true },
  { name: 'contact', label: 'Contact (phone or email)', placeholder: 'WhatsApp number or email', required: true },
  { name: 'link', label: 'Website / Instagram', placeholder: '@yourstudio or yoursite.com', required: true },
  { name: 'studio', label: 'Studio / brand name', placeholder: 'Optional', required: false },
  { name: 'message', label: 'What are you looking for?', placeholder: 'Optional — tell us about your events', required: false, textarea: true },
];

const ContactSection = () => {
  const [values, setValues] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error

  const update = (name, v) => setValues((s) => ({ ...s, [name]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    const payload = {
      ...values,
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
        console.info('[free-trial lead]', payload, '(set LEADS_ENDPOINT to capture to a sheet)');
      }
      setStatus('done');
    } catch (err) {
      console.error('Lead submit failed:', err);
      setStatus('error');
    }
  };

  const inputCls =
    'w-full rounded-xl bg-surface/60 border border-line/40 px-4 py-3 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20 transition-all';

  return (
    <section id="free-trial" className="bg-canvas py-20 md:py-28 relative overflow-hidden scroll-mt-24">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-aurora absolute top-1/4 left-1/5 w-[34vw] h-[34vw] max-w-[440px] max-h-[440px] rounded-full bg-brand/15 blur-[130px]" />
        <div className="animate-aurora absolute bottom-0 right-1/5 w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-accent/20 blur-[120px]" style={{ animationDelay: '-9s' }} />
      </div>

      <div className="max-w-[640px] mx-auto px-5 md:px-10 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-9">
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Free Trial</span>
          <h2 className="text-[2rem] md:text-[2.8rem] font-bold text-ink leading-[1.1] tracking-tight font-tight mb-3">
            Try Moments on your <span className="gradient-text-green">next event.</span>
          </h2>
          <p className="text-muted text-base max-w-md mx-auto">
            Tell us a little about your studio and we&apos;ll set you up — no credit card, no commitment.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal}
          className="liquid-glass rounded-[1.8rem] p-6 md:p-9"
        >
          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }} className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center mx-auto mb-5">
                  <Check size={30} className="text-brand" />
                </div>
                <h3 className="font-tight font-bold text-ink text-2xl mb-2">We&apos;ll reach out to you soon!</h3>
                <p className="text-muted text-sm">Thanks — we&apos;ve got your details and will be in touch shortly.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
                variants={container(0.06)} className="space-y-4">
                {FIELDS.map((f) => (
                  <motion.div key={f.name} variants={blurRise}>
                    <label className="block text-[12px] font-semibold text-muted mb-1.5">
                      {f.label}{f.required && <span className="text-accent-2"> *</span>}
                    </label>
                    {f.textarea ? (
                      <textarea rows={3} className={inputCls} placeholder={f.placeholder} required={f.required}
                        value={values[f.name] || ''} onChange={(e) => update(f.name, e.target.value)} />
                    ) : (
                      <input type="text" className={inputCls} placeholder={f.placeholder} required={f.required}
                        value={values[f.name] || ''} onChange={(e) => update(f.name, e.target.value)} />
                    )}
                  </motion.div>
                ))}

                {status === 'error' && (
                  <p className="text-red-500 text-[13px] font-medium">Something went wrong. Please try again or WhatsApp us.</p>
                )}

                <motion.div variants={blurRise} className="pt-1">
                  <LiquidButton type="submit" variant="primary" disabled={status === 'submitting'}
                    className="w-full py-3.5 text-sm disabled:opacity-60">
                    {status === 'submitting' ? 'Sending…' : <>Request Free Trial <ArrowRight size={14} /></>}
                  </LiquidButton>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
