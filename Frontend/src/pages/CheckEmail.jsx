import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // If no email was passed, send them back to login
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      await authService.resendVerification(email);
      toast.success('Verification email resent!');
      setCountdown(30); // 30 seconds cooldown
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length > 2 ? name[0] + '***' + name[name.length - 1] : name + '***';
    return `${maskedName}@${domain}`;
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border-color bg-surface p-8 shadow-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-8 w-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-text-main mb-2">Check your inbox</h2>
        <p className="text-text-secondary mb-6">
          We sent a verification link to<br/>
          <span className="font-medium text-text-main">{maskEmail(email)}</span>
        </p>

        <p className="text-sm text-text-secondary mb-8">
          Click the link in the email to activate your TypeMind AI account.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-color bg-bg px-4 py-3 text-sm font-medium text-text-main transition-colors hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend Email'}
            {countdown > 0 && `(Available in ${countdown}s)`}
          </button>
          
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:text-primaryHover transition-colors"
          >
            Back to Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;

