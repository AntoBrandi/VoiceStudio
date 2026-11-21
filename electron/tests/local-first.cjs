'use strict';

// Source of truth for the local-first allowlist. CommonJS so the request guard can load it in
// Electron's main process before the app starts; local-first.mjs re-exports it for test files.

const LOCAL_SCHEMES = new Set(['app:', 'file:', 'data:', 'blob:', 'devtools:']);
const NETWORK_SCHEMES = new Set(['http:', 'https:', 'ws:', 'wss:']);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** True when a request stays on this machine (local schemes or an exact loopback host). */
function isAllowedRequest(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (LOCAL_SCHEMES.has(parsed.protocol)) return true;
  return NETWORK_SCHEMES.has(parsed.protocol) && LOOPBACK_HOSTS.has(parsed.hostname);
}

module.exports = { isAllowedRequest };
