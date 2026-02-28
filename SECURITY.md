# Security Review

Generated: 2026-02-28

## CRITICAL

### 1. Insecure randomness — `passphrase.js`
`Math.random()` is a pseudorandom number generator and is explicitly not suitable
for security-sensitive use. An attacker who can observe or fingerprint PRNG state
can predict generated passphrases.

**Fix:** Replace all `Math.random()` calls with `crypto.getRandomValues()`.

---

## HIGH

### 2. No Subresource Integrity (SRI) on CDN asset — `index.html`
Bootstrap CSS is loaded from `cdnjs.cloudflare.com` without an `integrity` hash.
If the CDN is compromised or traffic is intercepted, malicious CSS can be injected.
CSS can exfiltrate content (e.g. the generated passphrase) via attribute selectors
and `background: url(...)` data exfiltration.

**Fix:** Add `integrity` and `crossorigin="anonymous"` attributes to the link tag.

### 3. No Content Security Policy — `index.html`
No `Content-Security-Policy` header or meta tag is present, leaving the browser
with no restriction on inline scripts or resource origins. XSS payloads have no
browser-enforced mitigation layer.

**Fix:** Add a restrictive CSP meta tag.

---

## MEDIUM

### 4. Template literal bug masks fetch errors — `wordListManager.js:29`
Single quotes used instead of backticks: `'Response status: ${response.status}'`.
`${response.status}` is never interpolated, so every fetch failure reports the
same useless literal string, hiding the actual HTTP error code.

**Fix:** Change single quotes to backticks on the error string.

### 5. Silent empty word list on fetch failure — `wordListManager.js`
If the word list fetch fails, `getWordList()` silently returns `[]`. The UI then
surfaces a confusing "wordCount cannot exceed available words" error with no
indication the word list failed to load.

**Fix:** Detect and surface load failures explicitly in the UI.

### 6. No word list content validation — `wordListManager.js:31-32`
Fetched content is split on newlines with no further validation. Tampered or
corrupted word lists (e.g. served over HTTP without HTTPS) could contain
non-word content, very long strings, or attacker-chosen entries that make the
passphrase predictable.

**Fix:** Filter fetched words to only accept short, alphabetic strings.

### 7. Raw exception messages surfaced to UI — `ui-controller.js:55`
`this.showError(error.message)` passes raw internal exception text to the user.
While `textContent` prevents XSS, internal error strings should not be user-visible.

**Fix:** Map internal errors to controlled, user-friendly messages.

---

## LOW

### 8. Deprecated clipboard API — `ui-controller.js:62`
`document.execCommand('copy')` is deprecated and may be removed in future
browser releases.

**Fix:** Replace with the modern `navigator.clipboard.writeText()` async API.

### 9. Low entropy at 2-word minimum
A 2-word passphrase from a ~10,000 word list yields ~10⁸ combinations before
substitutions — roughly equivalent to an 8-character random lowercase password.
The leet-speak substitutions (one per word, deterministic alphabet) are a
well-known pattern and add minimal entropy against a targeted attacker.
Users should be warned to use 4+ words for any real security requirement.

**Fix:** Display a contextual entropy warning in the UI when word count is low.
