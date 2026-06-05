import http from 'node:http';
import { createHash } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { definition as genDef, handler as genHandler } from './tools/generatePassphrase.js';
import { definition as genMultiDef, handler as genMultiHandler } from './tools/generateMultiplePassphrases.js';
import { definition as listDef, handler as listHandler } from './tools/listWordLists.js';

const tools = [genDef, genMultiDef, listDef];

const toolHandlers = {
  generate_passphrase: genHandler,
  generate_multiple_passphrases: genMultiHandler,
  list_word_lists: listHandler,
};

function createMcpServer() {
  const server = new Server(
    { name: 'passphrase-generator', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolHandler = toolHandlers[name];
    if (!toolHandler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    try {
      return toolHandler(args ?? {});
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

function isAuthorized(req) {
  const apiKeyHash = process.env.API_KEY_HASH;
  if (!apiKeyHash) return true; // no auth configured (local dev)

  const provided = req.headers['x-api-key'] ?? '';
  const hashed = createHash('sha256').update(provided).digest('hex');
  return hashed === apiKeyHash;
}


export async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`).pathname;

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (urlPath !== '/mcp') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!isAuthorized(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  // Stateless: create a fresh server and transport for each request.
  // Do NOT pre-read the body — the SDK's Hono adapter reads it from the stream itself.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const mcpServer = createMcpServer();

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);

  res.on('finish', async () => {
    await transport.close();
    await mcpServer.close();
  });
}

// Only start an HTTP server when running locally (not in Lambda).
if (!process.env.LAMBDA_TASK_ROOT) {
  const PORT = process.env.PORT ?? 3001;
  http.createServer(handleRequest).listen(PORT, () => {
    console.log(`MCP server listening on http://localhost:${PORT}/mcp`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}
