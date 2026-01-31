import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Loader2, CarFront } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { authAPI } from '../../lib/api';

const UserRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;

    setLoading(true);
    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await authAPI.googleAuth();
    } catch (error) {
      console.error('Google signup failed:', error);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start charging smarter with EVORA"
    >
      {/* === SAME FORM, JUST SLIGHTLY ADAPTED FOR CARD === */}
<div className="bg-white rounded-2xl p-10 shadow-[0_20px_40px_rgba(0,0,0,0.15)]">


       
     

        <form onSubmit={handleSubmit} className="space-y-3 text-gray-900">

          {/* NAME */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl
                py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl
                py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl
                py-3 pl-12 pr-12 focus:outline-none focus:border-emerald-500/50"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl
                py-3 pl-12 pr-12 focus:outline-none focus:border-emerald-500/50"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

       <button
  type="submit"
  className="
    w-full py-3 mt-6 rounded-xl
    font-semibold text-white
    bg-gradient-to-r from-emerald-400 via-teal-400 to-purple-500
    hover:from-emerald-300 hover:via-teal-300 hover:to-purple-400
    transition-all duration-300
    shadow-lg hover:shadow-xl
    active:scale-[0.98]
  "
>
  Create Account
</button>


          {/* GOOGLE */}
          <button
  type="button"
  className="
    w-full mt-4 py-3 rounded-xl
    border border-gray-200
    text-gray-700 font-medium
    hover:bg-gray-50
    transition-all
  "
>
  Continue with Google
</button>


          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default UserRegister;
