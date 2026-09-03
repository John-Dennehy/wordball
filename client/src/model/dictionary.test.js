import { describe, it, expect } from 'vitest';
import { isValidWord, calculateWordScore, findPossibleWords } from './dictionary.js';

describe('Dictionary Engine', () => {
  it('validates common English words', () => {
    expect(isValidWord('cat')).toBe(true);
    expect(isValidWord('BALL')).toBe(true);
    expect(isValidWord('pizza')).toBe(true);
    expect(isValidWord('EXTREME')).toBe(true);
  });

  it('rejects short words or gibberish', () => {
    expect(isValidWord('a')).toBe(false);
    expect(isValidWord('to')).toBe(false);
    expect(isValidWord('zxqjvk')).toBe(false);
    expect(isValidWord('')).toBe(false);
    expect(isValidWord(null)).toBe(false);
  });

  it('calculates word scores with length multipliers', () => {
    // 'cat' length 3 -> multiplier 1
    const catScore = calculateWordScore('cat');
    expect(catScore.multiplier).toBe(1);
    expect(catScore.totalScore).toBeGreaterThan(0);

    // 'ball' length 4 -> multiplier 1.5
    const ballScore = calculateWordScore('ball');
    expect(ballScore.multiplier).toBe(1.5);

    // 'pizza' length 5 -> multiplier 2.0
    const pizzaScore = calculateWordScore('pizza');
    expect(pizzaScore.multiplier).toBe(2.0);
  });

  it('solves possible anagram words from banked letters', () => {
    const letters = ['P', 'I', 'Z', 'Z', 'A', 'R', 'E', 'A'];
    const possible = findPossibleWords(letters);

    expect(possible).toContain('PIZZA');
    expect(possible).toContain('AREA');
    expect(possible).toContain('AIR');
    // Ensure all returned words are uppercase and length >= 3
    for (const word of possible.slice(0, 10)) {
      expect(word.length).toBeGreaterThanOrEqual(3);
      expect(word).toBe(word.toUpperCase());
    }
  });
});
