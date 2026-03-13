import React from 'react';
import { LuxuryCard } from '../ui/LuxuryCard';

export const CommandDashboards = () => {
  return (
    <section className="ev-split flex items-center min-h-screen px-8 py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        {/* dashboards */}
        <div className="order-2 md:order-1">
          <div className="rounded-[2.5rem] p-8 md:p-12 transition-all duration-500 relative overflow-hidden bg-[#0A0A0A] border border-white/5 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-[#EAEAEA] font-display">
              Three Roles.<br />One Intelligent Network.
            </h2>

            <div className="space-y-6">
              {[
                {
                  title: 'EV Owner Dashboard',
                  items: ['Live slot selection', 'Grace window management', 'Real-time charging', 'Emergency access'],
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
                      <circle cx="25" cy="20" r="12" stroke="currentColor" strokeWidth="3" />
                      <path d="M25 32c-8 0-15 4-15 8v5h30v-5c0-4-7-8-15-8z" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  title: 'Station Host Dashboard',
                  items: ['Manage chargers', 'Dynamic pricing', 'Peak analytics', 'Revenue tracking'],
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
                      <rect x="10" y="15" width="30" height="25" rx="2" stroke="currentColor" strokeWidth="3" />
                      <rect x="15" y="10" width="20" height="8" fill="currentColor" />
                      <path d="M18 25h14M18 30h14M18 35h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: 'Admin Dashboard',
                  items: ['Network overview', 'Live status', 'Emergency override', 'Utilization AI'],
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
                      <circle cx="25" cy="25" r="18" stroke="currentColor" strokeWidth="3" />
                      <path d="M25 15v10l7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ),
                },
              ].map((d) => (
                <LuxuryCard
                  key={d.title}
                  className="ev-dash-preview !p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-[#EAEAEA]/70 group-hover:text-white transition-colors">{d.icon}</div>
                    <h3 className="text-xl font-bold font-display text-white">{d.title}</h3>
                  </div>
                  <ul className="grid grid-cols-2 gap-2 text-[#EAEAEA]/60 text-sm">
                    {d.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[hsl(var(--neon-green))]"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </LuxuryCard>
              ))}
            </div>
          </div>
        </div>

        {/* text */}
        <div className="order-1 md:order-2">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white font-display tracking-tight leading-tight">
            Your Intelligent<br />
            <span className="text-[#EAEAEA]/70">Command Center</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#EAEAEA]/70 leading-relaxed font-light">
            Whether you're charging, hosting, or managing the network, EVORA gives you complete control with real-time insights and intelligent automation.
          </p>
        </div>
      </div>
    </section>
  );
};
