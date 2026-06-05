# Passphrase Generator

A cryptographically secure passphrase generator. Passphrases are generated entirely in the browser — nothing is sent to a server.

Live at **[passphrasegenerator.ohare.id.au](https://passphrasegenerator.ohare.id.au)**

## Features

- Generates random passphrases from 2–6 words
- Optional number substitutions (a→4, e→3, s→5, …)
- Optional symbol substitutions (a→@, s→$, i→!, o→*)
- Optional random capitalisation per word
- Uses `crypto.getRandomValues()` throughout — no `Math.random()`
- Three word list sizes (short / medium / long) drawn from Google's 10,000 most common English words (profanity-filtered)

## Run locally

```bash
npm install
npm test
npx http-server . -p 8080
```

## MCP Server

The generator is also deployed as a [Model Context Protocol](https://modelcontextprotocol.io) server on AWS Lambda, allowing AI assistants like Claude to call it as a tool.

**Endpoint:** `https://bllbpmurez775t4ltnmlquez3q0jqnni.lambda-url.ap-southeast-2.on.aws/mcp`

**Tools:**

| Tool | Description |
|---|---|
| `generate_passphrase` | Generate a single passphrase with configurable options |
| `generate_multiple_passphrases` | Generate a batch of passphrases to choose from |
| `list_word_lists` | List available word lists and their word counts |

**Claude Desktop config** (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "passphrase-generator": {
      "type": "http",
      "url": "https://bllbpmurez775t4ltnmlquez3q0jqnni.lambda-url.ap-southeast-2.on.aws/mcp",
      "headers": { "x-api-key": "<your-api-key>" }
    }
  }
}
```

See [`mcp-server-plan.md`](mcp-server-plan.md) for the full architecture and deployment decisions.

### Deploy the MCP server

```bash
# 1. Install CDK dependencies
cd infra && npm install

# 2. Bootstrap CDK (one-time per AWS account/region)
npx cdk bootstrap

# 3. Generate an API key and hash it
openssl rand -hex 32                                        # your key
echo -n "<key>" | sha256sum | cut -d' ' -f1               # store this hash

# 4. Deploy
MCP_API_KEY_HASH="<hash>" npx cdk deploy
```

## Architecture

```
Browser  →  index.html + passphrase.js          (AWS Amplify, static)
AI tools →  mcp-server/  →  Lambda Function URL (AWS Lambda, Node.js 22)
                             ↑
                         passphrase.js (shared)
```

## Credits

- [Claude Code](https://claude.ai/code) — specifications, code generation, and deployment
- [google-10000-english](https://github.com/first20hours/google-10000-english) — word lists
- [English Words](https://github.com/dwyl/english-words) — full dictionary (`words_alpha.txt`)
- [Harper Reed's LLM codegen workflow](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/) — inspiration
