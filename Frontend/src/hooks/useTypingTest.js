import { useState, useEffect, useCallback, useRef } from 'react';
import { getPassage } from '../utils/passages';
import typingSoundService from '../services/typingSoundService';

const useTypingTest = (initialText, duration = 60, topic = 'random', difficulty = 'medium') => {
  const [text] = useState(() => initialText || getPassage(topic, duration, difficulty).text);
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    keystrokes: 0,
  });

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastKeystrokeTimeRef = useRef(null);
  
  // Collect detailed keystroke data for the backend
  const keystrokesRef = useRef([]);
  
  // Refs to avoid stale closures in handleKeyPress
  const typedRef = useRef(typed);
  const isStartedRef = useRef(isStarted);
  const isFinishedRef = useRef(isFinished);
  const textRef = useRef(text);

  // Keep refs in sync
  useEffect(() => { typedRef.current = typed; }, [typed]);
  useEffect(() => { isStartedRef.current = isStarted; }, [isStarted]);
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);
  useEffect(() => { textRef.current = text; }, [text]);

  const startTest = useCallback(() => {
    setIsStarted(true);
    setIsFinished(false);
    startTimeRef.current = new Date().toISOString();
    lastKeystrokeTimeRef.current = performance.now();
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTest = useCallback(() => {
    clearInterval(timerRef.current);
    setTyped('');
    setTimeLeft(duration);
    setIsStarted(false);
    setIsFinished(false);
    setStats({ wpm: 0, accuracy: 100, errors: 0, keystrokes: 0 });
    keystrokesRef.current = [];
    startTimeRef.current = null;
    lastKeystrokeTimeRef.current = null;
  }, [duration]);

  // Stable handleKeyPress that reads from refs instead of state
  const handleKeyPress = useCallback((e) => {
    if (isFinishedRef.current) return;

    const isControlKey = e.ctrlKey || e.altKey || e.metaKey;
    if (isControlKey) return;
    if (e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab' || e.key === 'Enter') return;

    if (!isStartedRef.current && e.key.length === 1) {
      startTest();
    }

    if (e.key === 'Backspace') {
      setTyped((prev) => prev.slice(0, -1));
      return;
    }

    if (typedRef.current.length >= textRef.current.length) return;

    if (e.key.length === 1) {
      const currentIndex = typedRef.current.length;
      const expectedKey = textRef.current[currentIndex];
      const isCorrect = e.key === expectedKey;
      
      // Play sound feedback
      if (isCorrect) {
        typingSoundService.playCorrect();
      } else {
        typingSoundService.playWrong();
      }
      
      // Calculate response time (ms since last keystroke or test start)
      const now = performance.now();
      const responseTime = lastKeystrokeTimeRef.current 
        ? Math.round(now - lastKeystrokeTimeRef.current)
        : 0;
      lastKeystrokeTimeRef.current = now;
      
      // Record keystroke for backend submission
      keystrokesRef.current.push({
        key: e.key,
        expectedKey: expectedKey,
        correct: isCorrect,
        responseTime: Math.min(Math.max(responseTime, 10), 10000), // Clamp to valid range
      });
      
      setTyped((prev) => prev + e.key);
      setStats((prevStats) => ({
        ...prevStats,
        keystrokes: prevStats.keystrokes + 1,
        errors: prevStats.errors + (isCorrect ? 0 : 1),
      }));
    }
  }, [startTest]);

  // Calculate WPM and Accuracy based on time and typed text
  useEffect(() => {
    if (isStarted && !isFinished) {
      const timeElapsed = duration - timeLeft;
      if (timeElapsed > 0) {
        let correctChars = 0;
        for (let i = 0; i < typed.length; i++) {
          if (typed[i] === text[i]) {
            correctChars++;
          }
        }
        
        const wpm = Math.round((correctChars / 5) / (timeElapsed / 60));
        const totalTyped = typed.length;
        const accuracy = totalTyped > 0 
          ? Math.round(((totalTyped - stats.errors) / totalTyped) * 100) 
          : 100;
          
        setStats(s => ({ ...s, wpm, accuracy: Math.max(0, accuracy) }));
      }
    }
  }, [typed, timeLeft, isStarted, isFinished, duration, text, stats.errors]);

  // Check if test completed by finishing the text
  useEffect(() => {
    if (typed.length === text.length && text.length > 0) {
      clearInterval(timerRef.current);
      setIsFinished(true);
    }
  }, [typed, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Build the session payload for backend submission
  const getSessionData = useCallback(() => {
    return {
      mode: 'general',
      difficulty: 'intermediate',
      duration: duration,
      text: textRef.current,
      keystrokes: keystrokesRef.current,
      startedAt: startTimeRef.current,
      completedAt: new Date().toISOString(),
    };
  }, [duration]);

  return {
    text,
    typed,
    timeLeft,
    isStarted,
    isFinished,
    stats,
    handleKeyPress,
    resetTest,
    getSessionData,
  };
};

export default useTypingTest;
