import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import CursorGlow from '../components/CursorGlow';
import LandingHero from '../components/LandingHero';
import ProblemSection from '../components/ProblemSection';
import MomentsStudio from '../components/MomentsStudio';
import BusinessCase from '../components/BusinessCase';
import B2BTestimonials from '../components/B2BTestimonials';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

const B2BLanding = () => {
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-canvas relative">
      <CursorGlow />
      <Navbar />
      <LandingHero />
      <ProblemSection />
      <MomentsStudio />
      <BusinessCase />
      <B2BTestimonials />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default B2BLanding;
