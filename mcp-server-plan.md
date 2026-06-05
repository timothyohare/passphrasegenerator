# MCP Server Implementation Plan

## Goal

Add an internet-accessible MCP (Model Context Protocol) server to the passphrase generator, deployed on AWS, so AI assistants (Claude Desktop, API tool use) can call the passphrase generator as a tool.

## Architecture Overview

```
Claude Desktop / API
        ↓  HTTPS POST /mcp
Lambda Function URL (*.lambda-url.ap-southeast-2.on.aws)
        ↓
Lambda (Node.js 22, arm64)
  ├── auth check (x-api-key header)
  ├── MCP SDK — Streamable HTTP, stateless
  └── passphrase.js (unchanged — globalThis.crypto works natively in Node 22)
```

## MCP Tools

| Tool | Parameters | Returns |
|---|---|---|
| `generate_passphrase` | `word_count` (2–6), `word_list` (small/medium/large), `use_numbers`, `use_symbols`, `use_capitals` | `{ passphrase, word_count, word_list, entropy_bits }` |
| `generate_multiple_passphrases` | Same as above + `count` (1–10) | `{ passphrases: string[], settings }` |
| `list_word_lists` | none | `{ word_lists: [{ id, word_count, description }] }` |

## Project Structure

```
passphrasegenerator/
├── mcp-server/
│   ├── package.json
│   ├── server.js                      # HTTP server entry (local dev)
│   ├── handler.js                     # Lambda adapter (serverless-http)
│   ├── wordListManagerServer.js       # fs.readFileSync-based loader
│   ├── vitest.config.js
│   ├── vitest.setup.js                # replicates root vitest.setup.js crypto polyfill
│   └── tools/
│       ├── generatePassphrase.js
│       ├── generateMultiplePassphrases.js
│       └── listWordLists.js
├── infra/                             # AWS CDK (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── cdk.json
│   └── lib/
│       └── passphrase-mcp-stack.ts
├── .github/workflows/
│   ├── test.yml                       # existing — extend to run mcp-server tests
│   └── deploy-mcp.yml                 # new — deploy to Lambda on push to main
├── passphrase.js                      # UNCHANGED — imported directly by server
└── google-10000-english-usa-no-swears-*.txt  # UNCHANGED — bundled into Lambda zip
```

### Root package.json changes

Add `workspaces` so `npm install` from root covers all sub-packages:

```json
{
  "type": "module",
  "workspaces": ["mcp-server", "infra"],
  "scripts": {
    "test": "vitest run",
    "test:mcp": "npm test --workspace=mcp-server",
    "test:all": "npm run test && npm run test:mcp"
  }
}
```

### mcp-server/package.json

```json
{
  "name": "passphrase-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "serverless-http": "^3.2.0"
  },
  "devDependencies": {
    "vitest": "^4.1.4"
  }
}
```

## AWS Resources

All defined in a single CDK stack (`PassphraseMcpStack`):

| Resource | Config |
|---|---|
| Lambda Function | Node.js 22.x, arm64 (Graviton2), 256 MB, 10s timeout |
| Lambda Function URL | authType NONE (auth in application code), CORS allow `*` |
| CloudWatch Log Group | 30-day retention |
| IAM Execution Role | `AWSLambdaBasicExecutionRole` only |
| SSM Parameter | SecureString storing SHA-256 hash of the API key |

### CDK Asset Bundling

Word list `.txt` files are bundled into the Lambda zip via CDK asset bundling — no S3 or separate storage needed. `words_alpha.txt` (4.1 MB) is excluded from the initial deployment.

```typescript
code: lambda.Code.fromAsset(path.join(__dirname, '../../mcp-server'), {
  bundling: {
    image: lambda.Runtime.NODEJS_22_X.bundlingImage,
    command: [
      'bash', '-c',
      'npm ci --omit=dev && cp /asset-input/../google-10000-english-usa-no-swears-*.txt /asset-output/ && cp -r /asset-input/. /asset-output/'
    ],
    user: 'root',
  },
})
```

## Authentication

Single API key via `x-api-key` request header. The Lambda stores a SHA-256 hash of the key (never plaintext) in an environment variable sourced from SSM at deploy time.

```javascript
// handler.js — checked before all MCP processing
const providedKey = req.headers['x-api-key'] ?? '';
const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
if (hashedKey !== process.env.API_KEY_HASH) {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unauthorized' }));
  return;
}
```

### Claude Desktop config

```json
{
  "mcpServers": {
    "passphrase-generator": {
      "type": "http",
      "url": "https://<id>.lambda-url.ap-southeast-2.on.aws/mcp",
      "headers": { "x-api-key": "<your-key>" }
    }
  }
}
```

## Implementation Phases

### Phase 1 — Server-side word list manager

Create `mcp-server/wordListManagerServer.js` using `fs.readFileSync` and `import.meta.url`-relative paths. Apply the same validation filter as the browser version (`/^[a-z]{2,20}$/.test(w)`). Cache all three lists at module init (runs once per Lambda cold start).

