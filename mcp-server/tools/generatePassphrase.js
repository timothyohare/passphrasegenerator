import { generatePassphrase as generate } from '../../passphrase.js';
import { wordLists } from '../wordListManagerServer.js';

const VALID_WORD_LISTS = ['small', 'medium', 'large'];

export const definition = {
  name: 'generate_passphrase',
  description: 'Generate a cryptographically secure passphrase using random words joined by hyphens',
  inputSchema: {
    type: 'object',
    properties: {
      word_count: {
        type: 'integer',
        description: 'Number of words in the passphrase (2–6)',
        minimum: 2,
        maximum: 6,
      },
      word_list: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'Word list to use: small (~2200 words), medium (~5500 words, default), large (~2200 longer words)',
        default: 'medium',
      },
      use_numbers: {
        type: 'boolean',
        description: 'Replace one letter per word with a look-alike number (e.g. a→4, e→3, s→5)',
        default: false,
      },
      use_symbols: {
        type: 'boolean',
        description: 'Replace one letter per word with a symbol (e.g. a→@, s→$, i→!, o→*)',
        default: false,
      },
      use_capitals: {
        type: 'boolean',
        description: 'Randomly capitalise one letter per word',
        default: false,
      },
    },
    required: ['word_count'],
  },
};

export function handler(args) {
  const {
    word_count,
    word_list = 'medium',
    use_numbers = false,
    use_symbols = false,
    use_capitals = false,
  } = args;

  if (!Number.isInteger(word_count) || word_count < 2 || word_count > 6) {
    throw new Error('word_count must be an integer between 2 and 6');
  }
  if (!VALID_WORD_LISTS.includes(word_list)) {
    throw new Error(`word_list must be one of: ${VALID_WORD_LISTS.join(', ')}`);
  }

  const list = wordLists[word_list];
  const passphrase = generate(list, word_count, use_numbers, use_symbols, use_capitals);
  const entropy_bits = calcEntropy(list.length, word_count);

  return {
    content: [{ type: 'text', text: JSON.stringify({ passphrase, word_count, word_list, entropy_bits }) }],
  };
}

function calcEntropy(listSize, wordCount) {
  // log2(listSize) + log2(listSize-1) + ... + log2(listSize-wordCount+1)
  // Accounts for sampling without replacement.
  let bits = 0;
  for (let i = 0; i < wordCount; i++) {
    bits += Math.log2(listSize - i);
  }
  return Math.round(bits * 10) / 10;
}
