import { afterEach, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

afterEach(() => vi.unstubAllEnvs());
async function request(keyHash, key) {
  vi.stubEnv('LAMBDA_TASK_ROOT', '/local-security-test');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('API_KEY_HASH', keyHash);
  const { handler } = await import('../mcp-server/handler.js');
  return handler({
    requestContext: { http: { method: 'POST' } }, rawPath: '/mcp',
    headers: { host: 'localhost', 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(key ? { 'x-api-key': key } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'offline-security-test', version: '1' } } }),
  });
}
it('rejects a missing key when a hash is configured', async () => {
  const hash = createHash('sha256').update('synthetic-key').digest('hex');
  expect((await request(hash)).statusCode).toBe(401);
});
it('fails closed when production API_KEY_HASH is absent', async () => {
  const res = await request('');
  expect([401, 403, 503]).toContain(res.statusCode);
});
