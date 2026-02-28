import { describe, test, expect, vi, afterEach } from 'vitest';
import { generatePassphrase, replaceCharacters } from './passphrase.js';

// Every word in this list has at least one symbol-substitutable char
// (a->@, s->$, i->!, o->*) and at least one number-substitutable char
// (l->1, e->3, a->4, s->5, b->6, t->7, g->9)
const testWordList = [
    'apple', 'blast', 'stone', 'glide', 'solid',
    'aside', 'slice', 'alien', 'oasis', 'globe'
];

describe('replaceCharacters', () => {
    test('returns word unchanged when no options are enabled', () => {
        expect(replaceCharacters('apple', false, false, false)).toBe('apple');
    });

    test('substitutes at most one number per word', () => {
        const result = replaceCharacters('blast', true, false, false);
        const digits = result.split('').filter(c => /\d/.test(c));
        expect(digits.length).toBe(1);
    });

    test('substitutes at most one symbol per word', () => {
        const result = replaceCharacters('blast', false, true, false);
        const symbols = result.split('').filter(c => ['@', '$', '!', '*'].includes(c));
        expect(symbols.length).toBe(1);
    });

    test('capitalises exactly one letter per word', () => {
        const result = replaceCharacters('apple', false, false, true);
        const capitals = result.split('').filter(c => c >= 'A' && c <= 'Z');
        expect(capitals.length).toBe(1);
    });

    test('symbols take priority over numbers for the same character', () => {
        // 'a' maps to both '@' (symbol) and '4' (number); symbol wins
        const result = replaceCharacters('apple', true, true, false);
        expect(result).toContain('@');
    });

    test('applies both a symbol and a number when both options are enabled', () => {
        // 'blast': 'b'->6 (number, no symbol match), then 'a'->@ (symbol)
        const result = replaceCharacters('blast', true, true, false);
        const hasSymbol = ['@', '$', '!', '*'].some(s => result.includes(s));
        const hasNumber = /\d/.test(result);
        expect(hasSymbol).toBe(true);
        expect(hasNumber).toBe(true);
    });

    test('capitalises only among remaining alphabetic characters after substitution', () => {
        // '@' from symbol substitution is not alphabetic and cannot be capitalised
        const result = replaceCharacters('apple', false, true, true);
        const capitals = result.split('').filter(c => c >= 'A' && c <= 'Z');
        expect(capitals.length).toBe(1);
    });

    test('applies number, symbol, and capital when all options are enabled', () => {
        const result = replaceCharacters('blast', true, true, true);
        expect(['@', '$', '!', '*'].some(s => result.includes(s))).toBe(true);
        expect(result).toMatch(/\d/);
        expect(result).toMatch(/[A-Z]/);
    });
});

describe('secure randomness', () => {
    afterEach(() => vi.restoreAllMocks());

    test('generatePassphrase uses crypto.getRandomValues, not Math.random', () => {
        const mathSpy = vi.spyOn(Math, 'random');
        const cryptoSpy = vi.spyOn(globalThis.crypto, 'getRandomValues');
        generatePassphrase(testWordList, 3);
        expect(cryptoSpy).toHaveBeenCalled();
        expect(mathSpy).not.toHaveBeenCalled();
    });

    test('replaceCharacters uses crypto.getRandomValues for capital selection', () => {
        const mathSpy = vi.spyOn(Math, 'random');
        const cryptoSpy = vi.spyOn(globalThis.crypto, 'getRandomValues');
        replaceCharacters('apple', false, false, true);
        expect(cryptoSpy).toHaveBeenCalled();
        expect(mathSpy).not.toHaveBeenCalled();
    });
});

describe('generatePassphrase', () => {
    test('generates the correct number of words', () => {
        [2, 3, 6].forEach(wordCount => {
            const passphrase = generatePassphrase(testWordList, wordCount);
            expect(passphrase.split('-').length).toBe(wordCount);
        });
    });

    test('words are hyphen-separated lowercase letters when no options are enabled', () => {
        const passphrase = generatePassphrase(testWordList, 3);
        expect(passphrase).toMatch(/^[a-z]+(-[a-z]+)*$/);
    });

    test('words are randomly selected', () => {
        const passphrases = new Set();
        for (let i = 0; i < 10; i++) {
            passphrases.add(generatePassphrase(testWordList, 3));
        }
        expect(passphrases.size).toBeGreaterThan(1);
    });

    test('throws for a word count below the minimum of 2', () => {
        expect(() => generatePassphrase(testWordList, 1)).toThrow();
        expect(() => generatePassphrase(testWordList, 0)).toThrow();
        expect(() => generatePassphrase(testWordList, -1)).toThrow();
    });

    test('throws for a non-integer word count', () => {
        expect(() => generatePassphrase(testWordList, 1.5)).toThrow();
    });

    test('throws when wordCount exceeds the word list size', () => {
        expect(() => generatePassphrase(testWordList, testWordList.length + 1)).toThrow();
    });

    test('contains no digits, symbols, or capitals when no options are enabled', () => {
        const passphrase = generatePassphrase(testWordList, 3);
        expect(passphrase).toMatch(/^[a-z-]+$/);
    });

    test('includes at least one digit when useNumbers is true', () => {
        // All test words have number-substitutable chars so every word contributes a digit
        const passphrase = generatePassphrase(testWordList, 6, true, false, false);
        expect(passphrase).toMatch(/\d/);
    });

    test('includes at least one symbol when useSymbols is true', () => {
        // All test words have symbol-substitutable chars so every word contributes a symbol
        const passphrase = generatePassphrase(testWordList, 6, false, true, false);
        expect(passphrase).toMatch(/[@$!*]/);
    });

    test('includes at least one capital when useCapitals is true', () => {
        const passphrase = generatePassphrase(testWordList, 3, false, false, true);
        expect(passphrase).toMatch(/[A-Z]/);
    });

    test('includes digits, symbols, and capitals when all options are enabled', () => {
        const passphrase = generatePassphrase(testWordList, 6, true, true, true);
        expect(passphrase).toMatch(/\d/);
        expect(passphrase).toMatch(/[@$!*]/);
        expect(passphrase).toMatch(/[A-Z]/);
    });
});
