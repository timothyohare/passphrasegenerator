# Passphrase Generator Project Checklist

## Iteration 1: Core Passphrase Generation Logic
- [ ] Create `wordList.js` with 10 sample words (e.g., ["apple", "banana"])
- [ ] Implement `generatePassphrase(wordCount)` function
- [ ] Add unit tests for:
  - [ ] Correct word count (test 2, 3, 6 words)
  - [ ] Hyphen-separated format
  - [ ] Random word selection (run 10x to verify randomness)

## Iteration 2: Character Replacement Logic
- [ ] Create `characterReplacement.js` module
- [ ] Implement number substitution rules (1/l, 3/e, etc.)
- [ ] Implement symbol substitution rules (@/a, $/s, etc.)
- [ ] Add tests for:
  - [ ] "apple" → "appl3" (numbers)
  - [ ] "test" → "t3st" (mixed substitutions)
  - [ ] Edge case: no substitutions applied

## Iteration 3: Basic UI Structure
- [ ] Create `index.html` skeleton
- [ ] Add Bootstrap CSS via CDN
- [ ] Implement:
  - [ ] Word count input (type=number, min=2, max=6)
  - [ ] "Include Numbers" checkbox
  - [ ] "Include Symbols" checkbox
  - [ ] "Generate" button
  - [ ] Output div (#passphrase-output)
- [ ] Add basic responsive styling

## Iteration 4: UI-Logic Integration
- [ ] Connect "Generate" button to:
  - [ ] Read word count value
  - [ ] Read checkbox states
  - [ ] Call `generatePassphrase()`
  - [ ] Display result in output div
- [ ] Add input validation:
  - [ ] Alert for word count <2 or >6
- [ ] Test edge cases:
  - [ ] Generate with all checkboxes off
  - [ ] Generate with invalid word count

## Iteration 5: Copy Functionality
- [ ] Add "Copy" button next to output
- [ ] Implement Clipboard.js integration
- [ ] Add visual feedback ("Copied!" tooltip)
- [ ] Add fallback alert for clipboard errors
- [ ] Test:
  - [ ] Copy success in Chrome/Firefox
  - [ ] Fallback behavior in Safari private mode

## Iteration 6: History Feature
- [ ] Create `historyManager.js` module
- [ ] Implement history array (max 2 items)
- [ ] Add history section below output
- [ ] Make history items clickable to copy
- [ ] Test:
  - [ ] History updates after 3+ generations
  - [ ] Click-to-copy works for history items

## Iteration 7: Strength Indicator
- [ ] Implement `calculateStrength()` function
- [ ] Add colored text indicator below output
- [ ] Test all strength combinations:
  - [ ] 2 words + no extras → red "Weak"
  - [ ] 4 words + symbols → yellow "Medium"
  - [ ] 6 words + both → green "Strong"

## Iteration 8: Reset Functionality
- [ ] Add "Reset" button
- [ ] Implement reset handler to:
  - [ ] Set word count to 3
  - [ ] Uncheck both boxes
  - [ ] Clear output and history
- [ ] Test:
  - [ ] UI state after reset matches defaults
  - [ ] History persists after regeneration but clears on reset

## Iteration 9: Tooltips & Polish
- [ ] Add Bootstrap tooltips for:
  - [ ] Word count ("Choose 2-6 words")
  - [ ] Numbers ("Replaces letters with similar-looking numbers")
  - [ ] Symbols ("Replaces letters with symbols")
- [ ] Optimize:
  - [ ] Preload word list
  - [ ] Minify CSS/JS
- [ ] Verify:
  - [ ] Mobile layout (test Chrome DevTools)
  - [ ] Tab accessibility

## Iteration 10: Deployment
- [ ] Create production build:
  - [ ] Minify CSS/JS
  - [ ] Optimize images (if any)
- [ ] Write `README.md` with:
  - [ ] Setup instructions
  - [ ] Feature list
  - [ ] Screenshot
- [ ] Deploy to Netlify/GitHub Pages
- [ ] Verify:
  - [ ] HTTPS working
  - [ ] Load time <2s (PageSpeed Insights)

## Final Testing
- [ ] Cross-browser testing:
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (macOS/iOS)
  - [ ] Edge
- [ ] User acceptance testing:
  - [ ] 3 non-technical users validate intuitiveness
  - [ ] Fix any UX pain points
- [ ] Security audit:
  - [ ] No sensitive data in source
  - [ ] CSP headers configured
