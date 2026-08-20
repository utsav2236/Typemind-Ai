// tests/wordAnalysis.test.js

import {
  analyzeWordPerformance,
  getWeakWords,
  mergeWordPerformance,
} from '../services/wordAnalysisService.js';

describe('analyzeWordPerformance', () => {
  const makeKS = (key, expected, correct, rt) => ({ key, expectedKey: expected, correct, responseTime: rt });

  test('correctly identifies a correctly typed word', () => {
    const text = 'hello';
    const keystrokes = [
      makeKS('h','h',true,100), makeKS('e','e',true,100), makeKS('l','l',true,100),
      makeKS('l','l',true,100), makeKS('o','o',true,100),
    ];
    const result = analyzeWordPerformance(keystrokes, text);
    expect(result['hello']).toBeDefined();
    expect(result['hello'].correct).toBe(1);
    expect(result['hello'].accuracy).toBe(100);
  });

  test('correctly identifies an incorrectly typed word', () => {
    const text = 'hello';
    const keystrokes = [
      makeKS('h','h',true,100), makeKS('x','e',false,100), makeKS('l','l',true,100),
      makeKS('l','l',true,100), makeKS('o','o',true,100),
    ];
    const result = analyzeWordPerformance(keystrokes, text);
    expect(result['hello'].correct).toBe(0);
    expect(result['hello'].incorrect).toBe(1);
  });

  test('handles multiple occurrences of the same word', () => {
    const text = 'the the';
    const keystrokes = [
      makeKS('t','t',true,100), makeKS('h','h',true,100), makeKS('e','e',true,100),
      makeKS(' ',' ',true, 80),
      makeKS('t','t',true,100), makeKS('h','h',true,100), makeKS('x','e',false,150),
    ];
    const result = analyzeWordPerformance(keystrokes, text);
    expect(result['the'].attempts).toBe(2);
    expect(result['the'].correct).toBe(1);
    expect(result['the'].incorrect).toBe(1);
  });

  test('handles empty keystrokes', () => {
    const result = analyzeWordPerformance([], 'hello world');
    expect(Object.keys(result).length).toBe(0);
  });

  test('filters out backspace keystrokes', () => {
    const text = 'hi';
    const keystrokes = [
      makeKS('Backspace','Backspace',true,100),
      makeKS('h','h',true,100),
      makeKS('i','i',true,100),
    ];
    const result = analyzeWordPerformance(keystrokes, text);
    // Should still correctly process 'hi'
    expect(result['hi']).toBeDefined();
  });

  test('calculates average completion time', () => {
    const text = 'hi';
    const keystrokes = [
      makeKS('h','h',true,100),
      makeKS('i','i',true,200),
    ];
    const result = analyzeWordPerformance(keystrokes, text);
    expect(result['hi'].averageCompletionTime).toBe(300);
  });
});

describe('getWeakWords', () => {
  const makeWP = (word, attempts, correct, avgTime) => ({
    [word]: {
      word,
      attempts,
      correct,
      incorrect: attempts - correct,
      accuracy: Math.round((correct / attempts) * 100),
      averageCompletionTime: avgTime,
    },
  });

  test('identifies low accuracy word as weak', () => {
    const wp = makeWP('professional', 5, 2, 1500); // 40% accuracy
    const weak = getWeakWords(wp);
    expect(weak.length).toBeGreaterThan(0);
    expect(weak[0].word).toBe('professional');
  });

  test('does NOT flag word with fewer than MIN_ATTEMPTS', () => {
    const wp = makeWP('professional', 1, 0, 1500);
    const weak = getWeakWords(wp);
    expect(weak.length).toBe(0);
  });

  test('does NOT flag high accuracy word', () => {
    const wp = makeWP('the', 10, 10, 200);
    const weak = getWeakWords(wp);
    expect(weak.length).toBe(0);
  });

  test('sorts by accuracy ascending', () => {
    const wp = {
      ...makeWP('professional', 5, 1, 1500), // 20%
      ...makeWP('application',  5, 3, 1200), // 60%
    };
    const weak = getWeakWords(wp);
    if (weak.length >= 2) {
      expect(weak[0].accuracy).toBeLessThanOrEqual(weak[1].accuracy);
    }
  });
});

describe('mergeWordPerformance', () => {
  test('merges word stats from two sessions', () => {
    const existing = [{ word: 'hello', attempts: 3, correct: 2, incorrect: 1, accuracy: 66.67, averageCompletionTime: 300, lastSeen: new Date() }];
    const newSession = { hello: { word: 'hello', attempts: 2, correct: 2, incorrect: 0, accuracy: 100, averageCompletionTime: 250 } };
    const merged = mergeWordPerformance(existing, newSession);
    const hello = merged.find((w) => w.word === 'hello');
    expect(hello.attempts).toBe(5);
    expect(hello.correct).toBe(4);
    expect(hello.accuracy).toBe(80);
  });

  test('adds new words from session', () => {
    const existing = [];
    const newSession = { world: { word: 'world', attempts: 2, correct: 2, incorrect: 0, accuracy: 100, averageCompletionTime: 400 } };
    const merged = mergeWordPerformance(existing, newSession);
    expect(merged.find((w) => w.word === 'world')).toBeDefined();
  });
});
