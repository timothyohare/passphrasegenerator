# Passphrase Generator security assessment

**Date:** 27 September 2026
**Scope:** Static site, core generator, MCP Function URL and CDK deployment configuration. Review included local source, bounded public GET/initialization probes, and npm audits. No credentials, passphrase generation or traffic load were sent to production.

## Findings

### PPG-01 — Production MCP authentication failed open when unconfigured (High)

Before the fix, `mcp-server/server.js` authorized every request when `API_KEY_HASH` was empty. The CDK stack supplied an empty default, so a missing deployment secret made protected MCP calls public. The live endpoint rejected a missing key with 401; the bypass reproduced only with a local production-mode empty setting.

**Implemented:** The runtime now fails closed in production. A configured digest must be 64 hexadecimal characters and comparison uses `timingSafeEqual`. CDK synthesis throws unless `MCP_API_KEY_HASH` is a SHA-256 hex digest.

**Retest:** Six focused fuzz/auth tests pass, including configured and missing-key cases. The local development HTTP listener is also now bound to loopback. Before deployment, ensure CI provides the secret, synthesize and deploy the stack, then confirm unauthenticated production calls still receive 401.

### PPG-02 — Modulo bias in secure index selection (Low)

`passphrase.js` mapped random 32-bit values with `% max`, which gives a small uneven probability when the list size does not divide 2³².

**Implemented:** `secureRandInt` now rejects the short tail of the 32-bit range before reducing modulo, and validates its bound. A controlled three-item test proves the biased value is discarded. Cryptographic randomness still comes from `crypto.getRandomValues()`.

### PPG-03 — MCP options accepted non-boolean values (Low)

The JSON tool schema advertises booleans but the handlers previously passed values such as `"false"` through as truthy options.

**Implemented:** Core generation validates all option flags as booleans. Malformed counts and word-list names remain rejected.

### PPG-04 — Missing browser response headers (Low)

The live Amplify page returned no HSTS, content-type, or frame-protection response headers. The existing HTML meta CSP remains useful but cannot set `frame-ancestors`.

**Implemented:** Added Amplify `customHttp.yml` with HSTS, `nosniff`, frame denial, referrer and permissions policy, plus an HTTP CSP that retains the site's existing Bootstrap CDN requirements.

**Retest:** The presence-only live-header gate correctly still fails against the pre-deployment site. Re-run it after publishing the hosting configuration and check the effective CSP against loaded assets.

## Verification

`node ~/dev/newdev/code-build-harness/harness/gates/ci.mjs --force --full` from the repository root: **pass** (194 tests across discovered test files, including generated CDK output). The focused security gate from `security/` also passes (6 tests). `npm audit` in both the root package and `mcp-server/` reports zero known advisories after compatible lockfile updates. `npx cdk synth --quiet` passes with a synthetic SHA-256 digest. CDK deployment and the live header retest remain outstanding; no production changes were made.
