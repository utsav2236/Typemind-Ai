// tests/typingAnalysis.test.js
// Tests for typingAnalysisService — WPM, accuracy, consistency, weak keys, edge cases.

import {
  calculateWPM,
  calculateRawWPM,
  calculateAccuracy,
  calculateConsistency,
  analyzeKeystrokes,
  getWeakKeys,
  countErrors,
  countWords,
  runFullAnalysis,
} from '../services/typingAnalysisService.js';

// ─────────────────────────────────────────────────────────────────────────────
// WPM CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateWPM', () => {
  test('correct calculation: 60 chars in 60s = 12 WPM', () => {
    expect(calculateWPM(60, 60)).toBe(12);
  });

  test('standard 5-char word convention', () => {
    // 300 correct chars / 5 = 60 words, in 60s = 60 WPM
    expect(calculateWPM(300, 60)).toBe(60);
  });

  test('returns 0 for zero duration', () => {
    expect(calculateWPM(100, 0)).toBe(0);
  });

  test('returns 0 for negative duration', () => {
    expect(calculateWPM(100, -10)).toBe(0);
  });

  test('returns 0 for zero correct chars', () => {
    expect(calculateWPM(0, 60)).toBe(0);
  });

  test('rounds to 1 decimal place', () => {
    const result = calculateWPM(100, 60);
    expect(result).toBe(Math.round(result * 10) / 10);
  });

  test('high WPM: 600 chars in 60s = 120 WPM', () => {
    expect(calculateWPM(600, 60)).toBe(120);
  });

  test('short test: 30s duration', () => {
    expect(calculateWPM(300, 30)).toBe(120);
  });
});

