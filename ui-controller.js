// ui-controller.js
import { generatePassphrase } from './passphrase.js';
import WordListManager from './wordListManager.js';


class PassphraseUIController {
    wordListManager;
    wordList;
    constructor() {
        // UI Elements
        this.form = document.getElementById('passphraseForm');
        this.wordCountInput = document.getElementById('wordCount');
        this.numberCheckbox = document.getElementById('useNumbers');
        this.symbolCheckbox = document.getElementById('useSymbols');
        this.outputField = document.getElementById('generatedPassphrase');
        this.copyButton = document.getElementById('copyButton');
        this.errorAlert = document.getElementById('errorAlert');

        // Bind event listeners
        this.form.addEventListener('submit', this.handleGenerate.bind(this));
        this.copyButton.addEventListener('click', this.handleCopy.bind(this));
        this.wordCountInput.addEventListener('input', this.validateWordCount.bind(this));

        this.wordListManager = new WordListManager;
        const v = this.wordListManager.initialize();

    }

    handleGenerate(event) {
        event.preventDefault();
        
        try {
            // Get input values
            const wordCount = parseInt(this.wordCountInput.value);
            const useNumbers = this.numberCheckbox.checked;
            const useSymbols = this.symbolCheckbox.checked;

            // Validate input
            if (!this.isValidWordCount(wordCount)) {
                this.showError('Please enter a number between 2 and 6');
                return;
            }
            this.wordList = this.wordListManager.getWordList();
            // Generate and display passphrase
            const passphrase = generatePassphrase(this.wordList, wordCount, useNumbers, useSymbols);
            this.outputField.value = passphrase;
            this.copyButton.disabled = false;
            
            // Clear any previous errors
            this.clearError();

        } catch (error) {
            this.showError(error.message);
        }
    }

    handleCopy() {
        try {
            this.outputField.select();
            document.execCommand('copy');
            
            // Visual feedback
            const originalText = this.copyButton.textContent;
            this.copyButton.textContent = 'Copied!';
            this.copyButton.classList.add('btn-success');
            this.copyButton.classList.remove('btn-outline-secondary');
            
            setTimeout(() => {
                this.copyButton.textContent = originalText;
                this.copyButton.classList.remove('btn-success');
                this.copyButton.classList.add('btn-outline-secondary');
            }, 1500);

        } catch (error) {
            this.showError('Failed to copy to clipboard');
        }
    }

    validateWordCount() {
        let value = parseInt(this.wordCountInput.value);
        
        if (isNaN(value)) {
            this.wordCountInput.value = 3; // Default value
        } else {
            if (value < 2) this.wordCountInput.value = 2;
            if (value > 6) this.wordCountInput.value = 6;
        }
    }

    isValidWordCount(value) {
        return Number.isInteger(value) && value >= 2 && value <= 6;
    }

    showError(message) {
        if (!this.errorAlert) {
            this.errorAlert = document.createElement('div');
            this.errorAlert.className = 'alert alert-danger mt-3';
            this.form.appendChild(this.errorAlert);
        }
        this.errorAlert.textContent = message;
        this.errorAlert.style.display = 'block';
    }

    clearError() {
        if (this.errorAlert) {
            this.errorAlert.style.display = 'none';
        }
    }
}

// Initialize the controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PassphraseUIController();
});

export default PassphraseUIController;
