import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FILE_MAP = {
  small: 'google-10000-english-usa-no-swears-short.txt',
  medium: 'google-10000-english-usa-no-swears-medium.txt',
  large: 'google-10000-english-usa-no-swears-long.txt',
};

const cache = new Map();

function loadWordList(size) {
  if (cache.has(size)) return cache.get(size);

  const filename = FILE_MAP[size];
  if (!filename) throw new Error(`Unknown word list size: ${size}`);

  // Word list files live one directory up (project root) in dev, or at ../
  // relative to this module inside the Lambda package.
  const filePath = join(__dirname, '..', filename);
  const text = readFileSync(filePath, 'utf8');
  const words = text
    .split('\n')
    .map(w => w.trim())
    .filter(w => /^[a-z]{2,20}$/.test(w));

  cache.set(size, words);
  return words;
}

// Load all lists at module init — runs once per Lambda cold start (~5 ms total).
const wordLists = {
  small: loadWordList('small'),
  medium: loadWordList('medium'),
  large: loadWordList('large'),
};

export { loadWordList, wordLists };
