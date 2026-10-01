import { describe, it, expect, vi, afterEach } from 'vitest';
import { generatePassphrase } from '../passphrase.js';
import { handler as single } from '../mcp-server/tools/generatePassphrase.js';
import { handler as multiple } from '../mcp-server/tools/generateMultiplePassphrases.js';

// Seed controls generated inputs, never production cryptographic randomness.
let seed = 20260927;
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
afterEach(() => vi.restoreAllMocks());
describe('bounded seeded security fuzz (seed 20260927)', () => {
  it('preserves word counts, membership, uniqueness and caller input across 400 cases', () => {
    for (let i = 0; i < 400; i++) {
      const words = Array.from({ length: 6 + next() % 40 }, (_, n) => `word${n}`);
      const before = [...words];
      const count = 2 + next() % 5;
      const result = generatePassphrase(words, count).split('-');
      expect(result).toHaveLength(count);
      expect(new Set(result).size).toBe(count);
      expect(result.every(w => words.includes(w))).toBe(true);
      expect(words).toEqual(before);
    }
  });
  it('rejects malformed sizes and list traversal/prototype names', () => {
    for (const value of [null, {}, [], true, false, '2', -1, 0, 1, 7, 1.5, NaN, Infinity]) {
      expect(() => single({ word_count: value })).toThrow();
    }
    for (const value of ['../words_alpha', '__proto__', 'constructor', '', null, {}, []]) {
      expect(() => single({ word_count: 2, word_list: value })).toThrow();
    }
    for (const count of [null, {}, [], true, '2', -1, 0, 11, 1.5, Infinity]) {
      expect(() => multiple({ count, word_count: 2 })).toThrow();
    }
  });
  it('rejects non-boolean option values rather than coercing them', () => {
    for (const field of ['use_numbers', 'use_symbols', 'use_capitals']) {
      for (const value of ['false', 'true', 0, 1, null, {}, []]) {
        for (const fn of [single, multiple]) {
          expect(() => fn({ count: 1, word_count: 2, [field]: value }), `${field}=${JSON.stringify(value)}`).toThrow();
        }
      }
    }
  });
  it('rejects the biased uint32 tail when selecting from three words', () => {
    const draws = [0xffffffff, 1, 0];
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(arr => {
      arr[0] = draws.shift() ?? 0;
      return arr;
    });
    expect(generatePassphrase(['aa', 'bb', 'cc'], 2)).toBe('bb-aa');
  });
});
