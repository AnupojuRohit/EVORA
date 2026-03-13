import React from 'react';

export const ScaleRevenue = () => {
  return (
    <section className="ev-split flex items-center min-h-screen px-8 py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        <div>
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white font-display tracking-tight leading-tight">
            Built for<br />
            <span className="text-[#EAEAEA]/70">Scale &amp; Revenue</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#EAEAEA]/70 mb-8 leading-relaxed font-light">
            Enterprise-grade infrastructure meets intelligent monetization. From day one, EVORA is designed to grow with demand.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:gap-8">
          {[
            { val: '100%', label: 'Razorpay Integration' },
            { val: '24/7', label: 'Dynamic Pricing' },
            { val: '∞', label: 'Scalable Network' },
            { val: 'AI', label: 'Demand Prediction' },
          ].map((s) => (
            <div
              key={s.label}
              className="ev-stat rounded-[2rem] p-8 md:p-10 text-center transition-all duration-500 hover:-translate-y-2 bg-[#0A0A0A] border border-white/5 hover:border-white/10 hover:bg-[#111]"
            >
              <div className="font-extrabold text-5xl md:text-6xl text-white font-display mb-4 tracking-tighter">
                {s.val}
              </div>
              <p className="text-[#EAEAEA]/60 font-medium tracking-wide uppercase text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
