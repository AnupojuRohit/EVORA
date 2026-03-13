import React from 'react';
import { LuxuryCard } from '../ui/LuxuryCard';

export const SlotIntelligence = () => {
  return (
    <section className="ev-split flex items-center min-h-screen px-8 py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        <div>
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white font-display tracking-tight leading-tight">
            Advanced<br />
            <span className="text-[#EAEAEA]/70">Slot Intelligence</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#EAEAEA]/70 mb-12 leading-relaxed font-light">
            Our proprietary slot management system maximizes utilization while ensuring fairness and reliability.
          </p>

          <div className="space-y-8">
            {[
              { title: '10-Minute Micro-Slots', desc: 'Granular booking for optimal flexibility' },
              { title: 'Grace Release System', desc: 'Automatic no-show recovery without penalties' },
              { title: 'Dynamic Reallocation', desc: 'Freed slots instantly available to next user' },
            ].map((t) => (
              <div key={t.title} className="relative pl-12">
                <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-[hsl(var(--neon-green))] to-transparent opacity-50"></div>
                <div className="absolute left-[-6px] top-4 w-[14px] h-[14px] rounded-full bg-[hsl(var(--neon-green))] shadow-[0_0_15px_hsla(var(--neon-green),0.5)]"></div>
                <h4 className="font-bold text-2xl mb-2 text-white font-display tracking-wide">{t.title}</h4>
                <p className="text-[#EAEAEA]/60 leading-relaxed max-w-md">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <LuxuryCard className="group">
          <h3 className="text-3xl font-bold mb-10 text-white font-display">Slot Flow Timeline</h3>
          <div className="space-y-10">
            {[
              { time: '9:00 AM', label: 'Booking', color: 'hsl(var(--neon-green))', bg: 'hsla(var(--neon-green),0.1)', desc: 'User reserves charging slot' },
              { time: '9:10 AM', label: 'Grace Window', color: '#EAEAEA', bg: 'rgba(234,234,234,0.1)', desc: '10-minute window to arrive or extend' },
              { time: '9:20 AM', label: 'Auto-Release', color: '#EAEAEA', bg: 'rgba(234,234,234,0.05)', desc: 'Slot freed for next user if no-show' },
            ].map((s) => (
              <div key={s.time} className="relative">
                <div className="flex flex-col md:flex-row md:items-center mb-3 gap-4">
                  <span className="font-bold text-2xl text-white font-display w-24 shrink-0">{s.time}</span>
                  <span className="text-sm px-4 py-1.5 rounded-full font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}>{s.label}</span>
                </div>
                <p className="text-[#EAEAEA]/60 ml-0 md:ml-28">{s.desc}</p>
              </div>
            ))}
          </div>
        </LuxuryCard>
      </div>
    </section>
  );
};
