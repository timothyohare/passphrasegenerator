Here’s a **step-by-step blueprint** broken into small, test-driven iterations. Each step includes a code-generation prompt, testing requirements, and integration guidance:

---

### **Iteration 1: Core Passphrase Generation Logic**
**Objective**: Build the foundational logic for generating passphrases from a word list.

```text
Create a JavaScript module that:
1. Defines a `wordList` array with 10 sample words (e.g., ["apple", "banana", ...]).
2. Implements a function `generatePassphrase(wordCount)` that returns a hyphen-separated string of randomly selected words.
3. Includes unit tests to verify:
   - Output contains exactly `wordCount` words.
   - Words are randomly selected.
   - Words are separated by hyphens.
```

**Test Plan**:
- Test with `wordCount` values of 2, 3, and 6.
- Verify output format (e.g., "apple-banana").

---

### **Iteration 2: Character Replacement Logic**
**Objective**: Add number/symbol substitution rules.

```text
Extend the JavaScript module to:
1. Implement a function `replaceCharacters(word, useNumbers, useSymbols)` that applies substitutions:
   - Numbers: 1→l, 3→e, 4→a, 5→s, 7→t, 8→b, 9→g
   - Symbols: @→a, $→s, !→i, *→o
2. Update `generatePassphrase` to use this function based on boolean flags.
3. Add tests for:
   - "apple" → "appl3" (numbers enabled)
   - "apple" → "@pple" (symbols enabled)
   - Edge cases (no substitutions, mixed substitutions)
```

**Integration**:
- Wire the `generatePassphrase` function to accept `useNumbers` and `useSymbols` parameters.

---

### **Iteration 3: Basic UI Structure**
**Objective**: Create a minimal working UI.

```text
Build an HTML/CSS page with:
1. A number input for word count (2-6, default 3)
2. Two checkboxes: "Include Numbers" and "Include Symbols"
3. A "Generate" button
4. A div to display the generated passphrase
5. Basic styling with Bootstrap classes
```

**Test Plan**:
- Verify responsive layout on mobile/desktop.
- Test input validation (disable values <2 or >6).

---

### **Iteration 4: Connect UI to Logic**
**Objective**: Make the "Generate" button functional.

```text
Add JavaScript to:
1. Read input values from the UI
2. Call `generatePassphrase` with user settings
3. Display the result in the output div
4. Handle invalid input with an alert
```

**Integration**:
- Import the passphrase generation module.
- Add event listener for the "Generate" button.

---

### **Iteration 5: Copy Functionality**
**Objective**: Implement clipboard copy.

```text
Add:
1. A "Copy" button next to the generated passphrase
2. Click handler using Clipboard.js
3. Fallback alert if clipboard access fails
4. Visual feedback (e.g., "Copied!" tooltip)
```

**Integration**:
- Wire the copy button to the displayed passphrase.

---

### **Iteration 6: History Feature**
**Objective**: Track last 2 passphrases.

```text
Extend the JavaScript module to:
1. Maintain a `history` array (max 2 items)
2. Display history entries below the main output
3. Make history items clickable to copy
```

**Test Plan**:
- Verify history updates after each generation.
- Test copy functionality for history items.

---

### **Iteration 7: Strength Indicator**
**Objective**: Add security strength feedback.

```text
Implement:
1. A function `calculateStrength(wordCount, useNumbers, useSymbols)` that returns "weak"/"medium"/"strong"
2. A visual indicator (colored text) below the passphrase
3. Tests for strength rules:
   - 2 words + no extras → weak (red)
   - 4 words + symbols → medium (yellow)
   - 6 words + both → strong (green)
```

**Integration**:
- Call `calculateStrength` after each generation.
- Update UI colors dynamically.

---

### **Iteration 8: Reset Functionality**
**Objective**: Add settings reset.

```text
Add:
1. A "Reset" button
2. Handler to reset inputs to defaults:
   - Word count: 3
   - Uncheck both checkboxes
   - Clear generated passphrase and history
```

**Test Plan**:
- Verify UI state after reset matches defaults.

---

### **Iteration 9: Tooltips & Final Polish**
**Objective**: Improve usability.

```text
Add:
1. Bootstrap tooltips for configuration options
2. Error message styling
3. Mobile-responsive refinements
4. Performance optimizations (preload word list)
```

**Integration**:
- Initialize tooltips on page load.
- Final cross-browser testing.

---

### **Iteration 10: Deployment**
```text
Create:
1. Production-ready build with minified CSS/JS
2. README with setup instructions
3. Netlify/GitHub Pages deployment
4. Final UAT with real users
```

---

### **Testing Strategy**
1. **Atomic Tests**: Each iteration includes its own unit tests
2. **Integration Tests**:
   - End-to-end test after Iteration 4 (UI + logic)
   - Cross-feature test after Iteration 7 (strength + history)
3. **Progressive Enhancement**:
   - Core functionality works without JS (fallback message)
   - Feature detection for clipboard API

This blueprint ensures incremental progress with minimal risk. Each iteration produces testable, shippable code while maintaining forward compatibility.
