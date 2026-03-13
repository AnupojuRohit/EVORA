import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Logo from '../components/ui/Logo';

// Section Components
import { ProblemStatement } from '../components/sections/ProblemStatement';
import { CommandDashboards } from '../components/sections/CommandDashboards';
import { SlotIntelligence } from '../components/sections/SlotIntelligence';
import { EmergencyPriority } from '../components/sections/EmergencyPriority';
import { ScaleRevenue } from '../components/sections/ScaleRevenue';
import { VisionCTA } from '../components/sections/VisionCTA';

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroWrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Preloading State
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  /* ── GSAP scroll animations ── */
  useEffect(() => {
    if (!imagesLoaded) return;
    
    const ctx = gsap.context(() => {
      /* split sections children */
      gsap.utils.toArray<HTMLElement>('.ev-split').forEach((section) => {
        gsap.from(section.querySelectorAll(':scope > div > *'), {
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
          opacity: 0,
          y: 50,
          duration: 1,
          stagger: 0.2,
          ease: 'power2.out',
        });
      });

      /* feature cards */
      gsap.utils.toArray<HTMLElement>('.ev-feature-card').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
          opacity: 0, scale: 0.95, duration: 0.8, delay: i * 0.1, ease: 'power2.out',
        });
      });

      /* dashboard previews */
      gsap.utils.toArray<HTMLElement>('.ev-dash-preview').forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          opacity: 0, x: i % 2 === 0 ? -30 : 30, duration: 0.8, ease: 'power2.out',
        });
      });

      /* stat numbers */
      gsap.utils.toArray<HTMLElement>('.ev-stat').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          opacity: 0, scale: 0.5, duration: 0.8, ease: 'back.out(1.7)',
        });
      });
    }, wrapRef);

    return () => ctx.revert();
  }, [imagesLoaded]);

  /* ── HERO CANVAS ANIMATION ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Eager load all frames
    const framesGlob = import.meta.glob('../../../animation/ezgif-frame-*.jpg', { eager: true });
    let frameUrls = Object.keys(framesGlob).sort().map((k) => (framesGlob[k] as any).default);

    if (frameUrls.length === 0) {
      // fallback just in case glob is empty or fails gracefully
      setImagesLoaded(true);
      return;
    }

    const images: HTMLImageElement[] = [];
    const ctx2d = canvas.getContext('2d');
    let playhead = { frame: 0 };
    let loadedCount = 0;

    const renderFrame = (index: number) => {
      if (!ctx2d) return;
      const frameIndex = Math.min(frameUrls.length - 1, Math.max(0, Math.round(index)));
      if (!images[frameIndex] || !images[frameIndex].complete) return;
      const img = images[frameIndex];

      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame(playhead.frame);
    };
    window.addEventListener('resize', setCanvasSize);

    frameUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / frameUrls.length) * 100));

        if (loadedCount === frameUrls.length) {
          setImagesLoaded(true);
          setCanvasSize();
          initializeAnimations();
        }
      };
      images.push(img);
    });

    const initializeAnimations = () => {
      if (wrapRef.current) {
        gsap.to(playhead, {
          frame: frameUrls.length - 1,
          snap: 'frame',
          ease: 'none',
          scrollTrigger: {
            trigger: wrapRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
          },
          onUpdate: () => renderFrame(playhead.frame)
        });
      }

      if (heroWrapRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroWrapRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
          }
        });

        tl.to('.ev-text-0', { opacity: 0, duration: 0.1, ease: 'power1.inOut' }, 0.15);
        tl.to('.ev-text-1', { opacity: 1, duration: 0.1, ease: 'power1.inOut' }, 0.25);
        tl.to('.ev-text-1', { opacity: 0, duration: 0.1, ease: 'power1.inOut' }, 0.45);
        tl.to('.ev-text-2', { opacity: 1, duration: 0.1, ease: 'power1.inOut' }, 0.55);
        tl.to('.ev-text-2', { opacity: 0, duration: 0.1, ease: 'power1.inOut' }, 0.75);
        tl.to('.ev-text-3', { opacity: 1, duration: 0.1, ease: 'power1.inOut' }, 0.85);
      }
    };

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <div ref={wrapRef} className="min-h-screen text-[#EAEAEA] overflow-x-hidden">

      {/* ═══════════════ GLOBAL FIXED BACKGROUND CANVAS SYSTEM ═══════════════ */}
      <div
        className="pointer-events-none bg-[#050505]"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mix-blend-screen"
          style={{
            opacity: 0.6,
            WebkitMaskImage: 'linear-gradient(to top left, transparent 0%, transparent 10%, black 15%, black 100%)',
            maskImage: 'linear-gradient(to top left, transparent 0%, transparent 10%, black 15%, black 100%)'
          }}
        />

        {/* Minimal Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(234,234,234,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(234,234,234,0.05) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            animation: 'ev-grid-move 40s linear infinite',
            zIndex: 1,
          }}
        />
      </div>

      <style>{`
        @keyframes ev-grid-move { 0%{transform:translate(0,0)} 100%{transform:translate(80px,80px)} }
        @keyframes ev-scroll-text { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ev-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ═══════════════ PRELOADER ═══════════════ */}
      {!imagesLoaded && (
        <div className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center">
          <Logo size="lg" />
          <div className="mt-8 mx-auto rounded-full overflow-hidden w-48 h-[2px] bg-white/10">
            <div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${loadProgress}%` }} />
          </div>
          <p className="mt-6 text-white/50 text-xs tracking-[0.3em] uppercase font-display">Igniting Engine ... {loadProgress}%</p>
        </div>
      )}

      {/* ═══════════════ STICKY SCROLL HERO ═══════════════ */}
      <section ref={heroWrapRef} className="relative w-full" style={{ height: '400vh' }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center p-8">
          <div className="absolute inset-0 z-10">
            {/* 0% Scroll - Headline */}
            <div className="ev-text-0 ev-text-overlay absolute inset-0 flex flex-col items-center justify-center text-center">
              <div>
                <h1 className="uppercase leading-none text-white font-display font-bold tracking-tighter" style={{ fontSize: 'clamp(5rem, 15vw, 12rem)' }}>
                  EVORA
                </h1>
                <p className="mt-6 text-lg md:text-xl tracking-[0.3em] font-light text-white/60 uppercase">Intelligent Mobility</p>
                
                <div className="flex gap-6 justify-center flex-wrap mt-12 pointer-events-auto">
                  <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-[#EAEAEA] text-[#050505] px-8 py-4 font-semibold text-lg transition-all duration-500 hover:scale-105 shadow-[0_4px_24px_rgba(234,234,234,0.15)] font-display tracking-wide">
                    Book a Charger
                  </Link>
                  <Link to="/admin/register" className="inline-flex items-center justify-center rounded-full bg-transparent border border-white/20 text-white px-8 py-4 font-semibold text-lg transition-all duration-500 hover:bg-white/5 font-display tracking-wide backdrop-blur-md">
                    Host a Station
                  </Link>
                </div>
              </div>
            </div>

            {/* 30% Scroll - Feature 1 */}
            <div className="ev-text-1 ev-text-overlay absolute inset-0 flex items-center justify-start md:pl-32 xl:pl-48 opacity-0 pointer-events-none">
              <div className="max-w-xl">
                <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white font-display tracking-tight leading-tight">
                  Democratized<br />
                  <span className="text-[#EAEAEA]/70">Architecture</span>
                </h2>
                <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-light">
                  A decentralized infrastructure built to eliminate range anxiety and bring charging logic into the 21st century.
                </p>
              </div>
            </div>

            {/* 60% Scroll - Feature 2 */}
            <div className="ev-text-2 ev-text-overlay absolute inset-0 flex items-center justify-end md:pr-32 xl:pr-48 text-right opacity-0 pointer-events-none">
              <div className="max-w-xl ml-auto">
                <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white font-display tracking-tight leading-tight">
                  Granular<br />
                  <span className="text-[#EAEAEA]/70">Control</span>
                </h2>
                <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-light">
                  Proprietary peak-hour prediction models and 10-minute micro-slot booking algorithms maximize hardware utilization.
                </p>
              </div>
            </div>

            {/* 90% Scroll - CTA */}
            <div className="ev-text-3 ev-text-overlay absolute inset-0 flex items-center justify-center text-center opacity-0">
              <div>
                <h2 className="text-5xl md:text-8xl font-bold mb-10 text-white font-display tracking-tight leading-none">
                  Join The<br />
                  <span>Network.</span>
                </h2>
                <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--neon-green))] text-[#050505] px-10 py-5 font-bold text-xl transition-all duration-500 hover:scale-105 shadow-[0_0_30px_hsla(var(--neon-green),0.3)] pointer-events-auto font-display tracking-wide">
                  Experience Evora
                </Link>
              </div>
            </div>
          </div>

          {/* Static Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ animation: 'ev-fade-up 1s ease-out forwards 1s' }}>
            <div className="w-[1px] h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0"></div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATIC NEWS BANNER ═══════════════ */}
      <div className="py-6 border-y border-white/5 bg-[#050505]/80 backdrop-blur-md relative z-10 px-8">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 px-8 py-4 text-center shadow-lg backdrop-blur-xl w-full">
            <p className="font-bold font-display uppercase tracking-widest text-[#EAEAEA]/80 text-sm md:text-base">
              Real-time Slot Booking • Grace Logic • Emergency Priority • Intelligent Infrastructure
            </p>
          </div>
        </div>
      </div>

      <ProblemStatement />
      <CommandDashboards />
      <SlotIntelligence />
      <EmergencyPriority />
      <ScaleRevenue />
      <VisionCTA />

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="py-16 px-8 text-center bg-[#050505] border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">
            <Logo size="lg" />
          </div>
          <p className="mt-8 text-white/40 tracking-widest text-sm uppercase font-display">Smart EV Charging Infrastructure</p>
          <p className="mt-4 text-xs text-white/20">© 2026 EVORA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
