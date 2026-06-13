import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import CursorGlow from '../components/CursorGlow';
import LandingHero from '../components/LandingHero';
import ProblemSection from '../components/ProblemSection';
import DualValueSection from '../components/DualValueSection';
import PlatformFeatures from '../components/PlatformFeatures';
import BusinessCase from '../components/BusinessCase';
import B2BTestimonials from '../components/B2BTestimonials';
import B2BPricing from '../components/B2BPricing';
import WhyNowAndCTA from '../components/WhyNowAndCTA';
import Footer from '../components/Footer';

const B2BLanding = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-canvas relative">
      <CursorGlow />
      <Navbar />
      <LandingHero />
      <ProblemSection />
      <DualValueSection />
      <PlatformFeatures />
      <BusinessCase />
      <B2BTestimonials />
      <B2BPricing />
      <WhyNowAndCTA />
      <Footer />
    </div>
  );
};

export default B2BLanding;
