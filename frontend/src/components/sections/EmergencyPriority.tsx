import React from 'react';

export const EmergencyPriority = () => {
  return (
    <section className="ev-split flex items-center min-h-screen px-8 py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        {/* card */}
        <div className="order-2 md:order-1">
          <div className="rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden bg-[#0A0A0A] border border-red-500/20 shadow-2xl">
            {/* ambient red glow behind card */}
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-red-500/10 blur-[100px] pointer-events-none"></div>

            <div className="inline-flex items-center gap-3 rounded-full px-5 py-2.5 mb-8 font-bold text-sm tracking-wide bg-red-500/10 border border-red-500/30 text-red-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
              EMERGENCY MODE ACTIVE
            </div>

            <h3 className="text-3xl md:text-4xl font-bold mb-10 text-white font-display">System Override Protocol</h3>

            <div className="space-y-8">
              {[
                { n: '1', title: 'Override Upcoming Bookings', desc: 'Emergency vehicles get instant priority access' },
                { n: '2', title: 'Active Sessions Protected', desc: 'Currently charging vehicles remain unaffected' },
                { n: '3', title: 'Infrastructure Optimized', desc: 'System automatically reallocates affected users' },
              ].map((s) => (
                <div key={s.n} className="flex gap-6 group">
                  <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl font-display font-bold bg-red-500/10 text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
                    {s.n}
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2 text-white">{s.title}</h4>
                    <p className="text-[#EAEAEA]/60 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* text */}
        <div className="order-1 md:order-2">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white font-display tracking-tight leading-tight">
            Priority When<br />
            <span className="text-red-500">It Matters Most</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#EAEAEA]/70 leading-relaxed font-light">
            Emergency vehicles need guaranteed access. Our intelligent priority system ensures critical infrastructure needs are met without disrupting the entire network.
          </p>
        </div>
      </div>
    </section>
  );
};
