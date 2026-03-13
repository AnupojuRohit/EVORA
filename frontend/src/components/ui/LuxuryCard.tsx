import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LuxuryCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({ children, className = '', hoverEffect = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    
    // Parallax scrolling effect
    const animation = gsap.fromTo(
      cardRef.current,
      { y: 30 },
      {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    return () => {
      animation.kill();
    };
  }, []);

  const baseStyles = "relative rounded-3xl overflow-hidden glass p-8 md:p-10 z-10 bg-[#0A0A0A]/40 border border-white/5 backdrop-blur-2xl";
  const hoverStyles = hoverEffect ? "transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-20px_rgba(255,255,255,0.05)] hover:bg-[#0A0A0A]/60 hover:border-white/10" : "";
  
  return (
    <div ref={cardRef} className={`${baseStyles} ${hoverStyles} ${className}`}>
      {/* Subtle top border gradient highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
      
      {/* Optional ambient inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};
