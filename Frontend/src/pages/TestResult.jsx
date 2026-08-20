import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Target, Zap, Sparkles, ArrowRight, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import KeyboardHeatmap from '../components/typing/KeyboardHeatmap';
import analyticsService from '../services/analyticsService';

const TestResult = () => {
  const location = useLocation();
  const { stats, session, userStats, newAchievements } = location.state || {};
  const [heatmapData, setHeatmapData] = useState([]);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Use key performance data from the current session for the heatmap
  useEffect(() => {
    if (session?.keyPerformance && Object.keys(session.keyPerformance).length > 0) {
      setHeatmapData(Object.values(session.keyPerformance).map(k => ({
        key: (k.key || k).toUpperCase(),
        accuracy: Math.round(k.accuracy || 0),
        mistakes: k.incorrect || k.errors || k.mistakes || 0,
      })));
    } else if (session?.weakKeys && session.weakKeys.length > 0) {
      // Fallback if no full keyPerformance is available
      setHeatmapData(session.weakKeys.map(k => ({
        key: (k.key || k).toUpperCase(),
        accuracy: Math.round(k.accuracy || 50),
        mistakes: k.errors || k.mistakes || 0,
      })));
    }
  }, [session]);

  if (!stats && !session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Use real session data if available, fall back to local stats
  const displayWpm = session?.wpm || stats?.wpm || 0;
  const displayAccuracy = session?.accuracy || stats?.accuracy || 0;
  const displayIQ = session?.typingIQ || userStats?.typingIQ || 0;
  const weakKeys = session?.weakKeys || [];
  const weakFingers = session?.weakFingers || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-4 rounded-3xl bg-surface p-12 text-center shadow-lg border border-border-color"
      >
        <h1 className="text-3xl font-bold text-text-main">Great session!</h1>

        <div className="flex flex-wrap justify-center gap-12 py-6">
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-2 text-5xl font-bold text-primary">
              {displayWpm}
            </span>
            <span className="mt-2 text-sm font-medium uppercase tracking-wider text-text-secondary">WPM</span>
          </div>

          <div className="h-16 w-px bg-card"></div>

          <div className="flex flex-col items-center">
            <span className="flex items-center gap-2 text-5xl font-bold text-text-main">
              {displayAccuracy}<span className="text-3xl">%</span>
            </span>
            <span className="mt-2 text-sm font-medium uppercase tracking-wider text-text-secondary">Accuracy</span>
          </div>

          {displayIQ > 0 && (
            <>
              <div className="h-16 w-px bg-card"></div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-2 text-5xl font-bold text-text-main">
                  {displayIQ}
                </span>
                <span className="mt-2 text-sm font-medium uppercase tracking-wider text-text-secondary">Typing IQ</span>
              </div>
            </>
          )}
        </div>

        {/* New Achievements */}
        {newAchievements && newAchievements.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {newAchievements.map((ach, i) => (
              <span key={i} className="rounded-full bg-warning/10 text-warning px-3 py-1 text-sm font-medium">
                🏆 {ach.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/typing"
            className="inline-flex items-center gap-2 rounded-xl bg-bg border border-border-color px-6 py-3 font-medium text-text-main hover:bg-card hover:border-primary/30 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            Take Again
          </Link>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* AI Analysis */}
        <motion.div variants={itemVariants} className="col-span-full lg:col-span-3 rounded-2xl border border-primary/30 bg-primary/5 p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary font-bold tracking-wider mb-4">
              <Sparkles className="h-5 w-5" />
              <span>◆ AI COACH ANALYSIS</span>
            </div>
            <p className="text-xl text-text-main mb-2">
              {displayWpm > 80 ? 'Impressive speed!' : displayWpm > 50 ? 'Solid performance.' : 'Keep practicing!'}
            </p>
            <p className="text-text-secondary leading-relaxed max-w-3xl">
              {weakKeys.length > 0
                ? `Focus on improving: ${weakKeys.slice(0, 3).map(k => typeof k === 'string' ? k : k.key).join(', ')}. These keys had the most errors in this session.`
                : 'Great accuracy! Keep up the consistent practice to build muscle memory.'}
            </p>
          </div>
        </motion.div>

        {/* Strengths */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border-color bg-surface p-6">
          <h3 className="mb-4 text-lg font-medium text-text-main">Session Highlights</h3>
          <ul className="space-y-3">
            {displayAccuracy >= 95 && (
              <li className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>High accuracy ({displayAccuracy}%)</span>
              </li>
            )}
            {displayWpm >= 60 && (
              <li className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Good speed ({displayWpm} WPM)</span>
              </li>
            )}
            {session?.consistency >= 80 && (
              <li className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Consistent rhythm</span>
              </li>
            )}
            {displayAccuracy < 95 && displayWpm < 60 && (
              <li className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Test completed</span>
              </li>
            )}
          </ul>
        </motion.div>

        {/* Weaknesses */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border-color bg-surface p-6">
          <h3 className="mb-4 text-lg font-medium text-text-main">Areas to Improve</h3>
          <ul className="space-y-3">
            {weakKeys.slice(0, 3).map((k, i) => (
              <li key={i} className="flex items-center gap-3 text-text-secondary">
                <XCircle className="h-5 w-5 text-error" />
                <span>{typeof k === 'string' ? k : `${k.key} key`}</span>
              </li>
            ))}
            {weakFingers.slice(0, 2).map((f, i) => (
              <li key={`f-${i}`} className="flex items-center gap-3 text-text-secondary">
                <XCircle className="h-5 w-5 text-error" />
                <span>{typeof f === 'string' ? f : f.finger}</span>
              </li>
            ))}
            {weakKeys.length === 0 && weakFingers.length === 0 && (
              <li className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>No significant weaknesses detected!</span>
              </li>
            )}
          </ul>
        </motion.div>

        {/* Next Practice CTA */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-primary/20 bg-gradient-to-br from-dark-surface to-dark-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-text-main mb-2">Your Next Practice</h3>
            <p className="text-text-secondary mb-4">AI-generated session targeting your weaknesses</p>
            {weakKeys.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {weakKeys.slice(0, 3).map((k, i) => (
                  <span key={i} className="font-mono bg-bg px-2 py-1 rounded text-primary">
                    {typeof k === 'string' ? k : k.key}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (user) {
                navigate('/practice');
              } else {
                navigate('/login');
              }
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Practice My Weaknesses
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>

      {/* Heatmap Section */}
      {heatmapData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8"
        >
          <h3 className="mb-6 text-center text-xl font-bold text-text-main">Keyboard Accuracy Heatmap</h3>
          <KeyboardHeatmap data={heatmapData} />
        </motion.div>
      )}
    </div>
  );
};

export default TestResult;
