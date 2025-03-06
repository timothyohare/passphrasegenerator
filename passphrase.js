// passphrase.js


/*const wordList = [
    "apple", "banana", "cherry", "date", "elderberry",
    "fig", "grape", "honeydew", "kiwi", "lemon"
];*/


const numberSubstitutions = {
    'l': '1',
    'e': '3',
    'a': '4',
    's': '5',
    'b': '6',
    't': '7',
    'g': '9'
};

const symbolSubstitutions = {
    'a': '@',
    's': '$',
    'i': '!',
    'o': '*'
};

function replaceCharacters(word, useNumbers, useSymbols) {
    if (!useNumbers && !useSymbols) {
        return word;
    }

    let result = word.toLowerCase();

    // Process each character, prioritizing symbols over numbers when both are enabled
    for (let i = 0; i < result.length; i++) {
        const char = result[i];
        if (useSymbols && char in symbolSubstitutions) {
            result = result.substring(0, i) + symbolSubstitutions[char] + result.substring(i + 1);
            // only use one symbol per word
            useSymbols = false;
        } else if (useNumbers && char in numberSubstitutions) {
            result = result.substring(0, i) + numberSubstitutions[char] + result.substring(i + 1);
            // only use one number per word
            useNumbers = false;
        }
    }

    return result;
}

function generatePassphrase(wordList, wordCount, useNumbers = false, useSymbols = false) {

    if (!Number.isInteger(wordCount) || wordCount < 1) {
        throw new Error("wordCount must be a positive integer");
    }

    if (wordCount > wordList.length) {
        throw new Error("wordCount cannot exceed available words");
    }

    const selectedWords = [];
    const availableWords = [...wordList];

    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const word = availableWords[randomIndex];
        const processedWord = replaceCharacters(word, useNumbers, useSymbols);
        selectedWords.push(processedWord);
        availableWords.splice(randomIndex, 1);
    }

    return selectedWords.join('-');
}

// Export as ES modules
export { generatePassphrase, replaceCharacters };