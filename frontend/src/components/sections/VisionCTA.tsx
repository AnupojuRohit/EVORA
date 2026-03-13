import React from 'react';
import { PremiumButton } from '../ui/PremiumButton';

export const VisionCTA = () => {
  return (
    <section className="ev-split flex items-center justify-center min-h-[80vh] px-8 py-24 md:py-32 relative z-10 overflow-hidden">
      {/* subtle radial gradient bg */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full max-h-[80vh] bg-[hsl(var(--neon-green))] opacity-[0.03] blur-[150px] pointer-events-none rounded-full"></div>

      <div className="max-w-4xl mx-auto text-center relative z-20">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 text-white font-display tracking-tight leading-none">
          <span className="text-[#EAEAEA]">Airbnb</span>
          <br />for EV Charging
        </h2>

        <p className="text-xl md:text-3xl text-[#EAEAEA]/70 mb-16 leading-relaxed max-w-3xl mx-auto font-light">
          Just as Airbnb democratized hospitality and Uber transformed transportation, EVORA is building
          the decentralized infrastructure layer for electric mobility.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <PremiumButton to="/register" variant="primary">
            Start Charging Smart
          </PremiumButton>
          <PremiumButton to="/admin/register" variant="secondary">
            Become a Host
          </PremiumButton>
        </div>
      </div>
    </section>
  );
};
