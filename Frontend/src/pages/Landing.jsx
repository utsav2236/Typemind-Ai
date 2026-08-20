import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import guestService from '../services/guestService';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Brain, Activity, ArrowRight, Sparkles, Zap, Target, Check, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getPassage } from '../utils/passages';

const CustomDropdown = ({ label, options, value, onChange, formatLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">{label}</p>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface/80 border border-border-color rounded-xl text-text-main font-medium hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-md"
      >
        <span className="truncate">{formatLabel ? formatLabel(value) : value}</span>
        <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-2`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-surface border border-border-color rounded-xl shadow-2xl overflow-hidden py-1"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-card hover:text-text-main'}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedTopic, setSelectedTopic] = useState('random');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const { user } = useContext(AuthContext);

  const TOPICS = [
    { id: 'random', label: '🎲 Random' },
    { id: 'programming', label: '💻 Programming' },
    { id: 'travel', label: '✈️ Travel' },
    { id: 'education', label: '📚 Education' },
    { id: 'science', label: '🔬 Science' },
    { id: 'general', label: '📝 General' }
  ];

  const DIFFICULTIES = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' }
  ];

  const handleStartTyping = async () => {
    if (user) {
      navigate('/typing', { state: { duration: selectedDuration, topic: selectedTopic, difficulty: selectedDifficulty } });
      return;
    }

    try {
      const passage = getPassage(selectedTopic, selectedDuration, selectedDifficulty);
      const testId = crypto.randomUUID();

      navigate('/typing-test', {
        state: {
          isGuest: true,
          duration: selectedDuration,
          text: passage.text,
          testId: testId
        }
      });
    } catch (error) {
      console.error('Failed to start guest test:', error);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 overflow-hidden">

        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">TypeMind AI is here</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold text-text-main tracking-tight mb-8">
              {user ? (
                <>
                  Welcome back, <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                    {user.name.split(' ')[0]} 👋
                  </span>
                </>
              ) : (
                <>
                  Every test makes your <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                    next test smarter.
                  </span>
                </>
              )}
            </h1>

            <p className="mt-4 text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
              {user
                ? "Your typing journey continues. Ready to set a new personal best?"
                : "Not just a typing test. An adaptive AI coach that understands your weaknesses and builds personalized practice sessions to make you faster."}
            </p>

            <div className="flex flex-col items-center justify-center gap-8 mt-12 bg-surface/40 border border-border-color p-8 rounded-3xl max-w-4xl mx-auto backdrop-blur-xl shadow-2xl">
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                <CustomDropdown
                  label="Test Duration"
                  value={selectedDuration}
                  onChange={setSelectedDuration}
                  options={[
                    { value: 30, label: '30 SEC' },
                    { value: 60, label: '1 MIN' },
                    { value: 180, label: '3 MIN' },
                    { value: 300, label: '5 MIN' }
                  ]}
                  formatLabel={(val) => {
                    if (val === 60) return '1 MIN';
                    if (val === 180) return '3 MIN';
                    if (val === 300) return '5 MIN';
                    return `${val} SEC`;
                  }}
                />

                <CustomDropdown
                  label="Topic"
                  value={selectedTopic}
                  onChange={setSelectedTopic}
                  options={TOPICS.map(t => ({ value: t.id, label: t.label }))}
                  formatLabel={(val) => TOPICS.find(t => t.id === val)?.label}
                />

                <CustomDropdown
                  label="Difficulty"
                  value={selectedDifficulty}
                  onChange={setSelectedDifficulty}
                  options={DIFFICULTIES.map(d => ({ value: d.id, label: d.label }))}
                  formatLabel={(val) => DIFFICULTIES.find(d => d.id === val)?.label}
                />
              </div>

              <button
                onClick={handleStartTyping}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-bold text-white bg-primary rounded-xl hover:bg-primaryHover transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                <>
                  Start Typing
                  <ArrowRight className="h-5 w-5" />
                </>
              </button>

              <p className="text-sm text-text-secondary">
                {!user && "No account required"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Hero Image Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-20 relative z-10"
        >
          <div className="rounded-2xl border border-border-color bg-surface/80 backdrop-blur-xl p-2 shadow-2xl overflow-hidden">
            <div className="rounded-xl overflow-hidden border border-border-color relative py-20 bg-card flex items-center justify-center">
              <div className="text-center space-y-6 max-w-3xl px-8">
                <div className="flex justify-between text-text-secondary font-mono text-sm mb-12">
                  <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> 108 WPM</div>
                  <div className="flex items-center gap-2"><Target className="h-4 w-4" /> 97% ACC</div>
                </div>
                <p className="text-3xl font-mono leading-relaxed text-text-secondary text-left">
                  <span className="text-text-main">The quick brown fox</span> jumps over the lazy dog. Programming is the art of algorithm design.
                </p>
                <div className="w-1/2 h-1 bg-primary/20 rounded mt-8">
                  <div className="w-1/3 h-full bg-primary rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="pb-15 bg-bg relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-text-main mb-4">How TypeMind AI Works</h2>
            <p className="text-text-secondary text-lg">We analyze every keystroke to figure out exactly what's slowing you down.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface border border-border-color rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <Keyboard className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">1. Type</h3>
              <p className="text-text-secondary leading-relaxed">Take our baseline typing tests. Enjoy a clean, distraction-free environment that records your keystrokes with millisecond precision.</p>
            </div>

            <div className="bg-surface border border-border-color rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="h-14 w-14 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-500 mb-6">
                <Brain className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">2. Analyze</h3>
              <p className="text-text-secondary leading-relaxed">Our AI analyzes your performance, mapping out your finger efficiency, problematic keys, and rhythm breaks on a heat map.</p>
            </div>

            <div className="bg-surface border border-border-color rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="h-14 w-14 bg-success/10 rounded-xl flex items-center justify-center text-success mb-6">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">3. Improve</h3>
              <p className="text-text-secondary leading-relaxed">Get personalized practice sessions generated instantly to target your specific weaknesses, forcing rapid improvement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

