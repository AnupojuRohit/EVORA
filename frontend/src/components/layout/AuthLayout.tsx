import { ReactNode } from 'react';
import Logo from '../ui/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          
          {children}
        </div>
        
        <p className="text-center text-muted-foreground text-sm mt-6">
          © 2026 Evora. Powering the future of mobility.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
