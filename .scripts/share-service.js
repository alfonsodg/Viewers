#!/usr/bin/env node

/**
 * OHIF Share Link Service — lightweight backend for public study sharing
 *
 * Provides a REST API for creating and validating share links.
 * Stores share data in a JSON file (for simplicity; replace with a database for production).
 *
 * Usage:
 *   node share-service.js [--port 8090] [--store shares.json]
 *
 * API:
 *   POST /api/shares          — Create a share link (requires auth header)
 *     Body: { studyInstanceUID, datasource?, mode?, expiresIn?, password? }
 *     Returns: { token, url, expiresAt }
 *
 *   GET  /api/shares/:token   — Validate a share link
 *     Returns: { studyInstanceUID, datasource, mode }
 *
 *   DELETE /api/shares/:token — Revoke a share link (requires auth header)
 *
 * Configuration (OHIF app-config.js):
 *   shareLinks: {
 *     enabled: true,
 *     apiEndpoint: 'http://localhost:8090/api/shares',
 *   }
 */

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const storeIdx = args.indexOf('--store');
const PORT = portIdx !== -1 ? parseInt(args[portIdx + 1]) : 8090;
const STORE_FILE = storeIdx !== -1 ? args[storeIdx + 1] : 'shares.json';

// Simple auth: check for Authorization header presence
const AUTH_TOKEN = process.env.SHARE_AUTH_TOKEN || 'changeme';

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveStore(store) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function generateToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function isAuthorized(req) {
  const auth = req.headers.authorization;
  return auth === `Bearer ${AUTH_TOKEN}`;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /api/shares — create share
  if (req.method === 'POST' && pathParts.join('/') === 'api/shares') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const body = await parseBody(req);
      if (!body.studyInstanceUID) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'studyInstanceUID is required' }));
        return;
      }

      const token = generateToken();
      const expiresIn = body.expiresIn || '7d';
      const ms = parseExpiry(expiresIn);
      const expiresAt = ms ? new Date(Date.now() + ms).toISOString() : null;

      const store = loadStore();
      store[token] = {
        studyInstanceUID: body.studyInstanceUID,
        datasource: body.datasource || null,
        mode: body.mode || null,
        expiresAt,
        createdAt: new Date().toISOString(),
      };
      saveStore(store);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token, expiresAt }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
    return;
  }

  // GET /api/shares/:token — validate share
  if (req.method === 'GET' && pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'shares') {
    const token = pathParts[2];
    const store = loadStore();
    const share = store[token];

    if (!share) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Share not found' }));
      return;
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      delete store[token];
      saveStore(store);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Share link has expired' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      studyInstanceUID: share.studyInstanceUID,
      datasource: share.datasource,
      mode: share.mode,
    }));
    return;
  }

  // DELETE /api/shares/:token — revoke share
  if (req.method === 'DELETE' && pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'shares') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const token = pathParts[2];
    const store = loadStore();
    if (store[token]) {
      delete store[token];
      saveStore(store);
    }
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function parseExpiry(str) {
  const match = str.match(/^(\d+)(h|d|m)$/);
  if (!match) {
    return null;
  }
  const [, num, unit] = match;
  const multipliers = { h: 3600000, d: 86400000, m: 60000 };
  return parseInt(num) * multipliers[unit];
}

server.listen(PORT, () => {
  console.error(`Share service running on http://localhost:${PORT}`);
  console.error(`Auth token: ${AUTH_TOKEN}`);
  console.error(`Store file: ${STORE_FILE}`);
});
