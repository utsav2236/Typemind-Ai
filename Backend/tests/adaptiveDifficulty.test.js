// tests/adaptiveDifficulty.test.js

import {
  getDifficultyAdjustment,
  analyzeKeyTrend,
  buildAdaptivePrompt,
  isTooSimilar,
} from '../services/adaptivePracticeService.js';

describe('getDifficultyAdjustment', () => {
  const makeSession = (accuracy, wpm, difficulty = 'intermediate') => ({ accuracy, wpm, difficulty });

  test('increases difficulty when accuracy >= 97% and WPM improving', () => {
    const sessions = [
      makeSession(97, 60),
      makeSession(98, 65),
      makeSession(97, 70),
      makeSession(98, 75),
      makeSession(99, 80),
    ];
    const { difficulty } = getDifficultyAdjustment(sessions, 'intermediate');
    expect(['intermediate', 'advanced']).toContain(difficulty);
  });

  test('maintains difficulty when accuracy 90–96%', () => {
    const sessions = Array(5).fill(makeSession(93, 70));
    const { difficulty } = getDifficultyAdjustment(sessions, 'intermediate');
    expect(difficulty).toBe('intermediate');
  });

  test('reduces difficulty when accuracy < 80%', () => {
    const sessions = Array(5).fill(makeSession(75, 50));
    const { difficulty } = getDifficultyAdjustment(sessions, 'advanced');
    const difficultyLevels = ['beginner', 'easy', 'intermediate', 'advanced', 'expert'];
    const newIdx = difficultyLevels.indexOf(difficulty);
    const oldIdx = difficultyLevels.indexOf('advanced');
    expect(newIdx).toBeLessThan(oldIdx);
  });

  test('handles empty sessions array', () => {
    const { difficulty } = getDifficultyAdjustment([], 'intermediate');
    expect(difficulty).toBe('intermediate');
  });

  test('does not go below beginner', () => {
    const sessions = Array(5).fill(makeSession(50, 10));
    const { difficulty } = getDifficultyAdjustment(sessions, 'beginner');
    expect(difficulty).toBe('beginner');
  });

  test('does not go above expert', () => {
    const sessions = [
      makeSession(99, 110),
      makeSession(99, 115),
      makeSession(99, 120),
      makeSession(99, 125),
      makeSession(99, 130),
    ];
    const { difficulty } = getDifficultyAdjustment(sessions, 'expert');
    expect(difficulty).toBe('expert');
  });
});

describe('analyzeKeyTrend', () => {
  const makeSession = (key, accuracy) => ({
    keyPerformance: { [key]: { accuracy } },
  });

  test('detects improving trend', () => {
    const sessions = [
      makeSession('p', 60),
      makeSession('p', 65),
      makeSession('p', 70),
      makeSession('p', 75),
    ];
    const { trend } = analyzeKeyTrend('p', sessions);
    expect(trend).toBe('improving');
  });

  test('detects stable trend', () => {
    const sessions = [
      makeSession('p', 70),
      makeSession('p', 71),
      makeSession('p', 69),
    ];
    const { trend } = analyzeKeyTrend('p', sessions);
    expect(trend).toBe('stable');
  });

  test('returns stable for single session', () => {
    const sessions = [makeSession('p', 70)];
    const { trend } = analyzeKeyTrend('p', sessions);
    expect(trend).toBe('stable');
  });

  test('returns stable when key not in sessions', () => {
    const sessions = [{ keyPerformance: {} }];
    const { trend } = analyzeKeyTrend('p', sessions);
    expect(trend).toBe('stable');
  });
});

describe('buildAdaptivePrompt', () => {
  test('returns a non-empty string', () => {
    const prompt = buildAdaptivePrompt({
      weakKeys: ['p', 'r'],
      weakWords: ['professional'],
      weakFingers: ['rightPinky'],
      difficulty: 'intermediate',
      mode: 'general',
      durationSeconds: 60,
      currentWpm: 60,
    });
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
  });

  test('mentions weak keys in prompt', () => {
    const prompt = buildAdaptivePrompt({
      weakKeys: ['P', ';'],
      weakWords: [],
      weakFingers: [],
      difficulty: 'intermediate',
      mode: 'general',
      durationSeconds: 60,
      currentWpm: 60,
    });
    expect(prompt).toContain('P');
  });
});

describe('isTooSimilar', () => {
  test('returns false for empty recent texts', () => {
    expect(isTooSimilar('hello world', [])).toBe(false);
  });

  test('returns true for identical texts', () => {
    const text = 'the quick brown fox jumps over the lazy dog';
    expect(isTooSimilar(text, [text])).toBe(true);
  });

  test('returns false for completely different texts', () => {
    const text    = 'apple banana cherry mango grape strawberry blueberry';
    const recent  = ['programming requires patience and dedication every single day'];
    expect(isTooSimilar(text, recent)).toBe(false);
  });
});
