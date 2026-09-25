import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('.');
const port = Number(process.env.ACTIVATION_FIXTURE_PORT || 4181);
const apiOrigin = `http://127.0.0.1:${port + 1}`;
const fixtureKey = 'fixture-admin-key';
const fixtureCode = 'HEALTHCHECK_20260925';
let apiMode = 'success';
const legacyIndex = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>藍星科技開通網</title></head><body><main><h1>藍星科技開通網</h1><form id="generator-form"><input id="admin-key" type="password"><button type="submit">產生授權碼</button></form><p id="generator-status"></p></main><script src="app.js?v=20260925-1" defer></script></body></html>`;
const legacyApp = `document.querySelector('#generator-form')?.addEventListener('submit', event => { event.preventDefault(); document.querySelector('#generator-status').textContent = '授權服務連線失敗，請重新整理後再試。'; });`;
const legacyWorker = `
  const CACHE='shamie-app-fixture-old';
  const OLD_HTML=${JSON.stringify(legacyIndex)};
  const OLD_APP=${JSON.stringify(legacyApp)};
  self.addEventListener('install', event => event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.put(new URL('./index.html', self.registration.scope), new Response(OLD_HTML, {headers:{'content-type':'text/html'}}));
    await cache.put(new URL('./app.js?v=20260925-1', self.registration.scope), new Response(OLD_APP, {headers:{'content-type':'text/javascript'}}));
    await self.skipWaiting();
  })()));
  self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
      event.respondWith(caches.match(new URL('./index.html', self.registration.scope)));
    } else if (url.pathname.endsWith('/app.js')) {
      event.respondWith(caches.match(new URL('./app.js?v=20260925-1', self.registration.scope)));
    }
  });
`;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
  if (pathname === '/legacy-worker.js') {
    res.writeHead(200, {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'no-store',
      'service-worker-allowed': '/'
    });
    res.end(legacyWorker);
    return;
  }
  if (pathname === '/activation-api.json') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ apiBaseUrl: apiOrigin }));
    return;
  }
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(root, relativePath);
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    'content-type': mimeTypes[path.extname(file)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

const apiServer = http.createServer((req, res) => {
  const url = new URL(req.url, apiOrigin);
  const origin = req.headers.origin || '';
  const headers = {
    'access-control-allow-origin': origin || `http://127.0.0.1:${port}`,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, X-Admin-Key',
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8'
  };
  const send = (status, body = '') => {
    res.writeHead(status, headers);
    res.end(body);
  };
  if (url.pathname === '/health') {
    if (apiMode === 'health-network') { req.socket.destroy(); return; }
    if (apiMode === 'health-http') return send(503, JSON.stringify({ status: 'down' }));
    if (apiMode === 'health-schema') return send(200, JSON.stringify({ status: 'ok', service: 'unexpected' }));
    return send(200, JSON.stringify({ status: 'ok', service: 'lbot1-clean-production-v2' }));
  }
  if (url.pathname === '/api/admin/pairing-code' && req.method === 'OPTIONS') {
    if (apiMode === 'preflight') return send(403);
    return send(204);
  }
  if (url.pathname === '/api/admin/pairing-code' && req.method === 'POST') {
    if (apiMode === 'pairing-network') { req.socket.destroy(); return; }
    if (apiMode === 'pairing-401') return send(401, JSON.stringify({ ok: false }));
    if (apiMode === 'pairing-403') return send(403, JSON.stringify({ ok: false }));
    if (apiMode === 'pairing-404') return send(404, JSON.stringify({ ok: false }));
    if (apiMode === 'pairing-5xx') return send(503, JSON.stringify({ ok: false }));
    return send(200, JSON.stringify({ ok: true, code: fixtureCode, accessDays: 15, featureAccess: { wbs: false, github: false, sdVideo: false, sdCredits: 0 } }));
  }
  send(404, JSON.stringify({ ok: false }));
});
await new Promise((resolve) => apiServer.listen(port + 1, '127.0.0.1', resolve));

function apiResponse(route, status, body = '', contentType = 'application/json; charset=utf-8') {
  return route.fulfill({
    status,
    contentType,
    headers: {
      'access-control-allow-origin': `http://127.0.0.1:${port}`,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type, X-Admin-Key'
    },
    body
  });
}

async function routeRequests(page, mode = 'success') {
  const pairingRequests = [];
  apiMode = mode;
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/activation-api.json')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ apiBaseUrl: apiOrigin })
      });
    }
    if (url.origin !== apiOrigin) return route.continue();
    return route.continue();
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === apiOrigin && url.pathname === '/api/admin/pairing-code') pairingRequests.push(request.method());
  });
  return pairingRequests;
}

async function readDiagnostics(page) {
  return page.evaluate(() => Object.fromEntries([
    ['build', '#diagnostic-build-id'],
    ['app', '#diagnostic-app-js-version'],
    ['sw', '#diagnostic-sw-version'],
    ['controller', '#diagnostic-sw-controller'],
    ['stage', '#diagnostic-stage'],
    ['http', '#diagnostic-http-status'],
    ['error', '#diagnostic-error-code'],
    ['trace', '#diagnostic-stage-trace'],
    ['status', '#generator-status'],
    ['code', '#generated-code strong']
  ].map(([key, selector]) => [key, document.querySelector(selector)?.textContent || ''])));
}

