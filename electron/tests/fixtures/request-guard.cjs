'use strict';

// Loaded into Electron's main process with `-r`, before the app's own code runs, so no request
// can precede it. Records every URL in globalThis.__requestLog and cancels Chromium-stack
// requests that leave the machine. Node-level HTTP is recorded only (it cannot be cancelled here);
// the test process fails the run on anything recorded that is not allowed.
const diagnostics = require('node:diagnostics_channel');
const { app, ipcMain, session } = require('electron');
const { isAllowedRequest } = require('../local-first.cjs');

const log = (globalThis.__requestLog = []);
const record = (build) => {
  try {
    log.push(String(build()));
  } catch {
    log.push('unparseable request');
  }
};

// Node's fetch (undici) and node:http(s) never pass through Chromium's session.
diagnostics.subscribe('undici:request:create', ({ request }) =>
  record(() => new URL(request.path, request.origin).href),
);
diagnostics.subscribe('http.client.request.start', ({ request }) =>
  record(() => `${request.protocol}//${request.host}${request.path}`),
);

// The Updates page lists GitHub releases from the main process, which Playwright cannot route.
// Answer that one IPC call locally. Wrapping the registration (rather than replacing the handler
// afterwards) cannot race the app's own startup, which would otherwise throw "second handler".
const registerHandler = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, listener) =>
  registerHandler(channel, channel === 'updates:listReleases' ? () => [] : listener);

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    log.push(details.url);
    callback({ cancel: !isAllowedRequest(details.url) });
  });
});
