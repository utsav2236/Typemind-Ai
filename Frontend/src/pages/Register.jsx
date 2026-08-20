import React, { useState, useContext } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect to home if already logged in
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;
    
    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all fields');
    }
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setIsSubmitting(true);
    try {
      await register({ name, email, password, confirmPassword });
      toast.success('Account created! Please verify your email.');
      navigate('/check-email', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-main">Create your account</h2>
          <p className="mt-2 text-sm text-text-secondary">Start your personalized typing journey.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-lg border border-border-color bg-bg py-3 pl-10 pr-3 text-text-main placeholder-secondary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Name"
              />
            </div>
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
                value={formData.email}
                onChange={handleChange}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
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
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full rounded-lg border border-border-color bg-bg py-3 pl-10 pr-10 text-text-main placeholder-secondary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primaryHover transition-colors">
                Sign In
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
};

export default Register;

