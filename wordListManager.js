class WordListManager {
  constructor() {
    this.wordLists = {
      small: null,  // ~1000 common words
      medium: null, // ~10,000 words
      large: null   // Full dictionary
    };
    this.currentList = 'medium';
  }

  async initialize() {
    try {
      // Load medium list by default
      await this.loadWordList('medium');

      return true;
    } catch (error) {
      console.error('Failed to load word lists:', error);
      return false;
    }
  }

  async loadWordList(size) {
    if (this.wordLists[size]) return this.wordLists[size];

    try {
      const response = await fetch(`google-10000-english-usa-no-swears-${size}.txt`)
      if (!response.ok) {
        throw new Error('Response status: ${response.status}');
      }
      const text = await response.text();
      this.wordLists[size] = text.split('\n').filter(w => w.trim().length > 0);
      this.currentList = size;
      return this.wordLists[size];
    } catch (error) {
      console.error(`Failed to load word list:`, error);
      return null;
    }
  }

  getWordList() {
    return this.wordLists[this.currentList] || [];
  }
}

// Export as ES modules
export default WordListManager;