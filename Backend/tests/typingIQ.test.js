// tests/typingIQ.test.js

import { calculateTypingIQ, getIQLevel, calculateImprovementPercent } from '../services/typingIQService.js';

describe('calculateTypingIQ', () => {
  const goodTypist = {
    wpm: 80,
    accuracy: 96,
    consistency: 85,
    errorRate: 4,
    averageResponseTime: 150,
  };

  const poorTypist = {
    wpm: 20,
    accuracy: 70,
    consistency: 40,
    errorRate: 30,
    averageResponseTime: 500,
  };

  const expertTypist = {
    wpm: 120,
    accuracy: 99,
    consistency: 95,
    errorRate: 1,
    averageResponseTime: 80,
  };

  test('returns object with typingIQ and level', () => {
    const result = calculateTypingIQ(goodTypist);
    expect(result).toHaveProperty('typingIQ');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('breakdown');
  });

  test('typingIQ is a number between 0 and 150', () => {
    const result = calculateTypingIQ(goodTypist);
    expect(result.typingIQ).toBeGreaterThanOrEqual(0);
    expect(result.typingIQ).toBeLessThanOrEqual(150);
  });

  test('expert typist gets higher IQ than poor typist', () => {
    const expert = calculateTypingIQ(expertTypist);
    const poor   = calculateTypingIQ(poorTypist);
    expect(expert.typingIQ).toBeGreaterThan(poor.typingIQ);
  });

  test('expert typist level is Advanced or higher', () => {
    const { level } = calculateTypingIQ(expertTypist);
    const advancedLevels = ['Advanced', 'Expert', 'Master'];
    expect(advancedLevels).toContain(level);
  });

  test('poor typist level is Beginner or Elementary', () => {
    const { level } = calculateTypingIQ(poorTypist);
    const lowLevels = ['Beginner', 'Elementary', 'Intermediate'];
    expect(lowLevels).toContain(level);
  });

  test('improvement bonus increases IQ', () => {
    const base       = calculateTypingIQ(goodTypist, 0);
    const improved   = calculateTypingIQ(goodTypist, 10); // 10% improvement
    expect(improved.typingIQ).toBeGreaterThanOrEqual(base.typingIQ);
  });

  test('is deterministic (same input = same output)', () => {
    const r1 = calculateTypingIQ(goodTypist, 5);
    const r2 = calculateTypingIQ(goodTypist, 5);
    expect(r1.typingIQ).toBe(r2.typingIQ);
  });

  test('handles zero response time gracefully', () => {
    const data = { ...goodTypist, averageResponseTime: 0 };
    const result = calculateTypingIQ(data);
    expect(result.typingIQ).toBeGreaterThanOrEqual(0);
  });

  test('handles maximum WPM', () => {
    const data = { wpm: 200, accuracy: 99, consistency: 99, errorRate: 0, averageResponseTime: 50 };
    const result = calculateTypingIQ(data);
    expect(result.typingIQ).toBeLessThanOrEqual(150);
  });
});

describe('getIQLevel', () => {
  test('0 → Beginner', ()    => expect(getIQLevel(0)).toBe('Beginner'));
  test('59 → Beginner', ()   => expect(getIQLevel(59)).toBe('Beginner'));
  test('60 → Elementary', () => expect(getIQLevel(60)).toBe('Elementary'));
  test('75 → Intermediate',() => expect(getIQLevel(75)).toBe('Intermediate'));
  test('85 → Advanced', ()   => expect(getIQLevel(85)).toBe('Advanced'));
  test('95 → Expert', ()     => expect(getIQLevel(95)).toBe('Expert'));
  test('110 → Master', ()    => expect(getIQLevel(110)).toBe('Master'));
});

describe('calculateImprovementPercent', () => {
  test('positive improvement', () => {
    expect(calculateImprovementPercent(80, 60)).toBeCloseTo(33.33, 1);
  });

  test('no improvement', () => {
    expect(calculateImprovementPercent(60, 60)).toBe(0);
  });

  test('decline (negative)', () => {
    expect(calculateImprovementPercent(50, 60)).toBeCloseTo(-16.67, 1);
  });

  test('handles zero previous WPM', () => {
    expect(calculateImprovementPercent(60, 0)).toBe(0);
  });
});
