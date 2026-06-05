import { Readable } from 'node:stream';
import { handleRequest } from './server.js';

// Direct Lambda Function URL adapter — avoids serverless-http and gives the MCP
// transport a real Readable + a response object it can call writeHead/setHeader/end on.
export async function handler(event) {
  const method = event.requestContext?.http?.method ?? 'GET';
  const rawPath = event.rawPath ?? '/';
  const qs = event.rawQueryString ?? '';
  const url = rawPath + (qs ? `?${qs}` : '');

  // Lambda Function URLs normalise header names to lowercase.
  const headers = event.headers ?? {};

  const bodyBuf = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64')
    : Buffer.from(event.body ?? '');

  // Build a Readable that looks enough like IncomingMessage for our handler.
  // rawHeaders is the flat ['Name','value',...] array that @hono/node-server requires.
  const rawHeaders = [];
  for (const [k, v] of Object.entries(headers)) rawHeaders.push(k, v);

  const req = new Readable({ read() {} });
  req.headers = headers;
  req.rawHeaders = rawHeaders;
  req.method = method;
  req.url = url;
  req.push(bodyBuf);
  req.push(null);

  return new Promise((resolve) => {
    let statusCode = 200;
    const resHeaders = {};
    const bodyChunks = [];
    const finishHandlers = [];

    function finish() {
      for (const fn of finishHandlers) {
        try { fn(); } catch { /* ignore cleanup errors */ }
      }
      resolve({
        statusCode,
        headers: resHeaders,
        body: Buffer.concat(bodyChunks).toString('utf8'),
      });
    }

    const res = {
      writeHead(code, hdrs) {
        statusCode = code;
        if (hdrs) {
          for (const [k, v] of Object.entries(hdrs)) {
            resHeaders[k.toLowerCase()] = v;
          }
        }
      },
      setHeader(name, value) { resHeaders[name.toLowerCase()] = value; },
      getHeader(name) { return resHeaders[name.toLowerCase()]; },
      removeHeader(name) { delete resHeaders[name.toLowerCase()]; },
      hasHeader(name) { return name.toLowerCase() in resHeaders; },
      write(chunk) {
        if (chunk) bodyChunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        return true;
      },
      end(chunk) {
        if (chunk) bodyChunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        finish();
      },
      on(ev, fn) { if (ev === 'finish') finishHandlers.push(fn); return this; },
      once(ev, fn) { if (ev === 'finish') finishHandlers.push(fn); return this; },
      emit() { return this; },
    };

    handleRequest(req, res).catch((err) => {
      resolve({
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      });
    });
  });
}
