import React from 'react';
import { LuxuryCard } from '../ui/LuxuryCard';

export const ProblemStatement = () => {
  return (
    <section className="ev-split flex items-center min-h-screen px-8 py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-24 items-center">
        <div>
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-[#EAEAEA] font-display tracking-tight leading-tight">
            The Problem
          </h2>
          <p className="text-xl md:text-2xl text-[#EAEAEA]/70 mb-8 leading-relaxed font-light">
            EV adoption is accelerating, but charging infrastructure is stuck in the past.
            Drivers face uncertainty, stations lose revenue, and the grid operates inefficiently.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8">
          {[
            {
              title: 'Long Waiting Times',
              desc: 'No visibility into charger availability leads to wasted time and frustration',
              icon: (
                <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                  <path d="M30 5L35 25L45 15L35 35L55 30L35 40L45 55L25 40L30 60L20 40L5 50L20 30L0 35L20 25L10 10L30 20L30 5Z" fill="currentColor" />
                </svg>
              ),
            },
            {
              title: 'No Real-time Booking',
              desc: 'First-come-first-served creates chaos during peak hours',
              icon: (
                <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="25" stroke="currentColor" strokeWidth="4" />
                  <line x1="15" y1="15" x2="45" y2="45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: 'No Emergency Priority',
              desc: 'Critical vehicles have no guaranteed access when needed most',
              icon: (
                <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                  <rect x="15" y="10" width="30" height="35" rx="3" stroke="currentColor" strokeWidth="3" />
                  <path d="M20 25h20M20 30h20M20 35h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="42" cy="18" r="8" fill="currentColor" />
                  <path d="M42 14v4M42 22h.01" stroke="#050505" strokeWidth="2" strokeLinecap="round" />
                  <path d="M25 45L30 55L35 45" fill="currentColor" />
                </svg>
              ),
            },
          ].map((c) => (
            <LuxuryCard key={c.title} className="ev-feature-card group">
              <div className="mb-6 text-[#EAEAEA]/80 group-hover:text-white transition-colors duration-500">{c.icon}</div>
              <h3 className="text-2xl font-bold mb-3 font-display tracking-wide text-white">{c.title}</h3>
              <p className="text-[#EAEAEA]/60 leading-relaxed">{c.desc}</p>
            </LuxuryCard>
          ))}
        </div>
      </div>
    </section>
  );
};
