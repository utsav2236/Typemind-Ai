import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import aiService from '../services/aiService';
import analyticsService from '../services/analyticsService';
import toast from 'react-hot-toast';

const AIPractice = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weakKeys, setWeakKeys] = useState([]);
  const [weakFingers, setWeakFingers] = useState([]);
  const [duration, setDuration] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWeaknesses = async () => {
      try {
        const weaknessRes = await analyticsService.getWeaknesses();
        if (weaknessRes.weakKeys) {
          setWeakKeys(weaknessRes.weakKeys.slice(0, 5));
        }
        if (weaknessRes.weakFingers) {
          setWeakFingers(weaknessRes.weakFingers.slice(0, 3));
        }
      } catch (err) {
        console.warn('Could not load weaknesses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeaknesses();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await aiService.generatePractice({
        duration: duration,
        difficulty: 'adaptive',
        mode: 'general'
      });

      const practice = response?.practice;
      if (practice && practice.text) {
        toast.success('Practice session created!');
        navigate('/typing', {
          state: {
            text: practice.text,
            duration: practice.duration
          }
        });
      } else {
        throw new Error('No practice text returned.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate practice. Please try again.');
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <Link to="/dashboard" className="mb-8 inline-flex items-center text-sm text-text-secondary hover:text-text-main transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <AnimatePresence mode="wait">
          {!isGenerating ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="overflow-hidden rounded-2xl border border-border-color bg-surface shadow-xl"
            >
              <div className="border-b border-border-color p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-text-main">Personalized Practice</h1>
                <p className="mt-2 text-text-secondary">Built from your typing patterns.</p>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary">Focus Areas</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weakKeys.length > 0 ? (
                        weakKeys.map((wk, i) => (
                          <span key={`key-${i}`} className="rounded-md bg-card px-3 py-1.5 font-mono font-medium text-primary uppercase">{wk.key || wk.char}</span>
                        ))
                      ) : (
                        <span className="rounded-md bg-card px-3 py-1.5 text-sm font-medium text-text-main">General Accuracy</span>
                      )}

                      {weakFingers.map((wf, i) => (
                        <span key={`finger-${i}`} className="rounded-md bg-card px-3 py-1.5 text-sm font-medium text-text-main capitalize">{wf.finger || wf}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-text-secondary">Test Duration</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[15, 30, 60, 120, 300].map((t) => (
                        <button
                          key={t}
                          onClick={() => setDuration(t)}
                          className={`rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${duration === t
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border-color bg-bg text-text-secondary hover:border-border-color-hover hover:text-text-main'
                            }`}
                        >
                          {t >= 60 ? (t === 300 ? '5m' : `${t / 60}m`) : `${t}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-color bg-bg p-4">
                    <p className="text-sm text-text-secondary">Difficulty</p>
                    <p className="mt-1 font-medium text-text-main">Adaptive (Personalized to your patterns)</p>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleGenerate}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-surface"
                  >
                    <Sparkles className="h-5 w-5" />
                    Generate Practice
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-surface p-12 py-24 shadow-xl text-center"
            >
              <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-border-color"></div>
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-text-main">◆ Analyzing your typing patterns...</h2>
              <p className="mt-3 text-text-secondary">Building your personalized practice sequence</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIPractice;

