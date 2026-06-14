import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, ScanFace, Share2, Users, ArrowRight, Check, Sparkles, Upload, QrCode } from 'lucide-react';
import BrowserFrame from './BrowserFrame';
import { clipReveal, viewportOnce, EASE } from '../lib/motion';

const APP_IMG = 'https://framerusercontent.com/images/puPnByXfJCIwtnXHsryGdtLFkAA.gif';

const PROTO = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/';

// The media journey — one Moments capability mapped to each real-world stage.
const STAGES = [
  {
    icon: Camera,
    tag: 'Collect',
    title: 'From card to cloud — automatically.',
    today: 'Photos crawl from camera → memory card → hard disk → your PC. Hours of copying before the real work even begins.',
    moments: 'Camera-to-cloud SFTP auto-upload. Every frame lands in the cloud as you shoot — synced chronologically into smart buckets and auto-sorted by event and the people in them with AI tagging.',
    image: `${PROTO}wp4omh8t_studio.moments.live%20Prototype-2.png`,
  },
  {
    icon: ScanFace,
    tag: 'Select',
    title: 'Find the keepers in minutes, not weeks.',
    today: 'Culling thousands of frames is a solo grind that stretches across weeks — one person, one event, endless takes.',
    moments: 'AI face tagging and event tagging — haldi, dance, candid, emotion, traditional — surface the right shots instantly. Selection finally feels light.',
    image: `${PROTO}p2naxnxo_studio.moments.live%20Prototype-1.png`,
  },
  {
    icon: Share2,
    tag: 'Deliver',
    title: 'A review your clients actually enjoy.',
    today: 'Feedback loops stall. Couples take forever to choose album shots — and still expect the rate they booked.',
    moments: 'Share a link, let clients shortlist and react, and turn it into a branded digital album that lives forever. With AI face recognition in the Moments app, every guest finds their photos — and adds their own POV to the story.',
    image: `${PROTO}yu40wpzb_studio.moments.live%20Prototype-3.png`,
  },
  {
    icon: Users,
    tag: 'Manage',
    title: 'Your whole studio, in one place.',
    today: 'Freelancers, editors, and media scattered across drives, WhatsApp threads, and someone’s desktop.',
    moments: 'Team management built for agencies — bring in editors and second shooters, assign access, and keep every event’s media in one organised home.',
    image: `${PROTO}2bjonplv_studio.moments.live%20Prototype-4.png`,
  },
];

const StageRow = ({ stage, index }) => {
  const Icon = stage.icon;
  const even = index % 2 === 0; // even → text left / screenshot right
  const num = String(index + 1).padStart(2, '0');

  const text = (
    <motion.div
      initial={{ opacity: 0, x: even ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.7, ease: EASE }}
      className={`${even ? 'lg:order-1' : 'lg:order-3'}`}
    >
      {/* pointer header — aligned toward the centre line */}
      <div className={`flex items-center gap-3 mb-4 ${even ? 'lg:flex-row-reverse lg:text-right' : 'lg:flex-row'}`}>
        <span className="text-brand text-xs font-bold uppercase tracking-[0.22em]">{num} · {stage.tag}</span>
      </div>
      <h3 className={`font-tight font-bold text-ink text-[1.6rem] md:text-[2.1rem] leading-[1.12] tracking-tight mb-5 ${even ? 'lg:text-right' : 'lg:text-left'}`}>
        {stage.title}
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-surface/30 border border-line/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted/50 mt-0.5 flex-shrink-0 w-10">Today</span>
          <p className="text-muted text-[13px] leading-relaxed line-through decoration-muted/25 text-left">{stage.today}</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-brand/[0.06] border border-brand/15">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand mt-0.5 flex-shrink-0 w-10">
            <Check size={11} /> Us
          </span>
          <p className="text-ink/80 text-[13px] leading-relaxed font-medium text-left">{stage.moments}</p>
        </div>
      </div>
    </motion.div>
  );

  // Desktop node — centre column
  const node = (
    <div className="hidden lg:flex lg:order-2 justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        className="relative w-14 h-14 rounded-full bg-brand text-on-brand flex items-center justify-center shadow-lg shadow-brand/30 ring-4 ring-canvas z-10"
      >
        <Icon size={22} />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-canvas border border-line text-ink text-[9px] font-bold flex items-center justify-center">{num}</span>
      </motion.div>
    </div>
  );

  // Mobile node — sits on the left rail
  const mobileNode = (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ type: 'spring', stiffness: 240, damping: 16 }}
      className="lg:hidden absolute left-4 -translate-x-1/2 top-0 z-10 w-9 h-9 rounded-full bg-brand text-on-brand flex items-center justify-center shadow-lg shadow-brand/30 ring-4 ring-canvas"
    >
      <Icon size={16} />
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-canvas border border-line text-ink text-[8px] font-bold flex items-center justify-center">{num}</span>
    </motion.div>
  );

  const visual = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.8, ease: EASE }}
      className={`${even ? 'lg:order-3' : 'lg:order-1'}`}
    >
      <BrowserFrame src={stage.image} float />
    </motion.div>
  );

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_56px_1fr] gap-6 lg:gap-10 items-center pl-12 lg:pl-0">
      {mobileNode}
      {text}
      {node}
      {visual}
    </div>
  );
};

