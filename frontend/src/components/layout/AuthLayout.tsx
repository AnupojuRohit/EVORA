import { ReactNode } from "react";
import Logo from "../ui/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
{/* ================= LEFT SIDE (ANIMATED HERO) ================= */}
<div
  className="hidden lg:flex flex-col justify-center items-center
  bg-[#0b0614] text-white relative overflow-hidden"
>
  {/* Animated grid */}
  <div
    className="absolute inset-0 opacity-20 auth-grid"
    style={{
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}
  />

  {/* Rotating ring */}
  <div className="absolute right-[-20%] top-1/2 w-[520px] h-[520px]
    rounded-full border border-white/20 auth-ring" />

  {/* Content */}
  <div className="relative z-10 text-center px-10 auth-hero-text">
    <h1 className="text-6xl font-extrabold tracking-wide mb-6">
      <span className="bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent">
        EVORA
      </span>
    </h1>

    <p className="uppercase tracking-[0.25em] text-sm text-white/80">
      Smart EV Slot Booking Platform
    </p>
  </div>
</div>


      {/* ================= RIGHT SIDE (LOGIN FORM) ================= */}
      <div className="flex items-center justify-center px-6 bg-background">
<div className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Logo />
            <span className="text-xl font-bold">Evora</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {title}
          </h2>

          {subtitle && (
            <p className="text-muted-foreground mb-8">
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
