import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, Bike, ChevronRight } from 'lucide-react';
import Logo from '../components/ui/Logo';

const Index = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 1600);
    const t3 = setTimeout(() => setStage(3), 2000);
    const t4 = setTimeout(() => setStage(4), 2800);
    const t5 = setTimeout(() => setStage(5), 3500);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white relative overflow-hidden selection:bg-emerald-500/30">
      {/* Top Navigation (kept functionality) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Background layers */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)]" />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen transition-all duration-1000 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`} />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none" />

      {/* Hero Animation */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-24 pb-28">
        <div className="relative h-64 w-full max-w-2xl flex items-center justify-center mb-8">
          {/* Left car */}
          <div className={`absolute transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${stage === 0 ? '-translate-x-48 opacity-0 scale-50' : ''} ${stage === 1 ? 'translate-x-[-60px] opacity-100 scale-100' : ''} ${stage >= 2 ? 'translate-x-0 opacity-0 scale-50 blur-xl' : ''}`}>
            <CarFront className="w-24 h-24 text-transparent stroke-emerald-400 stroke-[1.5px] drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </div>
          {/* Right bike */}
          <div className={`absolute transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${stage === 0 ? 'translate-x-48 opacity-0 scale-50' : ''} ${stage === 1 ? 'translate-x-[60px] opacity-100 scale-100' : ''} ${stage >= 2 ? 'translate-x-0 opacity-0 scale-50 blur-xl' : ''}`}>
            <Bike className="w-24 h-24 text-transparent stroke-purple-400 stroke-[1.5px] drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] transform -scale-x-100" />
          </div>
          {/* Burst */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${stage === 2 ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`}>
            <div className="w-40 h-1 bg-white shadow-[0_0_50px_20px_rgba(255,255,255,0.8)] rounded-full blur-md" />
          </div>
          {/* Logo */}
          <div className={`absolute flex flex-col items-center transition-all duration-1000 delay-100 ${stage >= 3 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-lg'}`}>
            <h1 className="text-7xl md:text-8xl font-bold tracking-tighter">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-purple-400 bg-clip-text text-transparent">EVORA</span>
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <div className={`-mt-2 transition-all duration-1000 ease-out ${stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-base md:text-lg font-medium text-gray-400 tracking-[0.15em] uppercase flex items-center gap-3">
            <span className="w-8 h-[1px] bg-emerald-500/50" />
            Smart EV Slot Booking Platform
            <span className="w-8 h-[1px] bg-purple-500/50" />
          </p>
        </div>

        {/* Buttons */}
        <div className={`mt-14 w-full max-w-md px-6 flex flex-col gap-4 transition-all duration-1000 delay-200 ${stage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <Link to="/register" className="w-full group">
            <button className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 border border-emerald-500/30 p-4 transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between px-4">
                <span className="text-lg font-semibold tracking-wide">Create Account</span>
                <div className="bg-emerald-500/20 p-2 rounded-lg group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          </Link>
          <Link to="/login" className="w-full group">
            <button className="relative w-full overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors">Login</span>
              </div>
            </button>
          </Link>
        </div>
      </div>

      {/* HUD decorations */}
      <div className={`fixed top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${stage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-8 left-8 w-32 h-32 border-l-2 border-t-2 border-emerald-500/20 rounded-tl-3xl" />
        <div className="absolute top-12 left-12 text-[10px] text-emerald-500/40 font-mono">
          SYS.STATUS: ONLINE<br/>GRID: ACTIVE
        </div>
        <div className="absolute bottom-8 right-8 w-32 h-32 border-r-2 border-b-2 border-purple-500/20 rounded-br-3xl" />
        <div className="absolute bottom-12 right-12 text-[10px] text-purple-500/40 font-mono text-right">
          SECURE CONNECTION<br/>V 2.0.4
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-dashed border-emerald-500/10 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
      </div>

      {/* Footer (kept) */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-white/10 py-6 px-4 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-gray-400 text-sm">© 2026 Evora. Powering the future of mobility.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
