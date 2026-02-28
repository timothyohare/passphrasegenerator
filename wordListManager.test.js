import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import WordListManager from './wordListManager.js';

function mockFetch(body, status = 200) {
    return vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: () => Promise.resolve(body),
    }));
}

describe('WordListManager — fetch error reporting', () => {
    afterEach(() => vi.unstubAllGlobals());

    test('error message includes the actual HTTP status code, not a literal placeholder', async () => {
        mockFetch('', 404);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const manager = new WordListManager();
        await manager.loadWordList('medium');
        const errorArg = consoleSpy.mock.calls[0][1];
        expect(errorArg.message).toContain('404');
        expect(errorArg.message).not.toContain('${response.status}');
    });
});

describe('WordListManager — word list content validation', () => {
    afterEach(() => vi.unstubAllGlobals());

    test('accepts valid lowercase alphabetic words', async () => {
        mockFetch('apple\nbanana\ncherry\n');
        const manager = new WordListManager();
        await manager.loadWordList('medium');
        expect(manager.getWordList()).toEqual(['apple', 'banana', 'cherry']);
    });

    test('rejects empty lines', async () => {
        mockFetch('apple\n\n\nbanana\n');
        const manager = new WordListManager();
        await manager.loadWordList('medium');
        expect(manager.getWordList()).not.toContain('');
    });

    test('rejects words containing non-alphabetic characters', async () => {
        mockFetch('apple\nhello123\nfoo_bar\n');
        const manager = new WordListManager();
        await manager.loadWordList('medium');
        expect(manager.getWordList()).toEqual(['apple']);
    });

    test('rejects words longer than 20 characters', async () => {
        mockFetch('apple\nthiswordiswaytoolongtobeapassword\n');
        const manager = new WordListManager();
        await manager.loadWordList('medium');
        expect(manager.getWordList()).toEqual(['apple']);
    });

    test('trims whitespace before validating', async () => {
        mockFetch('  apple  \n  banana  \n');
        const manager = new WordListManager();
        await manager.loadWordList('medium');
        expect(manager.getWordList()).toEqual(['apple', 'banana']);
    });
});
