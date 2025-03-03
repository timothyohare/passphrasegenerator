const { generatePassphrase, wordList } = require('./passphrase');

describe('Passphrase Generator', () => {
    test('generates passphrase with correct number of words', () => {
        [2, 3, 6].forEach(wordCount => {
            const passphrase = generatePassphrase(wordCount);
            const words = passphrase.split('-');
            expect(words.length).toBe(wordCount);
        });
    });

    test('uses words from the word list', () => {
        const passphrase = generatePassphrase(3);
        const words = passphrase.split('-');
        words.forEach(word => {
            expect(wordList).toContain(word);
        });
    });

    test('words are hyphen-separated', () => {
        const passphrase = generatePassphrase(3);
        expect(passphrase).toMatch(/^[a-z]+(-[a-z]+)*$/);
    });

    test('words are randomly selected', () => {
        const passphrases = new Set();
        // Generate multiple passphrases and ensure they're not all the same
        for (let i = 0; i < 10; i++) {
            passphrases.add(generatePassphrase(3));
        }
        // With 10 words and 3-word combinations, it's extremely unlikely to get the same phrase
        expect(passphrases.size).toBeGreaterThan(1);
    });

    test('throws error for invalid word count', () => {
        expect(() => generatePassphrase(0)).toThrow();
        expect(() => generatePassphrase(11)).toThrow();
        expect(() => generatePassphrase(-1)).toThrow();
    });
});