import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to home if already logged in
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    
    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Email not verified. Please check your inbox.');
        navigate('/check-email', { state: { email } });
      } else {
        toast.error(err.response?.data?.message || 'Failed to login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-main">Welcome back</h2>
          <p className="mt-2 text-sm text-text-secondary">Continue improving your typing.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-border-color bg-bg py-3 pl-10 pr-3 text-text-main placeholder-secondary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-border-color bg-bg py-3 pl-10 pr-10 text-text-main placeholder-secondary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-text-secondary hover:text-text-main transition-colors" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5 text-text-secondary hover:text-text-main transition-colors" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-lg bg-primary py-3 px-4 text-sm font-medium text-white hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-surface" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-text-secondary">or</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primaryHover transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

