# Passphrase Generator — Claude Code Guide

## Project Overview

A cryptographically secure passphrase generator with two deployment surfaces:

- **Static web app** — `index.html` + `passphrase.js`, hosted on AWS Amplify at passphrasegenerator.ohare.id.au
- **MCP server** — `mcp-server/`, deployed on AWS Lambda with a Function URL, for use by AI assistants as a tool

## Tech Stack

- **Language:** Vanilla JavaScript, ES modules (`"type": "module"`)
- **Testing:** Vitest 4.x (root tests) + Vitest 4.x (mcp-server tests — run separately)
- **Static hosting:** AWS Amplify
- **MCP server:** AWS Lambda (Node.js 22, arm64) + Lambda Function URL
- **IaC:** AWS CDK TypeScript in `infra/`
- **No build step** for the web app — ships as vanilla JS

## Common Commands

```bash
# Testing
npm test                            # run all tests from the root (includes mcp-server tests)
cd mcp-server && npm test           # run only mcp-server tests

# Local dev
npx http-server . -p 8080          # serve the web app locally
cd mcp-server && node server.js    # run the MCP server locally on port 3001

# Deploy MCP server
cd infra && MCP_API_KEY_HASH="<hash>" npx cdk deploy
```

## Project Structure

```
passphrase.js                      # core generation logic — shared by browser and MCP server
wordListManager.js                 # browser-only (fetch-based) word list loader
ui-controller.js                   # bridges DOM and passphrase generation
index.html                         # Bootstrap 5 UI
passphrase.test.js                 # unit tests
wordListManager.test.js
google-10000-english-usa-no-swears-{short,medium,long}.txt
words_alpha.txt                    # 370k words — not used by default, excluded from Lambda
vitest.setup.js                    # crypto polyfill guard for Node.js < 21

mcp-server/
  server.js                        # MCP server entry point (Streamable HTTP, stateless)
  handler.js                       # Lambda Function URL adapter (direct, no serverless-http)
  wordListManagerServer.js         # fs.readFileSync-based word loader
  tools/
    generatePassphrase.js
    generateMultiplePassphrases.js
    listWordLists.js
  __tests__/
    tools.test.js
    wordListManagerServer.test.js

infra/
  lib/passphrase-mcp-stack.ts      # CDK stack: Lambda + Function URL + CloudWatch logs
  bin/app.ts

.github/workflows/
  test.yml                         # runs on every push/PR; includes mcp-server tests
  deploy-mcp.yml                   # deploys to Lambda on push to main (GitHub OIDC)
```

## Core Generation API

```javascript
// passphrase.js
generatePassphrase(wordList, wordCount, useNumbers, useSymbols, useCapitals) → string
replaceCharacters(word, useNumbers, useSymbols, useCapitals) → string
```

- `wordCount`: 2–6
- Uses `crypto.getRandomValues()` — cryptographically secure
- Joins words with hyphens
- One number substitution per word max; one symbol substitution per word max
- Number substitutions: l→1, e→3, a→4, s→5, b→6, t→7, g→9
- Symbol substitutions: a→@, s→$, i→!, o→*

`passphrase.js` has no imports and no browser-specific APIs beyond `globalThis.crypto`, which works natively in Node.js 19+. Import it directly in server-side code.

## MCP Server

**Live endpoint:** `https://bllbpmurez775t4ltnmlquez3q0jqnni.lambda-url.ap-southeast-2.on.aws/mcp`

**Tools:** `generate_passphrase`, `generate_multiple_passphrases`, `list_word_lists`

**Auth:** `x-api-key` header. The Lambda holds a SHA-256 hash of the key in `API_KEY_HASH` env var. The plaintext key and hash are in `.env` (gitignored).

**Transport:** MCP Streamable HTTP (stateless — new Server + Transport per request).

**Lambda adapter note:** The MCP SDK uses `@hono/node-server` internally to convert Node.js `IncomingMessage` to a Fetch API `Request`. The adapter in `handler.js` must include `rawHeaders` (the flat `['Name','value',...]` array) on the mock request, or Hono's header conversion will throw a TypeError. This is a known quirk — do not remove it.

## Security Notes

- `crypto.getRandomValues()` is used throughout — do not replace with `Math.random()`
- Bootstrap loaded from CDN with SRI hash verification
- CSP meta tag in `index.html` restricts script/style sources
- Word list validation: only 2–20 character alphabetic words accepted (`/^[a-z]{2,20}$/`)
- `vitest.setup.js` uses a conditional `Object.defineProperty` guard — Node.js 21+ exposes `globalThis.crypto` as a read-only getter and direct assignment throws

## Deployment Notes

- `words_alpha.txt` (4.1 MB) is excluded from the Lambda bundle — not exposed via MCP tools
- CDK local bundling runs without Docker; falls back to Docker image if local bundling fails
- A `{"type":"module"}` `package.json` is written to the Lambda bundle root during CDK asset bundling so Node.js treats `passphrase.js` as an ES module (it has no `package.json` of its own)
- GitHub Actions deploy workflow uses OIDC (no stored AWS keys) — `AWS_ROLE_ARN` and `MCP_API_KEY_HASH` must be set as GitHub secrets
