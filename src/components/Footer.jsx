import React from 'react';
import { footerData } from '../data/mockData';
import { Mail, ArrowUpRight, Instagram, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LOGO_FULL_WHITE = 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/i9w6b5xn_Full%20moments%20logo.png';

const Footer = () => {
  const navigate = useNavigate();
  const iconMap = { Instagram, WhatsApp: MessageCircle };

  return (
    <footer className="bg-[#294D32] text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="md:col-span-1">
            <img src={LOGO_FULL_WHITE} alt="Moments" className="h-6 mb-4 brightness-0 invert" />
            <p className="text-white/40 text-xs leading-relaxed mb-4 font-medium">{footerData.tagline}</p>
            <a href={`mailto:${footerData.email}`} className="inline-flex items-center gap-2 text-white/35 hover:text-white text-xs transition-colors font-medium">
              <Mail size={12} />{footerData.email}
            </a>
          </div>

          <div>
            <h4 className="font-bold text-white/60 text-[10px] mb-5 uppercase tracking-[0.2em]">Platform</h4>
            <ul className="space-y-3">
              {footerData.platformLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => link.href.startsWith('/') ? navigate(link.href) : document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-white/30 hover:text-white text-xs transition-colors font-medium"
                  >{link.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white/60 text-[10px] mb-5 uppercase tracking-[0.2em]">Company</h4>
            <ul className="space-y-3">
              {footerData.companyLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => link.href.startsWith('/') ? navigate(link.href) : undefined}
                    className="text-white/30 hover:text-white text-xs transition-colors font-medium"
                  >{link.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white/60 text-[10px] mb-5 uppercase tracking-[0.2em]">Connect</h4>
            <div className="flex flex-col gap-3">
              {footerData.social.map((item) => {
                const Icon = iconMap[item.label] || MessageCircle;
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/30 hover:text-white text-xs transition-colors font-medium">
                    <Icon size={12} />{item.label}<ArrowUpRight size={10} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/10 my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs font-medium">&copy; 2025 Moments.Live. All rights reserved.</p>
          <p className="text-white/25 text-[10px] font-semibold tracking-[0.1em] uppercase">Manage More. Charge More. Deliver Better.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
