import React, { useState } from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "Do guests need to download an app?",
      a: "No. Moments App Clips and Instant Apps let guests join your wedding gallery instantly—no app download required.",
    },
    {
      q: "How quickly do photos appear in the gallery?",
      a: "Instantly! As soon as guests or photographers upload, photos appear in your live feed.",
    },
    {
      q: "Is it private? Who can see the photos?",
      a: "Your gallery is private and only accessible to people with your event link or QR code. You control who can view and upload.",
    },
    {
      q: "What happens after 3 years?",
      a: "We notify you before the period ends. You can download all photos or extend storage—we’ll help you keep your memories safe.",
    },
    {
      q: "Can our photographer upload directly?",
      a: "Yes. Photographers can upload directly to your event. You get professional and candid photos in one place.",
    },
  ];

  const testimonials = [
    {
      quote:
        "We thought we'd only have our photographer's shots, but Moments gave us hundreds of candid pictures from our friends and family. It felt like reliving the wedding through everyone's eyes.",
      names: "Rhea & Arjun",
      location: "Udaipur",
    },
    {
      quote:
        "Normally, we chase relatives for months for photos. This time, by the next morning, we had everything beautifully organized. It was the easiest part of the whole wedding!",
      names: "Ananya (Bride's Sister)",
      location: "Mumbai",
    },
    {
      quote:
        "At such a big wedding, so many small moments get lost. With Moments, nothing slipped away, every smile, every dance step, every hug was waiting for us in one place.",
      names: "Siddharth & Meera",
      location: "Delhi",
    },
    {
      quote:
        "What I loved most was the personalization. The gallery felt like it was made just for us, elegant, intimate, and unforgettable. It's the modern wedding album.",
      names: "Kabir and Gautami",
      location: "Bangalore",
    },
  ];

  const painPoints = [
    "Endless WhatsApp forwards",
    "Chasing guests for photos",
    'Guests asking "Where are my photos?"',
    "Memories scattered across 10 apps",
    "Candid moments getting lost forever",
  ];

  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#1a1a1a] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f3efe6]/95 backdrop-blur-sm border-b border-[#e5e0d8]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-script text-2xl md:text-3xl text-[#2a4d32]">
            Moments
          </span>
          <a
            href="https://moments.live"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#2a4d32] hover:underline"
          >
            Contact Us
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 text-center">
        <h1 className="font-script text-5xl md:text-7xl text-[#2a4d32] mb-6">
          Moments
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#4a4a4a] leading-relaxed">
          Find photos of you, your guests and the ones clicked by your
          photographer, all in one place
        </p>
      </section>

      {/* Designed For Your Day */}
      <section className="py-12 md:py-20 px-6">
        <h2 className="font-script text-3xl md:text-5xl text-center text-[#2a4d32] mb-4">
          Designed For Your Day
        </h2>
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] max-w-3xl mx-auto mb-16">
          Your Personal Wedding Pinterest Starts Here
        </h3>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-white/60 rounded-2xl p-8 shadow-sm border border-[#e5e0d8]">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#2a4d32] mb-2">
              Personalized Onboarding
            </h4>
            <p className="text-[#4a4a4a]">
              Your names and custom illustration welcome every guest, it's
              unmistakably YOUR celebration
            </p>
          </div>
          <div className="bg-white/60 rounded-2xl p-8 shadow-sm border border-[#e5e0d8]">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#2a4d32] mb-2">
              Your Very Own Personalized Feed
            </h4>
            <p className="text-[#4a4a4a]">
              Your own Pinterest style wedding photo feed
            </p>
          </div>
          <div className="bg-white/60 rounded-2xl p-8 shadow-sm border border-[#e5e0d8]">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#2a4d32] mb-2">
              Personalised QRs and Link
            </h4>
            <p className="text-[#4a4a4a]">
              100s of candid photographers capturing every moment
            </p>
          </div>
          <div className="bg-white/60 rounded-2xl p-8 shadow-sm border border-[#e5e0d8]">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#2a4d32] mb-2">
              No App Download Required
            </h4>
            <p className="text-[#4a4a4a]">
              Moments App Clips and Instant Apps let others join your wedding
              gallery instantly
            </p>
          </div>
        </div>
      </section>

      {/* AI-Powered Photo Finder */}
      <section className="py-16 md:py-24 px-6 bg-white/40">
        <h2 className="font-script text-3xl md:text-5xl text-center text-[#2a4d32] mb-4">
          Feature That Works Like Magic
        </h2>
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] max-w-3xl mx-auto mb-6">
          AI-Powered Photo Finder
        </h3>
        <p className="max-w-2xl mx-auto text-center text-[#4a4a4a] text-lg">
          The #1 post-wedding headache — solved. Guests find their own photos
          instantly. You enjoy being newlyweds.
        </p>
      </section>

      {/* Moments Bot */}
      <section className="py-16 md:py-24 px-6">
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] max-w-3xl mx-auto mb-6">
          The Gentle Photo Collector
        </h3>
        <p className="max-w-2xl mx-auto text-center text-[#4a4a4a] text-lg">
          Our WhatsApp bot gently nudges guests to share their photos — so you
          don't have to chase anyone for months
        </p>
      </section>

      {/* Wave goodbye to */}
      <section className="py-16 md:py-24 px-6 bg-white/40">
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] mb-12">
          Wave goodbye to
        </h3>
        <ul className="max-w-2xl mx-auto space-y-4">
          {painPoints.map((point, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-[#4a4a4a] text-lg"
            >
              <span className="text-[#2a4d32] text-xl">×</span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-6">
        <h2 className="font-script text-3xl md:text-5xl text-center text-[#2a4d32] mb-4">
          Love Letters from Our Couples
        </h2>
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] max-w-3xl mx-auto mb-16">
          The choice of couples who believe every moment matters.
        </h3>
        <div className="max-w-4xl mx-auto space-y-10">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="bg-white/60 rounded-2xl p-8 shadow-sm border border-[#e5e0d8]"
            >
              <p className="text-[#1a1a1a] text-lg italic mb-4">"{t.quote}"</p>
              <footer className="text-[#2a4d32] font-semibold">
                {t.names}
              </footer>
              <p className="text-[#6a6a6a] text-sm">{t.location}</p>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 px-6 bg-white/40">
        <h2 className="font-script text-3xl md:text-5xl text-center text-[#2a4d32] mb-4">
          Investment in Forever
        </h2>
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] max-w-3xl mx-auto mb-16">
          Every Celebration Deserves Its Perfect Plan
        </h3>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-md border-2 border-[#e5e0d8]">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#2a4d32] mb-1">
              Single Day Event
            </h4>
            <p className="text-[#6a6a6a] text-sm mb-6">
              Perfect for Engagement or Reception
            </p>
            <p className="text-4xl font-bold text-[#1a1a1a] mb-1">
              ₹11,000 <span className="text-lg font-normal text-[#6a6a6a]">/-</span>
            </p>
            <a
              href="https://moments.live"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-6 py-3 bg-[#2a4d32] text-white rounded-full font-medium hover:bg-[#234128] transition-colors"
            >
              Reserve Your Date
            </a>
            <ul className="mt-6 space-y-2 text-[#4a4a4a] text-sm">
              <li>Single event</li>
              <li>3 years of storage</li>
              <li>Upto 5,000 photos</li>
              <li>Priority event support</li>
              <li>Unlimited guest access</li>
              <li>AI photo finder for everyone</li>
            </ul>
            <p className="mt-4 text-xs font-semibold text-[#2a4d32]">
              Most chosen by couples
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md border-2 border-[#2a4d32] relative">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#2a4d32] mb-1">
              Multiple Days
            </h4>
            <p className="text-[#6a6a6a] text-sm mb-6">
              Perfect for Multi-Day Weddings
            </p>
            <p className="text-4xl font-bold text-[#1a1a1a] mb-1">
              ₹21,000 <span className="text-lg font-normal text-[#6a6a6a]">/-</span>
            </p>
            <a
              href="https://moments.live"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-6 py-3 bg-[#2a4d32] text-white rounded-full font-medium hover:bg-[#234128] transition-colors"
            >
              Reserve Your Date
            </a>
            <ul className="mt-6 space-y-2 text-[#4a4a4a] text-sm">
              <li>Multiple events</li>
              <li>3 years storage</li>
              <li>25,000 photos capacity</li>
              <li>Extended support period</li>
              <li>Unlimited guest access</li>
              <li>AI photo finder for everyone</li>
            </ul>
            <p className="mt-4 text-xs text-[#6a6a6a]">
              We accept only few weddings per day to ensure every couple gets
              the perfect experience.
            </p>
          </div>
        </div>
        <p className="text-center mt-10 text-[#4a4a4a]">
          <a
            href="https://moments.live"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2a4d32] font-semibold hover:underline"
          >
            Get Your Spot Now!
          </a>
          {" · "}
          <a
            href="https://moments.live"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2a4d32] font-semibold hover:underline"
          >
            Know More
          </a>
        </p>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24 px-6">
        <h2 className="font-script text-3xl md:text-5xl text-center text-[#2a4d32] mb-4">
          FAQs
        </h2>
        <h3 className="text-2xl md:text-4xl font-semibold text-center text-[#1a1a1a] max-w-3xl mx-auto mb-16">
          Frequently Asked Questions
        </h3>
        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white/60 rounded-xl border border-[#e5e0d8] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-4 text-left font-medium text-[#1a1a1a] flex justify-between items-center"
              >
                {faq.q}
                <span className="text-[#2a4d32] text-xl">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-[#4a4a4a]">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA + Admin link */}
      <section className="py-16 md:py-24 px-6 bg-white/40 text-center">
        <h3 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a] mb-4">
          Have Questions? We're Here to Help!
        </h3>
        <p className="text-[#4a4a4a] mb-8 max-w-lg mx-auto">
          Reach out to our support team for any queries or assistance.
        </p>
        <a
          href="https://moments.live"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-4 bg-[#2a4d32] text-white rounded-full font-medium hover:bg-[#234128] transition-colors"
        >
          Contact Us
        </a>
        <div className="mt-12 pt-8 border-t border-[#e5e0d8]">
          <Link
            to="/admin"
            className="text-[#2a4d32] font-medium hover:underline text-sm"
          >
            Admin login →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[#e5e0d8] text-center text-[#6a6a6a] text-sm">
        <span className="font-script text-[#2a4d32] text-lg">
          Moments
        </span>
        <p className="mt-2">© Moments. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
