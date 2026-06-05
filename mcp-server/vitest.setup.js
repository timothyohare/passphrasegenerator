import { webcrypto } from 'node:crypto';
// Node.js 21+ exposes globalThis.crypto natively as a read-only getter;
// only polyfill it on older runtimes.
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}
