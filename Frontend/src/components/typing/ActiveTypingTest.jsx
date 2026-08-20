import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useTypingTest from '../../hooks/useTypingTest';
import typingService from '../../services/typingService';
import guestService from '../../services/guestService';
import { RotateCcw, Timer, Activity, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Character = React.memo(({ actual, expected, isCurrent, innerRef }) => {
  let className = "transition-colors duration-100 relative ";

  if (isCurrent) {
    // Current character: subtle caret, no pulsing background
    className += "text-text-main";
  } else if (actual === expected) {
    // Correct: subtle light color (not bright green)
    className += "text-primary/90";
  } else if (actual !== undefined) {
    // Wrong: clear red with underline
    className += "text-error underline decoration-error underline-offset-4 decoration-2";
  } else {
    // Untyped: muted
    className += "text-text-secondary/50";
  }

  return (
    <span ref={innerRef} className={className}>
      {isCurrent && (
        <span className="absolute -left-[1px] top-[0.1em] bottom-[0.1em] w-[2px] bg-primary animate-caret" />
      )}
      {expected}
    </span>
  );
});

const TypingTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { text: customText, duration: customDuration, topic: customTopic, difficulty: customDifficulty } = location.state || {};

  const {
    text,
    typed,
    timeLeft,
    isStarted,
    isFinished,
    stats,
    handleKeyPress,
    resetTest,
    getSessionData,
  } = useTypingTest(customText, customDuration, customTopic, customDifficulty);

  const containerRef = useRef(null);
  const activeCharRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Line-by-line auto-scroll: keeps current typing line near the top of the visible area
  useEffect(() => {
    if (activeCharRef.current && containerRef.current && isStarted) {
      const activeElement = activeCharRef.current;
      const container = containerRef.current;

      const charTop = activeElement.offsetTop;
      const lineHeight = activeElement.offsetHeight;

      // Keep the active line about 1 line-height from the top of the container
      const targetScroll = Math.max(0, charTop - lineHeight);
      const currentScroll = container.scrollTop;

      // Only scroll when the active character has moved to a new line
      if (Math.abs(targetScroll - currentScroll) > lineHeight * 0.5) {
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [typed.length, isStarted]);

  // When test finishes, submit to backend then navigate
  useEffect(() => {
    if (isFinished && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;

      const submitAndNavigate = async () => {
        try {
          const sessionData = getSessionData();

          if (location.state?.isGuest) {
            const result = await guestService.submitGuestResult({
              testId: location.state.testId,
              duration: sessionData.duration,
              keystrokes: sessionData.keystrokes,
              text: sessionData.text,
              timeTaken: sessionData.timeTaken || sessionData.duration
            });

            navigate('/results/guest', {
              state: {
                stats,
                result: result.result
              }
            });
          } else {
            const result = await typingService.submitSession(sessionData);

            navigate('/results/latest', {
              state: {
                stats,
                session: result.session,
                userStats: result.userStats,
                newAchievements: result.newAchievements,
              }
            });
          }
        } catch (err) {
          console.error('Failed to submit session:', err);
          toast.error('Failed to save results. Showing local data.');

          const fallbackRoute = location.state?.isGuest
            ? '/results/guest'
            : '/results/latest';

          navigate(fallbackRoute, { state: { stats } });
        }
      };

      submitAndNavigate();
    }
  }, [isFinished, navigate, stats, getSessionData]);

  // Determine the mode label dynamically
  const getModeLabel = () => {
    if (location.state?.isGuest) {
      const topic = customTopic || 'random';
      const topicLabels = {
        random: '🎲 Speed Test',
        programming: '💻 Programming',
        travel: '✈️ Travel',
        education: '📚 Education',
        science: '🔬 Science',
        general: '📝 General',
      };
      return topicLabels[topic] || '⚡ Speed Test';
    }
    return '◆ AI Adaptive Practice';
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full">

      {/* ─── Compact Status Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full border-b border-border-color/40"
      >
        <div className="w-full max-w-[1500px] mx-auto flex flex-wrap items-center justify-between px-4 md:px-8 py-3">
          {/* Mode Label */}
          <span className="text-sm font-medium text-primary tracking-wide">
            {getModeLabel()}
          </span>

          {/* Metrics */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Timer */}
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Timer className="h-3.5 w-3.5" />
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  timeLeft <= 10
                    ? 'text-error animate-pulse'
                    : 'text-text-main'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="w-px h-4 bg-border-color/40" />

            {/* WPM */}
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Activity className="h-3.5 w-3.5" />
              <span className="font-mono text-sm font-semibold tabular-nums text-text-main">
                {stats.wpm}
              </span>
              <span className="text-xs text-text-secondary hidden sm:inline">WPM</span>
            </div>

            <div className="w-px h-4 bg-border-color/40" />

            {/* Accuracy */}
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Target className="h-3.5 w-3.5" />
              <span className="font-mono text-sm font-semibold tabular-nums text-text-main">
                {stats.accuracy}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Typing Workspace ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 md:px-8 py-4 md:py-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-[1500px] mx-auto relative"
        >
          {/* Overlay when finished */}
          {isFinished && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-bg/80 backdrop-blur-sm">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text-main">
                  Test Complete
                </h2>
                <p className="mt-2 text-text-secondary text-lg">
                  Analyzing your performance...
                </p>
              </div>
            </div>
          )}

          {/* Subtle "Type to start" pill */}
          {!isStarted && !isFinished && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-surface/80 border border-border-color/30 text-xs font-semibold uppercase tracking-widest text-text-secondary/70 backdrop-blur-sm">
                Type to start
              </span>
            </div>
          )}

          {/* The Typing Canvas */}
          <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={(e) => {
              // Prevent Space from scrolling the page
              e.preventDefault();

              // Send the keyboard event to the typing test hook
              handleKeyPress(e);
            }}
            className="relative rounded-2xl bg-surface/60 dark:bg-surface/60 p-6 sm:p-8 md:p-10 lg:p-12 h-[55vh] md:h-[60vh] overflow-y-auto ring-1 ring-border-color/20 transition-all duration-300 focus:ring-primary/30 focus:outline-none typing-workspace-scrollbar"
          >
            <div
              className={`font-mono select-none text-left transition-all duration-300 ${isFinished ? 'opacity-30' : ''} ${!isStarted && !isFinished ? 'blur-[0.5px] opacity-70' : ''}`}
              style={{
                fontSize: 'clamp(28px, 1.5vw, 28px)',
                lineHeight: '1.85',
                letterSpacing: '0.05em',
                fontWeight: '600',
                wordBreak: 'break-word',
              }}
            >
              {text.split('').map((char, index) => (
                <Character
                  key={index}
                  actual={typed[index]}
                  expected={char}
                  isCurrent={index === typed.length}
                  innerRef={index === typed.length ? activeCharRef : null}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── Restart Control ─── */}
        <div className="mt-4 md:mt-6 flex justify-center">
          <button
            onClick={() => {
              hasSubmittedRef.current = false;
              resetTest();
              containerRef.current?.focus();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-text-secondary/60 hover:text-text-main hover:bg-surface/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 group"
          >
            <RotateCcw className="h-3.5 w-3.5 group-hover:-rotate-90 transition-transform duration-300" />
            <span>Restart Test</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default TypingTest;