async function openPage(browser, mode = 'success') {
  const context = await browser.newContext();
  const page = await context.newPage();
  const pairingRequests = await routeRequests(page, mode);
  const requestFailures = [];
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    requestFailures.push({ origin: url.origin, path: url.pathname, reason: request.failure()?.errorText || '' });
  });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForSelector('#diagnostic-build-id');
  return { context, page, pairingRequests, requestFailures };
}

async function submit(page) {
  await page.locator('#admin-key').fill(fixtureKey);
  await page.locator('#generator-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    document.querySelector('#diagnostic-stage')?.textContent === 'STAGE_8_UI_RENDER_SUCCESS'
    || document.querySelector('#diagnostic-error-code')?.textContent !== 'NONE'
  ), null, { timeout: 15000 });
  return readDiagnostics(page);
}

const browser = await chromium.launch({ headless: true });
const results = {};
try {
  {
    const { context, page, pairingRequests } = await openPage(browser);
    const result = await submit(page);
    results.TEST_A_FRESH_BROWSER = {
      build: result.build,
      app: result.app,
      stage: result.stage,
      error: result.error,
      codeVisible: result.code === fixtureCode,
      pairingRequests
    };
    if (result.stage !== 'STAGE_8_UI_RENDER_SUCCESS' || result.code !== fixtureCode) {
      throw new Error('fresh_browser_pairing_ui_failed');
    }
    await context.close();
  }

  for (const [mode, expectedError] of [
    ['health-network', 'E_HEALTH_NETWORK'],
    ['health-http', 'E_HEALTH_HTTP'],
    ['health-schema', 'E_HEALTH_SERVICE'],
    ['preflight', 'E_PAIRING_PREFLIGHT'],
    ['pairing-401', 'E_PAIRING_HTTP_401'],
    ['pairing-403', 'E_PAIRING_HTTP_403'],
    ['pairing-404', 'E_PAIRING_HTTP_404'],
    ['pairing-5xx', 'E_PAIRING_HTTP_5XX'],
    ['pairing-network', 'E_PAIRING_NETWORK']
  ]) {
    const { context, page } = await openPage(browser, mode);
    const result = await submit(page);
    results[`ERROR_${mode.toUpperCase().replaceAll('-', '_')}`] = {
      expected: expectedError,
      actual: result.error,
      stage: result.stage,
      http: result.http,
      status: result.status
    };
    if (result.error !== expectedError) throw new Error(`diagnostic_error_mismatch:${mode}`);
    await context.close();
  }

  {
    const { context, page, requestFailures } = await openPage(browser);
    await page.evaluate(() => navigator.serviceWorker.register('./legacy-worker.js', {
      scope: './',
      updateViaCache: 'none'
    }));
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
    await page.reload();
    await page.waitForFunction(() => !document.querySelector('#diagnostic-build-id'));
    const oldClient = await page.evaluate(() => ({
      title: document.title,
      oldAppTag: Boolean(document.querySelector('script[src*="20260925-1"]')),
      controlled: Boolean(navigator.serviceWorker.controller)
    }));

    await page.evaluate(async () => {
      await navigator.serviceWorker.register('./service-worker.js', {
        scope: './',
        updateViaCache: 'none'
      });
    });
    await page.reload();
    await page.waitForTimeout(1500);
    const upgradeState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        url: location.href,
        build: document.querySelector('#diagnostic-build-id')?.textContent || 'LEGACY',
        controller: navigator.serviceWorker.controller?.scriptURL || 'NONE',
        active: registration?.active?.scriptURL || 'NONE',
        installing: registration?.installing?.scriptURL || 'NONE',
        waiting: registration?.waiting?.scriptURL || 'NONE'
      };
    });
    if (upgradeState.build === 'LEGACY') {
      await page.reload();
      await page.waitForTimeout(500);
    }
    if (!(await page.locator('#diagnostic-build-id').count())) {
      console.error(JSON.stringify({ oldClient, upgradeState }, null, 2));
      throw new Error('existing_client_did_not_upgrade');
    }
    const upgraded = await submit(page);
    results.TEST_B_EXISTING_BROWSER = {
      oldClient,
      upgraded: {
        build: upgraded.build,
        app: upgraded.app,
        sw: upgraded.sw,
        controller: upgraded.controller,
        stage: upgraded.stage,
        error: upgraded.error,
        codeVisible: upgraded.code === fixtureCode
      }
    };
    if (oldClient.oldAppTag !== true
      || upgraded.build !== '20260925-activation-diag-01'
      || upgraded.app !== '20260925-2'
      || upgraded.stage !== 'STAGE_8_UI_RENDER_SUCCESS'
      || upgraded.code !== fixtureCode) {
      console.error(JSON.stringify({ oldClient, upgraded }, null, 2));
      console.error(JSON.stringify(requestFailures, null, 2));
      throw new Error('existing_browser_upgrade_failed');
    }
    await context.close();
  }

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => apiServer.close(resolve));
}