Write tests: mock `fs.readFileSync`, verify filtering, verify caching, verify missing file error.

### Phase 2 — MCP tool handlers

Install `@modelcontextprotocol/sdk`. Create one file per tool in `mcp-server/tools/`. Each handler validates inputs, loads the word list from Phase 1, calls `generatePassphrase` from `../../passphrase.js`, and returns a `text` content block with JSON.

Write unit tests for each handler covering valid inputs, boundary values, and invalid inputs.

### Phase 3 — MCP server entry point

Create `mcp-server/server.js` using `Server` and `StreamableHTTPServerTransport` (stateless mode) from the MCP SDK. Serve on `PORT` (default 3001 locally). Expose a `/health` endpoint. Guard `http.createServer().listen()` behind `if (!process.env.LAMBDA_TASK_ROOT)` so it does not start a server when running in Lambda.

### Phase 4 — Lambda adapter

Create `mcp-server/handler.js` using `serverless-http` to bridge the Lambda Function URL event format to the Node.js http interface. Export `handler` as the Lambda entry point.

### Phase 5 — CDK infrastructure

Bootstrap CDK in the target AWS account/region. Create `infra/` with the stack defining all resources listed above. Run `cdk synth` locally to verify the CloudFormation template before first deploy. Run `cdk deploy` manually for the initial deployment.

### Phase 6 — CI/CD

Set up GitHub OIDC (no stored AWS credentials). Create the IAM OIDC provider and a deployment role with the minimum permissions needed for CDK (`cloudformation:*`, `lambda:UpdateFunction*`, `iam:PassRole`, `s3:*` on the CDK bootstrap bucket).

Create `.github/workflows/deploy-mcp.yml` triggering on push to `main` when files in `mcp-server/`, `infra/`, `passphrase.js`, or the word list `.txt` files change.

Extend the existing `test.yml` to also run `npm test --workspace=mcp-server` on every push/PR.

### Phase 7 — Validation

- Configure Claude Desktop with the Function URL and API key
- Verify tool discovery: ask Claude to list tools from the passphrase generator
- Verify generation: ask Claude to generate a 4-word passphrase with numbers and symbols
- Verify auth: call the Function URL without `x-api-key`, confirm HTTP 401
- Verify CloudWatch logs show invocations

## Key Decisions

### Transport: Stateless Streamable HTTP

Chosen over:
- **stdio** — not internet-accessible
- **SSE-only transport** — deprecated in the 2025 MCP spec

Stateless mode means no session state between calls. Every POST to `/mcp` is self-contained. This maps cleanly to Lambda's stateless execution model.

### Lambda Function URL over API Gateway

API Gateway adds per-request cost, stage management, and configuration complexity with no benefit for a single-endpoint stateless server. Function URLs provide HTTPS natively and support CORS configuration. The only scenario where API Gateway would be needed is WebSocket support, which this transport does not use.

### Zip deployment over container

Total bundle (MCP SDK + word lists) is under 5 MB — well within Lambda's 50 MB zip / 250 MB unzipped limits. Zip deploys have faster cold starts than containers for this payload size.

### Synchronous word list loading at module init

Word list files total ~75 KB. Loading them synchronously at cold start takes under 5 ms. This is simpler than async loading with a cache and has no meaningful cold start impact. All subsequent warm invocations pay zero file I/O cost.

### No esbuild bundler

`npm ci --omit=dev` during CDK asset bundling produces a clean, correctly-sized deployment package. The MCP SDK is not large. Esbuild can be added later if bundle size becomes a concern.

### words_alpha.txt excluded initially

The full dictionary (4.1 MB) is not exposed as an MCP tool in the initial implementation. Adding it requires only including the file in the CDK asset and adding `"full"` as a valid `word_list` enum value.

### Custom domain deferred

The raw Lambda Function URL (`*.lambda-url.ap-southeast-2.on.aws`) is HTTPS by default and sufficient for initial use. A custom domain (`mcp.passphrasegenerator.ohare.id.au`) via CloudFront + ACM is a follow-up — it adds cost and configuration for a personal tool.

### passphrase.js unchanged

`globalThis.crypto.getRandomValues()` works natively in Node.js 19+ and in the Node.js 22 Lambda runtime. No polyfill or modification is needed. The server imports `passphrase.js` directly via a relative path (`../../passphrase.js`), sharing the same implementation between browser and server.

### wordListManagerServer.js as a separate file

The existing `wordListManager.js` uses `fetch()` with relative URLs — a browser-only API. Rather than polyfilling fetch or modifying the browser version, a thin server-side variant using `fs.readFileSync` is written separately. The browser `WordListManager` remains untouched.

### API key auth over open access

Even for a personal tool, the Function URL is public on the internet and will attract bots. A simple `x-api-key` header check with SHA-256 hashing is the minimum viable protection. OAuth 2.0 is overkill given there are no third-party users.
