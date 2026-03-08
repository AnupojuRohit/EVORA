import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { adminAuthAPI } from '../../lib/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await adminAuthAPI.login(formData);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_type', 'admin');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Portal"
      subtitle="Sign in to manage your stations"
    >
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-clean pl-12"
              placeholder="admin@laxev.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-clean pl-12 pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Sign In as Admin'}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need an admin account?{' '}
          <Link to="/admin/register" className="text-primary hover:text-primary/80 font-medium">
            Register here
          </Link>
        </p>

        <div className="pt-4 border-t border-border">
          <Link 
            to="/login" 
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to User Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