const MomentsStudio = () => {
  const stagesRef = useRef(null);
  const [trackH, setTrackH] = useState(0);

  useEffect(() => {
    const el = stagesRef.current;
    if (!el) return;
    const update = () => setTrackH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: stagesRef,
    offset: ['start 0.6', 'end 0.85'],
  });
  const fillHeight = useTransform(scrollYProgress, [0, 1], [0, trackH]);

  return (
    <section id="features" className="bg-gradient-to-b from-canvas via-panel to-canvas relative overflow-hidden py-14 md:py-20 scroll-mt-28 md:scroll-mt-32">
      <div className="absolute top-1/4 right-[-160px] w-[460px] h-[460px] rounded-full bg-accent/15 blur-[150px] animate-aurora pointer-events-none" />
      <div className="absolute bottom-1/4 left-[-160px] w-[420px] h-[420px] rounded-full bg-brand/10 blur-[150px] animate-aurora pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        {/* header */}
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Moments Studio · Main Offering</span>
          <h2 className="text-[2rem] md:text-[3rem] font-bold text-ink leading-[1.08] tracking-tight font-tight mb-4">
            Your media journey, <span className="gradient-text-green">made effortless.</span>
          </h2>
          <p className="text-muted text-base md:text-lg">
            Our core platform — from capture to delivery — with the Moments guest app built right in. Every step maps to how you actually work, quietly removing the friction.
          </p>
        </motion.div>

        {/* timeline */}
        <div ref={stagesRef} className="relative">
          {/* timeline track — left rail on mobile, centre on desktop */}
          <div className="absolute top-0 bottom-0 w-[2px] bg-line/40 rounded-full left-4 -translate-x-1/2 lg:left-1/2" />
          {/* progress fill — reveals a shifting shade top-down as you scroll */}
          <motion.div
            style={{ height: fillHeight }}
            className="absolute top-0 w-[2px] rounded-full overflow-hidden left-4 -translate-x-1/2 lg:left-1/2"
          >
            <div style={{ height: trackH }} className="w-full progress-fill rounded-full" />
          </motion.div>

          <div className="space-y-14 md:space-y-20">
            {STAGES.map((stage, i) => (
              <StageRow key={stage.tag} stage={stage} index={i} />
            ))}
          </div>
        </div>

        {/* integrated add-on — Moments App */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-16 md:mt-24 relative overflow-hidden rounded-[2rem] liquid-glass p-6 md:p-10 grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-12 items-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/20 blur-[90px] pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-accent-2 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
              <Sparkles size={12} /> Integrated Add-on
            </span>
            <h3 className="font-tight font-bold text-ink text-[1.7rem] md:text-[2.3rem] leading-[1.1] tracking-tight mb-4">
              Moments App — bring your <span className="gradient-text-green">guests into the story.</span>
            </h3>
            <p className="text-muted text-[14px] md:text-[15px] leading-relaxed mb-6 max-w-lg">
              A built-in guest experience that plugs straight into Studio. Guests add their own photos,
              and everyone finds every shot they appear in — instantly, with FaceID.
            </p>

            <ul className="space-y-2.5 mb-7">
              {[
                { icon: Upload, t: 'Guests contribute their own POV — more moments in every album' },
                { icon: ScanFace, t: 'FaceID delivers each guest all their photos automatically' },
                { icon: QrCode, t: 'One scan to join — no app download, fully branded as yours' },
              ].map(({ icon: I, t }) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-brand/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <I size={12} className="text-brand" />
                  </span>
                  <span className="text-ink/80 text-[13.5px] font-medium">{t}</span>
                </li>
              ))}
            </ul>

            <Link to="/guestApp"
              className="liquid-btn inline-flex items-center gap-2 bg-brand text-on-brand px-6 py-3 rounded-full text-sm font-bold shadow-md shadow-brand/20">
              <span className="lb-content">More details <ArrowRight size={14} /></span>
            </Link>
          </div>

          <div className="relative z-10 flex justify-center">
            <div className="w-44 md:w-52 animate-float">
              {/* APP_IMG is already an iPhone mockup — show it directly, no extra bezel */}
              <img src={APP_IMG} alt="Moments App — FaceID photo finder" className="w-full h-auto object-contain drop-shadow-2xl" loading="lazy" />
            </div>
          </div>
        </motion.div>

        {/* closer */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          className="mt-14 md:mt-20 text-center">
          <div className="inline-flex flex-wrap justify-center items-center gap-2.5 liquid-glass rounded-full px-6 py-3">
            <span className="text-ink font-tight font-bold text-sm md:text-base">Storage + Gallery + Editing</span>
            <ArrowRight size={15} className="text-brand" />
            <span className="text-muted text-sm md:text-base">one platform, mapped to your workflow.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MomentsStudio;
