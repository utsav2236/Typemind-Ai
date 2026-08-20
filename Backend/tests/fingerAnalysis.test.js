// tests/fingerAnalysis.test.js

import {
  analyzeFingerPerformance,
  getWeakFingers,
  mergeFingerPerformance,
} from '../services/fingerAnalysisService.js';
import { getFingerForKey, ALL_FINGERS } from '../utils/keyMapping.js';

describe('getFingerForKey', () => {
  test('maps P to rightPinky', () => {
    expect(getFingerForKey('P')).toBe('rightPinky');
  });

  test('maps p (lowercase) to rightPinky', () => {
    expect(getFingerForKey('p')).toBe('rightPinky');
  });

  test('maps a to leftPinky', () => {
    expect(getFingerForKey('a')).toBe('leftPinky');
  });

  test('maps space to rightThumb', () => {
    expect(getFingerForKey(' ')).toBe('rightThumb');
  });

  test('maps Backspace to rightPinky', () => {
    expect(getFingerForKey('Backspace')).toBe('rightPinky');
  });

  test('returns unknown for unmapped keys', () => {
    expect(getFingerForKey('§')).toBe('unknown');
  });

  test('maps f to leftIndex', () => {
    expect(getFingerForKey('f')).toBe('leftIndex');
  });

  test('maps j to rightIndex', () => {
    expect(getFingerForKey('j')).toBe('rightIndex');
  });
});

describe('analyzeFingerPerformance', () => {
  const makeKP = (key, attempts, correct, avgRT) => ({
    [key]: { key, attempts, correct, incorrect: attempts - correct, accuracy: (correct / attempts) * 100, errorRate: 0, averageResponseTime: avgRT },
  });

  test('returns stats for all fingers', () => {
    const kp = { ...makeKP('a', 10, 9, 100) };
    const result = analyzeFingerPerformance(kp);
    for (const finger of ALL_FINGERS) {
      expect(result).toHaveProperty(finger);
    }
  });

  test('correctly aggregates finger accuracy', () => {
    // 'a' → leftPinky, 10 attempts, 8 correct → 80%
    const kp = { ...makeKP('a', 10, 8, 100) };
    const result = analyzeFingerPerformance(kp);
    expect(result.leftPinky.accuracy).toBeCloseTo(80, 0);
  });

  test('handles empty key performance', () => {
    const result = analyzeFingerPerformance({});
    for (const finger of ALL_FINGERS) {
      expect(result[finger].attempts).toBe(0);
    }
  });

  test('fingers with no data have null accuracy', () => {
    const result = analyzeFingerPerformance({});
    expect(result.leftPinky.accuracy).toBeNull();
  });
});

describe('getWeakFingers', () => {
  test('identifies low accuracy finger as weak', () => {
    const fp = {
      rightPinky: { accuracy: 60, averageResponseTime: 200, attempts: 20, correct: 12, incorrect: 8 },
      leftPinky:  { accuracy: 95, averageResponseTime: 100, attempts: 20, correct: 19, incorrect: 1 },
    };
    const weak = getWeakFingers(fp);
    expect(weak.some((f) => f.finger === 'rightPinky')).toBe(true);
    expect(weak.some((f) => f.finger === 'leftPinky')).toBe(false);
  });

  test('ignores fingers with no data', () => {
    const fp = { rightPinky: { accuracy: null, averageResponseTime: null, attempts: 0, correct: 0, incorrect: 0 } };
    const weak = getWeakFingers(fp);
    expect(weak.length).toBe(0);
  });

  test('sorts by accuracy ascending', () => {
    const fp = {
      rightPinky:  { accuracy: 50, averageResponseTime: 200, attempts: 10, correct: 5,  incorrect: 5 },
      rightRing:   { accuracy: 70, averageResponseTime: 200, attempts: 10, correct: 7,  incorrect: 3 },
      leftPinky:   { accuracy: 60, averageResponseTime: 200, attempts: 10, correct: 6,  incorrect: 4 },
    };
    const weak = getWeakFingers(fp);
    for (let i = 1; i < weak.length; i++) {
      expect(weak[i - 1].accuracy).toBeLessThanOrEqual(weak[i].accuracy);
    }
  });
});

describe('mergeFingerPerformance', () => {
  test('merges two sessions correctly', () => {
    const existing = {
      rightPinky: { attempts: 10, correct: 8, incorrect: 2, accuracy: 80, averageResponseTime: 200 },
    };
    const newSession = {
      rightPinky: { attempts: 10, correct: 6, incorrect: 4, accuracy: 60, averageResponseTime: 300 },
    };
    const merged = mergeFingerPerformance(existing, newSession);
    expect(merged.rightPinky.attempts).toBe(20);
    expect(merged.rightPinky.correct).toBe(14);
    expect(merged.rightPinky.accuracy).toBeCloseTo(70, 0);
    expect(merged.rightPinky.averageResponseTime).toBe(250);
  });
});
