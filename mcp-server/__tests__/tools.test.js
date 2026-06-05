import { describe, it, expect } from 'vitest';
import { handler as generateHandler } from '../tools/generatePassphrase.js';
import { handler as generateMultiHandler } from '../tools/generateMultiplePassphrases.js';
import { handler as listHandler } from '../tools/listWordLists.js';
import { wordLists } from '../wordListManagerServer.js';

// ---------------------------------------------------------------------------
// generate_passphrase
// ---------------------------------------------------------------------------

describe('generate_passphrase', () => {
  it('generates a passphrase with default options', () => {
    const result = generateHandler({ word_count: 3 });
    const data = JSON.parse(result.content[0].text);
    expect(data.passphrase.split('-')).toHaveLength(3);
    expect(data.word_count).toBe(3);
    expect(data.word_list).toBe('medium');
    expect(typeof data.entropy_bits).toBe('number');
    expect(data.entropy_bits).toBeGreaterThan(0);
  });

  it('generates a passphrase from the small word list', () => {
    const result = generateHandler({ word_count: 2, word_list: 'small' });
    const data = JSON.parse(result.content[0].text);
    expect(data.passphrase.split('-')).toHaveLength(2);
    expect(data.word_list).toBe('small');
  });

  it('generates a passphrase from the large word list', () => {
    const result = generateHandler({ word_count: 2, word_list: 'large' });
    const data = JSON.parse(result.content[0].text);
    expect(data.word_list).toBe('large');
  });

  it('generates a passphrase with all options enabled', () => {
    const result = generateHandler({
      word_count: 4,
      word_list: 'small',
      use_numbers: true,
      use_symbols: true,
      use_capitals: true,
    });
    const { passphrase } = JSON.parse(result.content[0].text);
    expect(passphrase.split('-')).toHaveLength(4);
  });

  it('calculates plausible entropy for a 4-word medium-list passphrase', () => {
    const result = generateHandler({ word_count: 4, word_list: 'medium' });
    const { entropy_bits } = JSON.parse(result.content[0].text);
    // medium list ~5500 words, 4 words without replacement ≈ 49 bits
    expect(entropy_bits).toBeGreaterThan(30);
    expect(entropy_bits).toBeLessThan(100);
  });

  it('throws for word_count below minimum', () => {
    expect(() => generateHandler({ word_count: 1 })).toThrow('word_count must be an integer between 2 and 6');
  });

  it('throws for word_count above maximum', () => {
    expect(() => generateHandler({ word_count: 7 })).toThrow('word_count must be an integer between 2 and 6');
  });

  it('throws for non-integer word_count', () => {
    expect(() => generateHandler({ word_count: 3.5 })).toThrow('word_count must be an integer between 2 and 6');
  });

  it('throws for invalid word_list', () => {
    expect(() => generateHandler({ word_count: 3, word_list: 'huge' })).toThrow(
      'word_list must be one of: small, medium, large'
    );
  });
});

// ---------------------------------------------------------------------------
// generate_multiple_passphrases
// ---------------------------------------------------------------------------

describe('generate_multiple_passphrases', () => {
  it('generates the requested number of passphrases', () => {
    const result = generateMultiHandler({ count: 5, word_count: 3 });
    const { passphrases, settings } = JSON.parse(result.content[0].text);
    expect(passphrases).toHaveLength(5);
    expect(settings.word_count).toBe(3);
    expect(settings.word_list).toBe('medium');
  });

  it('generates a single passphrase when count is 1', () => {
    const result = generateMultiHandler({ count: 1, word_count: 2 });
    const { passphrases } = JSON.parse(result.content[0].text);
    expect(passphrases).toHaveLength(1);
  });

  it('generates up to 10 passphrases', () => {
    const result = generateMultiHandler({ count: 10, word_count: 2 });
    const { passphrases } = JSON.parse(result.content[0].text);
    expect(passphrases).toHaveLength(10);
  });

  it('throws for count above 10', () => {
    expect(() => generateMultiHandler({ count: 11, word_count: 3 })).toThrow(
      'count must be an integer between 1 and 10'
    );
  });

  it('throws for count below 1', () => {
    expect(() => generateMultiHandler({ count: 0, word_count: 3 })).toThrow(
      'count must be an integer between 1 and 10'
    );
  });

  it('throws for invalid word_count', () => {
    expect(() => generateMultiHandler({ count: 3, word_count: 8 })).toThrow(
      'word_count must be an integer between 2 and 6'
    );
  });
});

// ---------------------------------------------------------------------------
// list_word_lists
// ---------------------------------------------------------------------------

describe('list_word_lists', () => {
  it('returns all three word lists', () => {
    const result = listHandler();
    const { word_lists } = JSON.parse(result.content[0].text);
    expect(word_lists).toHaveLength(3);
    expect(word_lists.map(l => l.id)).toEqual(['small', 'medium', 'large']);
  });

  it('includes a positive word_count for each list', () => {
    const result = listHandler();
    const { word_lists } = JSON.parse(result.content[0].text);
    for (const list of word_lists) {
      expect(list.word_count).toBeGreaterThan(0);
      expect(typeof list.description).toBe('string');
    }
  });

  it('word_counts match the loaded lists', () => {
    const result = listHandler();
    const { word_lists } = JSON.parse(result.content[0].text);
    for (const { id, word_count } of word_lists) {
      expect(word_count).toBe(wordLists[id].length);
    }
  });
});
