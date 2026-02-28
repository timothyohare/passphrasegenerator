// passphrase.js

function secureRandInt(max) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return arr[0] % max;
}

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

function replaceCharacters(word, useNumbers, useSymbols, useCapitals) {
    if (!useNumbers && !useSymbols && !useCapitals) {
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

    if (useCapitals) {
        const alphaIndices = [];
        for (let i = 0; i < result.length; i++) {
            if (result[i] >= 'a' && result[i] <= 'z') {
                alphaIndices.push(i);
            }
        }
        if (alphaIndices.length > 0) {
            const idx = alphaIndices[secureRandInt(alphaIndices.length)];
            result = result.substring(0, idx) + result[idx].toUpperCase() + result.substring(idx + 1);
        }
    }

    return result;
}

function generatePassphrase(wordList, wordCount, useNumbers = false, useSymbols = false, useCapitals = false) {

    if (!Number.isInteger(wordCount) || wordCount < 2) {
        throw new Error("wordCount must be an integer of at least 2");
    }

    if (wordCount > wordList.length) {
        throw new Error("wordCount cannot exceed available words");
    }

    const selectedWords = [];
    const availableWords = [...wordList];

    for (let i = 0; i < wordCount; i++) {
        const randomIndex = secureRandInt(availableWords.length);
        const word = availableWords[randomIndex];
        const processedWord = replaceCharacters(word, useNumbers, useSymbols, useCapitals);
        selectedWords.push(processedWord);
        availableWords.splice(randomIndex, 1);
    }

    return selectedWords.join('-');
}

// Export as ES modules
export { generatePassphrase, replaceCharacters };