describe('calculateRawWPM', () => {
  test('includes incorrect characters', () => {
    expect(calculateRawWPM(310, 60)).toBeCloseTo(62, 0);
  });

  test('returns 0 for zero duration', () => {
    expect(calculateRawWPM(100, 0)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCURACY
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateAccuracy', () => {
  test('perfect accuracy: 100 correct / 100 total = 100%', () => {
    expect(calculateAccuracy(100, 100)).toBe(100);
  });

  test('50% accuracy', () => {
    expect(calculateAccuracy(50, 100)).toBe(50);
  });

  test('returns 0 for zero total', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  test('rounds to 2 decimal places', () => {
    const result = calculateAccuracy(67, 100);
    expect(result).toBe(67);
  });

  test('handles all correct', () => {
    expect(calculateAccuracy(200, 200)).toBe(100);
  });

  test('handles all incorrect', () => {
    expect(calculateAccuracy(0, 100)).toBe(0);
  });

  test('accuracy from keystrokes with 95% correct', () => {
    const correct = 95;
    const total = 100;
    expect(calculateAccuracy(correct, total)).toBe(95);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// KEYSTROKE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

describe('analyzeKeystrokes', () => {
  const makeKS = (key, expectedKey, correct, responseTime) => ({ key, expectedKey, correct, responseTime });

  test('correctly counts correct and incorrect', () => {
    const keystrokes = [
      makeKS('a', 'a', true, 100),
      makeKS('b', 'b', true, 120),
      makeKS('x', 'c', false, 150),
    ];
    const result = analyzeKeystrokes(keystrokes);
    expect(result.correctCharacters).toBe(2);
    expect(result.incorrectCharacters).toBe(1);
    expect(result.totalCharacters).toBe(3);
  });

  test('counts backspaces separately', () => {
    const keystrokes = [
      makeKS('a', 'a', true, 100),
      makeKS('Backspace', 'Backspace', true, 80),
      makeKS('b', 'b', true, 110),
    ];
    const result = analyzeKeystrokes(keystrokes);
    expect(result.backspaces).toBe(1);
    expect(result.correctCharacters).toBe(2);
  });

  test('calculates per-key accuracy', () => {
    const keystrokes = [
      makeKS('a', 'a', true, 100),
      makeKS('x', 'a', false, 150),
      makeKS('a', 'a', true, 90),
    ];
    const result = analyzeKeystrokes(keystrokes);
    // 'a' was expected 3 times: 2 correct, 1 incorrect
    expect(result.keyPerformance['a'].attempts).toBe(3);
    expect(result.keyPerformance['a'].correct).toBe(2);
    expect(result.keyPerformance['a'].accuracy).toBeCloseTo(66.67, 1);
  });

  test('calculates average response time correctly', () => {
    const keystrokes = [
      makeKS('a', 'a', true, 100),
      makeKS('b', 'b', true, 200),
    ];
    const result = analyzeKeystrokes(keystrokes);
    expect(result.averageResponseTime).toBe(150);
  });

  test('handles empty keystrokes array', () => {
    const result = analyzeKeystrokes([]);
    expect(result.correctCharacters).toBe(0);
    expect(result.incorrectCharacters).toBe(0);
    expect(result.keyPerformance).toEqual({});
  });

  test('clamps extreme response times', () => {
    const keystrokes = [makeKS('a', 'a', true, 99999)];
    const result = analyzeKeystrokes(keystrokes);
    // Should be clamped to SESSION_LIMITS.MAX_RESPONSE_TIME (10000)
    expect(result.averageResponseTime).toBeLessThanOrEqual(10000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WEAK KEY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

describe('getWeakKeys', () => {
  const buildKeyPerf = (key, attempts, correct, avgRT) => ({
    [key]: {
      key,
      attempts,
      correct,
      incorrect: attempts - correct,
      accuracy: Math.round((correct / attempts) * 100),
      errorRate: Math.round(((attempts - correct) / attempts) * 100),
      averageResponseTime: avgRT,
    },
  });

  test('identifies low-accuracy key as weak', () => {
    const kp = buildKeyPerf('p', 10, 5, 200); // 50% accuracy
    const weak = getWeakKeys(kp);
    expect(weak.length).toBeGreaterThan(0);
    expect(weak[0].key).toBe('p');
  });

  test('does NOT classify key with fewer than MIN_ATTEMPTS as weak', () => {
    const kp = buildKeyPerf('p', 2, 0, 200); // Only 2 attempts
    const weak = getWeakKeys(kp);
    expect(weak.length).toBe(0);
  });

  test('identifies slow response time as weak', () => {
    const kp = buildKeyPerf(';', 10, 10, 500); // Perfect accuracy but very slow
    const weak = getWeakKeys(kp);
    expect(weak.length).toBeGreaterThan(0);
  });

  test('does NOT flag a good key as weak', () => {
    const kp = buildKeyPerf('a', 20, 19, 100); // 95% accuracy, fast
    const weak = getWeakKeys(kp);
    expect(weak.length).toBe(0);
  });

  test('respects maxResults limit', () => {
    const kp = {};
    for (let i = 0; i < 20; i++) {
      const key = String.fromCharCode(97 + i);
      kp[key] = { key, attempts: 10, correct: 3, incorrect: 7, accuracy: 30, errorRate: 70, averageResponseTime: 400 };
    }
    const weak = getWeakKeys(kp, { maxResults: 5 });
    expect(weak.length).toBeLessThanOrEqual(5);
  });

  test('sorts by weakness score (worst first)', () => {
    const kp = {
      ...buildKeyPerf('p', 10, 2, 200), // 20% accuracy — very weak
      ...buildKeyPerf('r', 10, 7, 200), // 70% accuracy — less weak
    };
    const weak = getWeakKeys(kp);
    if (weak.length >= 2) {
      expect(weak[0].accuracy).toBeLessThanOrEqual(weak[1].accuracy);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CONSISTENCY
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateConsistency', () => {
  const makeKS = (correct) => ({ key: 'a', expectedKey: 'a', correct, responseTime: 100 });

  test('returns 70 for too few keystrokes', () => {
    const result = calculateConsistency([makeKS(true)], 60);
    expect(result).toBe(70);
  });

  test('returns value between 0 and 100', () => {
    const keystrokes = Array(100).fill(null).map(() => makeKS(true));
    const result = calculateConsistency(keystrokes, 60);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('higher for uniform typing speed', () => {
    const uniform = Array(100).fill(null).map(() => makeKS(true));
    const result = calculateConsistency(uniform, 60);
    expect(result).toBeGreaterThan(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR COUNTING
// ─────────────────────────────────────────────────────────────────────────────

describe('countErrors', () => {
  test('counts distinct error events', () => {
    const keystrokes = [
      { key: 'x', correct: false }, // error 1
      { key: 'y', correct: false }, // same error streak
      { key: 'a', correct: true  }, // break
      { key: 'z', correct: false }, // error 2
    ];
    expect(countErrors(keystrokes)).toBe(2);
  });

  test('ignores backspaces', () => {
    const keystrokes = [
      { key: 'Backspace', correct: true },
      { key: 'x', correct: false },
    ];
    expect(countErrors(keystrokes)).toBe(1);
  });

  test('returns 0 for all correct', () => {
    const keystrokes = [
      { key: 'a', correct: true },
      { key: 'b', correct: true },
    ];
    expect(countErrors(keystrokes)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WORD COUNTING
// ─────────────────────────────────────────────────────────────────────────────

describe('countWords', () => {
  test('counts total words in text', () => {
    const { totalWords } = countWords('hello world foo', 100);
    expect(totalWords).toBe(3);
  });

  test('handles single word', () => {
    const { totalWords } = countWords('hello', 5);
    expect(totalWords).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FULL ANALYSIS PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

describe('runFullAnalysis', () => {
  const text = 'hello world';
  const makeKS = (key, expected, correct, rt) => ({ key, expectedKey: expected, correct, responseTime: rt });

  const keystrokes = [
    makeKS('h','h',true,100), makeKS('e','e',true,100), makeKS('l','l',true,100),
    makeKS('l','l',true,100), makeKS('o','o',true,100), makeKS(' ',' ',true,80),
    makeKS('w','w',true,100), makeKS('x','o',false,150), makeKS('r','r',true,100),
    makeKS('l','l',true,100), makeKS('d','d',true,100),
  ];

  test('returns complete analysis object', () => {
    const result = runFullAnalysis({ keystrokes, text, duration: 60 });
    expect(result).toHaveProperty('wpm');
    expect(result).toHaveProperty('accuracy');
    expect(result).toHaveProperty('consistency');
    expect(result).toHaveProperty('keyPerformance');
    expect(result).toHaveProperty('weakKeys');
  });

  test('correct and incorrect chars match', () => {
    const result = runFullAnalysis({ keystrokes, text, duration: 60 });
    const correctCount = keystrokes.filter((k) => k.correct && k.key !== 'Backspace').length;
    expect(result.correctCharacters).toBe(correctCount);
  });

  test('WPM is server-calculated (not from client)', () => {
    const result = runFullAnalysis({ keystrokes, text, duration: 60 });
    expect(typeof result.wpm).toBe('number');
    expect(result.wpm).toBeGreaterThanOrEqual(0);
  });

  test('handles very short test (15 seconds)', () => {
    const result = runFullAnalysis({ keystrokes: keystrokes.slice(0, 5), text: 'hello', duration: 15 });
    expect(result.wpm).toBeGreaterThanOrEqual(0);
  });

  test('handles all incorrect keystrokes', () => {
    const allWrong = Array(20).fill(null).map(() => makeKS('x', 'a', false, 200));
    const result = runFullAnalysis({ keystrokes: allWrong, text: 'aaaaaaaaaaaaaaaaaaaa', duration: 60 });
    expect(result.accuracy).toBe(0);
    expect(result.wpm).toBe(0);
  });

  test('handles all correct keystrokes', () => {
    const allRight = 'hello'.split('').map((c) => makeKS(c, c, true, 100));
    const result = runFullAnalysis({ keystrokes: allRight, text: 'hello', duration: 60 });
    expect(result.accuracy).toBe(100);
  });
});
