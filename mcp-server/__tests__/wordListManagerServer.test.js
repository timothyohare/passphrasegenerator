import { describe, it, expect } from 'vitest';
import { wordLists, loadWordList } from '../wordListManagerServer.js';

describe('wordLists', () => {
  it('loads all three word lists at startup', () => {
    expect(Array.isArray(wordLists.small)).toBe(true);
    expect(Array.isArray(wordLists.medium)).toBe(true);
    expect(Array.isArray(wordLists.large)).toBe(true);
    expect(wordLists.small.length).toBeGreaterThan(0);
    expect(wordLists.medium.length).toBeGreaterThan(0);
    expect(wordLists.large.length).toBeGreaterThan(0);
  });

  it('medium list is larger than small and large lists', () => {
    expect(wordLists.medium.length).toBeGreaterThan(wordLists.small.length);
    expect(wordLists.medium.length).toBeGreaterThan(wordLists.large.length);
  });

  it('all words in every list pass the validation pattern', () => {
    const pattern = /^[a-z]{2,20}$/;
    for (const [size, words] of Object.entries(wordLists)) {
      for (const word of words) {
        expect(pattern.test(word), `${size} list: "${word}" fails /^[a-z]{2,20}$/`).toBe(true);
      }
    }
  });

  it('returns the same array reference on repeated calls (cached)', () => {
    const first = loadWordList('medium');
    const second = loadWordList('medium');
    expect(first).toBe(second);
  });

  it('throws a clear error for an unknown word list size', () => {
    expect(() => loadWordList('unknown')).toThrow('Unknown word list size: unknown');
  });
});
