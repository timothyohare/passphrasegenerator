import { wordLists } from '../wordListManagerServer.js';

export const definition = {
  name: 'list_word_lists',
  description: 'List available word lists with their word counts and descriptions',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export function handler() {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        word_lists: [
          {
            id: 'small',
            word_count: wordLists.small.length,
            description: 'Short, common everyday words',
          },
          {
            id: 'medium',
            word_count: wordLists.medium.length,
            description: 'Balanced selection of common words (default)',
          },
          {
            id: 'large',
            word_count: wordLists.large.length,
            description: 'Longer, more varied words',
          },
        ],
      }),
    }],
  };
}
