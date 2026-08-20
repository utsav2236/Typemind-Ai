import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid verification link.');
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus('success');
        // Refresh the user context if they are somehow logged in
        await fetchUser();
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token, fetchUser]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border-color bg-surface p-8 shadow-xl text-center">
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">Verifying your email</h2>
            <p className="text-text-secondary">Please wait a moment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">Email Verified!</h2>
            <p className="text-text-secondary mb-8">
              Your TypeMind AI account is ready.<br/>
              Start improving your typing speed with your personal AI coach.
            </p>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-primaryHover"
            >
              Continue to Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">Verification Failed</h2>
            <p className="text-text-secondary mb-8">
              {errorMessage}
            </p>
            
            <div className="w-full space-y-3">
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-primaryHover"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

