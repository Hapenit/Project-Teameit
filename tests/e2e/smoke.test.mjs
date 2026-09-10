import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const marketingDir = path.join(root, 'apps/marketing');
const webDir = path.join(root, 'apps/web');
const marketingPort = 4310;
const webPort = 4311;
const servers = [];

function start(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', () => {});
  servers.push(child);
  return child;
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status > 0) return;
    } catch {
      // The server may still be starting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function get(baseUrl, route) {
  return fetch(`${baseUrl}${route}`, { redirect: 'manual' });
}

before(async () => {
  start('npm', ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', String(marketingPort)], marketingDir);
  start('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(webPort)], webDir);
  await Promise.all([
    waitForServer(`http://127.0.0.1:${marketingPort}/`),
    waitForServer(`http://127.0.0.1:${webPort}/`),
  ]);
});

after(() => {
  for (const server of servers) server.kill('SIGTERM');
});

describe('marketing site', () => {
  const publicRoutes = [
    ['/', 'TeamEit'],
    ['/about', 'About'],
    ['/features', 'Features'],
    ['/pricing', 'Pricing'],
    ['/contact', 'Contact'],
    ['/login', 'Sign in'],
    ['/signup', 'Create your TEAMeIT account'],
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms'],
  ];

  for (const [route, expectedText] of publicRoutes) {
    it(`${route} is publicly reachable`, async () => {
      const response = await get(`http://127.0.0.1:${marketingPort}`, route);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /<main id="main">/);
      assert.match(html, new RegExp(expectedText, 'i'));
    });
  }

  it('exposes navigation links between public pages', async () => {
    const html = await (await get(`http://127.0.0.1:${marketingPort}`, '/')).text();
    for (const route of ['/features', '/pricing', '/about', '/contact', '/login']) {
      assert.match(html, new RegExp(`href="${route}"`));
    }
  });
});

describe('app route smoke checks', () => {
  const appRoutes = ['/login', '/signup', '/', '/crm', '/inbox', '/campaigns', '/analytics', '/settings'];

  for (const route of appRoutes) {
    it(`${route} serves the SPA shell for client-side navigation`, async () => {
      const response = await get(`http://127.0.0.1:${webPort}`, route);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /<div id="root"><\/div>/);
      assert.match(html, /src="\/assets\/.+\.js"/);
    });
  }
});
