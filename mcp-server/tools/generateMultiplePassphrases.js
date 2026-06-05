import { generatePassphrase as generate } from '../../passphrase.js';
import { wordLists } from '../wordListManagerServer.js';

const VALID_WORD_LISTS = ['small', 'medium', 'large'];

export const definition = {
  name: 'generate_multiple_passphrases',
  description: 'Generate multiple passphrase candidates with the same settings so a user can choose',
  inputSchema: {
    type: 'object',
    properties: {
      count: {
        type: 'integer',
        description: 'Number of passphrases to generate (1–10)',
        minimum: 1,
        maximum: 10,
      },
      word_count: {
        type: 'integer',
        description: 'Number of words in each passphrase (2–6)',
        minimum: 2,
        maximum: 6,
      },
      word_list: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'Word list to use',
        default: 'medium',
      },
      use_numbers: {
        type: 'boolean',
        description: 'Replace one letter per word with a look-alike number',
        default: false,
      },
      use_symbols: {
        type: 'boolean',
        description: 'Replace one letter per word with a symbol',
        default: false,
      },
      use_capitals: {
        type: 'boolean',
        description: 'Randomly capitalise one letter per word',
        default: false,
      },
    },
    required: ['count', 'word_count'],
  },
};

export function handler(args) {
  const {
    count,
    word_count,
    word_list = 'medium',
    use_numbers = false,
    use_symbols = false,
    use_capitals = false,
  } = args;

  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new Error('count must be an integer between 1 and 10');
  }
  if (!Number.isInteger(word_count) || word_count < 2 || word_count > 6) {
    throw new Error('word_count must be an integer between 2 and 6');
  }
  if (!VALID_WORD_LISTS.includes(word_list)) {
    throw new Error(`word_list must be one of: ${VALID_WORD_LISTS.join(', ')}`);
  }

  const list = wordLists[word_list];
  const passphrases = Array.from({ length: count }, () =>
    generate(list, word_count, use_numbers, use_symbols, use_capitals)
  );

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        passphrases,
        settings: { word_count, word_list, use_numbers, use_symbols, use_capitals },
      }),
    }],
  };
}
