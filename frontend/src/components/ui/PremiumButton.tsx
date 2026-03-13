import React from 'react';
import { Link } from 'react-router-dom';

interface PremiumButtonProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  to,
  onClick,
  children,
  variant = 'primary',
  className = '',
  type = 'button',
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-500 ease-out font-display tracking-wide relative overflow-hidden group";
  
  let variantStyles = "";
  if (variant === 'primary') {
    variantStyles = "bg-[#EAEAEA] text-[#050505] px-8 py-4 hover:scale-105 shadow-[0_4px_24px_rgba(234,234,234,0.15)] hover:shadow-[0_8px_32px_rgba(234,234,234,0.3)]";
  } else if (variant === 'secondary') {
    variantStyles = "bg-transparent text-[#EAEAEA] border border-[#EAEAEA]/20 px-8 py-4 hover:bg-[#EAEAEA]/5 hover:border-[#EAEAEA]/50 backdrop-blur-md";
  } else if (variant === 'accent') {
    variantStyles = "bg-[hsl(var(--neon-green))] text-[#050505] px-8 py-4 hover:scale-105 shadow-[0_0_30px_hsla(var(--neon-green),0.3)]";
  }
  
  const combinedClassName = `${baseStyles} ${variantStyles} ${className}`;

  const InnerContent = () => (
    <>
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-0"></div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClassName}>
        <InnerContent />
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combinedClassName}>
      <InnerContent />
    </button>
  );
};
