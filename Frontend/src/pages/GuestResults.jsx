import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Target, Type, RotateCcw, ArrowRight } from 'lucide-react';

const GuestResults = () => {
  const location = useLocation();
  const { result, stats } = location.state || {};

  if (!stats) {
    return <Navigate to="/" replace />;
  }

  // Use backend calculated result if available, else fallback to frontend local stats
  const wpm = result?.wpm ?? stats.wpm;
  const accuracy = result?.accuracy ?? stats.accuracy;
  const correctCharacters = result?.correctCharacters ?? stats.correctCharacters;
  const incorrectCharacters = result?.incorrectCharacters ?? stats.incorrectCharacters;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl space-y-8"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-text-main mb-2">TEST COMPLETE</h2>
          <p className="text-text-secondary">Here is how you performed.</p>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* WPM */}
          <div className="rounded-2xl border border-border-color bg-surface p-8 text-center shadow-lg hover:border-primary/30 transition-colors">
            <Activity className="mx-auto mb-4 h-10 w-10 text-primary" />
            <div className="text-6xl font-bold font-mono text-text-main">{wpm}</div>
            <div className="mt-2 text-sm font-medium text-text-secondary uppercase tracking-wider">WPM</div>
          </div>

          {/* Accuracy */}
          <div className="rounded-2xl border border-border-color bg-surface p-8 text-center shadow-lg hover:border-violet-500/30 transition-colors">
            <Target className="mx-auto mb-4 h-10 w-10 text-violet-500" />
            <div className="text-6xl font-bold font-mono text-text-main">{accuracy}%</div>
            <div className="mt-2 text-sm font-medium text-text-secondary uppercase tracking-wider">Accuracy</div>
          </div>
        </div>

        {/* Character stats */}
        <div className="rounded-2xl border border-border-color bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-around">
            <div className="text-center">
               <div className="text-2xl font-mono text-success">{correctCharacters}</div>
               <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Correct Chars</div>
            </div>
            <div className="h-10 w-[1px] bg-card"></div>
            <div className="text-center">
               <div className="text-2xl font-mono text-error">{incorrectCharacters}</div>
               <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Incorrect</div>
            </div>
          </div>
        </div>

        {/* Conversion CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 p-[1px]">
          <div className="rounded-2xl bg-surface p-8 text-center h-full">
            <h3 className="text-2xl font-bold text-text-main mb-4">Want personalized AI practice?</h3>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Create an account to unlock your personal typing history, weak-key detection, adaptive AI passages, and long-term progress tracking.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary rounded-xl hover:bg-primaryHover transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center pb-12">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-text-secondary hover:bg-surface hover:text-text-main transition-colors focus:outline-none"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Take Again</span>
          </Link>
        </div>
        
      </motion.div>
    </div>
  );
};

export default GuestResults;

