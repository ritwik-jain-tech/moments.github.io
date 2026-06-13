import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanFace, Share2, Users, ArrowRight, Check } from 'lucide-react';
import BrowserFrame from './BrowserFrame';
import { clipReveal, viewportOnce, EASE } from '../lib/motion';

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
  const reversed = index % 2 === 1;
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
      {/* copy */}
      <motion.div
        initial={{ opacity: 0, x: reversed ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.7, ease: EASE }}
        className={reversed ? 'lg:order-2' : ''}
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="w-11 h-11 rounded-xl bg-brand/12 flex items-center justify-center">
            <Icon size={20} className="text-brand" />
          </span>
          <span className="text-brand/70 text-xs font-bold uppercase tracking-[0.22em]">
            {String(index + 1).padStart(2, '0')} · {stage.tag}
          </span>
        </div>

        <h3 className="font-tight font-bold text-ink text-[1.7rem] md:text-[2.3rem] leading-[1.1] tracking-tight mb-5">
          {stage.title}
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-surface/30 border border-line/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted/50 mt-0.5 flex-shrink-0 w-12">Today</span>
            <p className="text-muted text-[13.5px] leading-relaxed line-through decoration-muted/25">{stage.today}</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-brand/[0.06] border border-brand/15">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand mt-0.5 flex-shrink-0 w-12">
              <Check size={11} /> Us
            </span>
            <p className="text-ink/80 text-[13.5px] leading-relaxed font-medium">{stage.moments}</p>
          </div>
        </div>
      </motion.div>

      {/* visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.8, ease: EASE }}
        className={reversed ? 'lg:order-1' : ''}
      >
        <BrowserFrame src={stage.image} float />
      </motion.div>
    </div>
  );
};

const MomentsStudio = () => {
  return (
    <section id="features" className="bg-gradient-to-b from-canvas via-panel to-canvas relative overflow-hidden py-20 md:py-28 scroll-mt-28 md:scroll-mt-32">
      <div className="absolute top-1/4 right-[-160px] w-[460px] h-[460px] rounded-full bg-accent/15 blur-[150px] animate-aurora pointer-events-none" />
      <div className="absolute bottom-1/4 left-[-160px] w-[420px] h-[420px] rounded-full bg-brand/10 blur-[150px] animate-aurora pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        {/* header */}
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={clipReveal} className="text-center mb-16 md:mb-24 max-w-2xl mx-auto">
          <span className="text-brand text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 block">Moments Studio</span>
          <h2 className="text-[2rem] md:text-[3rem] font-bold text-ink leading-[1.08] tracking-tight font-tight mb-4">
            Your media journey, <span className="gradient-text-green">made effortless.</span>
          </h2>
          <p className="text-muted text-base md:text-lg">
            From the first frame to the final album, Moments Studio maps to how you actually work — quietly removing the friction at every step.
          </p>
        </motion.div>

        {/* stages */}
        <div className="space-y-20 md:space-y-28">
          {STAGES.map((stage, i) => (
            <StageRow key={stage.tag} stage={stage} index={i} />
          ))}
        </div>

        {/* closer */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          className="mt-20 md:mt-28 text-center">
          <div className="inline-flex items-center gap-2.5 liquid-glass rounded-full px-6 py-3">
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
