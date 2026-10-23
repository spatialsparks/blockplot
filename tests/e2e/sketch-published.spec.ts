import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expect,
  keepAs,
  keptWindow,
  named,
  openFolder,
  pick,
  saved,
  test as folderTest,
} from './sketch-folder';

// The story's one end-to-end test (ST-044, Behaviour rows 3 and 4, rule 3; T-044.2): the pad as
// a plain web host is given it - written by tools/sketch/published.js into a folder of the
// system's temporary files, run with Node behind the gate of the pad's checks - and served by a
// plain file server of the case's own, under a path, as GitHub Pages serves a project's page:
// /blockplot/. In sketch-folder.ts's browser, on that address: the pad opens on the example, File
// has "New plot" - GET map/index.html answers 200 from where the page is - and the 3D page draws
// with three.js from /blockplot/three/; a made-up plot's folder is opened, a block drawn and kept
// into its sketches/; and every request of the browser went to that server, under /blockplot/.
// The map's page is not opened: it would ask swisstopo (tests/CLAUDE.md, invariant 7).

const fromRoot = (file: string): string => fileURLToPath(new URL(`../../${file}`, import.meta.url));
const PUBLISHED = fromRoot('tools/sketch/published.js');
const GATE = `--import=${new URL('../../tools/sketch/offline.js', import.meta.url).href}`;
// The path a project's page is served under, as the public repository's will be.
const UNDER = '/blockplot';
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};
const OTHER = 'application/octet-stream';
// three.js's revision is the middle figure of the version the pad's manifest names.
const manifest = JSON.parse(readFileSync(fromRoot('tools/sketch/package.json'), 'utf8')) as {
  dependencies: { three: string };
};
const [, REVISION = ''] = manifest.dependencies.three.split('.');
const KEY = JSON.stringify('blockplot/sketch/plot/terrace/space');

/** A file of the folder by the path a request names under UNDER, or null: no such file. */
function fileOf(root: string, pathname: string): string | null {
  const inside = decodeURIComponent(pathname.slice(UNDER.length + 1));
  const names = (inside === '' || inside.endsWith('/') ? `${inside}index.html` : inside).split('/');
  if (names.some((name) => name === '' || name === '.' || name === '..')) return null;
  const file = path.join(root, ...names);
  return statSync(file, { throwIfNoEntry: false })?.isFile() === true ? file : null;
}

/** As GitHub Pages answers: a folder its index.html, the bare path sent on with a slash, else 404. */
function answer(root: string, request: IncomingMessage, response: ServerResponse): void {
  const { pathname } = new URL(request.url ?? '/', 'http://any');
  if (pathname === UNDER) {
    response.writeHead(301, { Location: `${UNDER}/` }).end();
    return;
  }
  const file = pathname.startsWith(`${UNDER}/`) ? fileOf(root, pathname) : null;
  if (file === null) {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found.\n');
    return;
  }
  const type = TYPES[path.extname(file)] ?? OTHER;
  response.writeHead(200, { 'Content-Type': type }).end(readFileSync(file));
}

// The case's host: the pad written, served, and both taken away as the case ends. The browser on
// its address, under the path; and every request of that browser noted, and refused before it
// leaves where it is not to that host under that path.
const test = folderTest.extend<{ host: string; asked: string[] }>({
  host: async ({ playwright }, use) => {
    const made = mkdtempSync(path.join(tmpdir(), 'blockplot-published-'));
    const root = path.join(made, 'site');
    const server = createServer((request, response) => answer(root, request, response));
    const api = await playwright.request.newContext();
    try {
      execFileSync(process.execPath, [GATE, PUBLISHED, root]);
      await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
      const origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
      // The host answers as Pages does, before the browser is given it: the bare path sent on,
      // the folder its page, and nothing at the root.
      const bare = await api.get(`${origin}${UNDER}`, { maxRedirects: 0 });
      expect([bare.status(), bare.headers()['location']]).toEqual([301, `${UNDER}/`]);
      expect((await api.get(`${origin}${UNDER}/`)).status()).toBe(200);
      expect((await api.get(`${origin}/index.html`)).status()).toBe(404);
      await use(`${origin}${UNDER}/`);
    } finally {
      await api.dispose();
      await new Promise((done) => server.close(done));
      rmSync(made, { recursive: true, force: true, maxRetries: 5 });
    }
  },
  baseURL: async ({ host }, use) => use(host),
  asked: async ({ folders, host }, use) => {
    const asked: string[] = [];
    folders.browser.on('request', (request) => asked.push(request.url()));
    await folders.browser.route('**/*', (route) =>
      route.request().url().startsWith(host) ? route.fallback() : route.abort('blockedbyclient'),
    );
    await use(asked);
  },
});

test('the pad as published files, under a path: the example, New plot, 3D, and a sketch kept into a folder', async ({
  folders,
  asked,
  host,
}) => {
  // The example, and File with "New plot"; the 3D page with three.js from /blockplot/three/.
  const page = await folders.browser.newPage();
  await page.goto('./#top');
  await expect(page.locator('html[data-shown="example"]')).toHaveCount(1);
  await page.locator('#file-menu').click();
  await expect(page.locator('#new-plot')).toBeVisible();
  await page.goto('./3d.html');
  await expect(page.locator('body')).toHaveAttribute('data-three', REVISION);
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  expect(asked).toContain(`${host}three/build/three.module.js`);

  // The made-up terrace plot's folder, opened through File, Open plot; a block drawn from above.
  await folders.put('terrace');
  await page.goto('./#top');
  await openFolder(page, 'terrace');
  const [low, high] = await page.evaluate<[number, number]>('globalThis.paper.SPANS.side');
  page.once('dialog', (said) => void said.accept(String(Math.round((low + high) / 2))));
  await page.locator('#add').click();
  await expect(page.locator('#layers li')).toHaveCount(2);
  const paper = await page.locator('#paper').boundingBox();
  if (paper === null) throw new Error('the paper is not seen');
  const at = (part: number) =>
    [paper.x + paper.width * part, paper.y + paper.height * part] as const;
  await page.mouse.move(...at(0.45));
  await page.keyboard.press('b');
  await page.mouse.move(...at(0.46));
  await page.mouse.down();
  await page.mouse.move(...at(0.55), { steps: 4 });
  await page.mouse.up();
  const things = `JSON.parse(localStorage.getItem(${KEY}) ?? '{"things":[]}').things.length`;
  await expect.poll(() => page.evaluate<number>(things)).toBe(1);

  // Kept under a name: sketches/<name>.json in the folder, byte for byte what "Save file" saves.
  const name = named('Published block');
  expect(await keepAs(page, name)).toBe(`Kept in the folder terrace: sketches/${name}.json`);
  await keptWindow(page).shown.getByRole('button', { name: 'Close' }).click();
  const file = await folders.read('terrace', 'sketches', `${name}.json`);
  expect(file, 'no file in the folder').not.toBeNull();
  const bytes = await saved(page);
  expect(Buffer.from(file ?? '').equals(bytes), 'Keep wrote another file than "Save file"').toBe(
    true,
  );
  await pick(page.locator('#open-kept'));
  await expect(keptWindow(page).picks).toContainText([name]);

  // Every request went to the case's host, under /blockplot/: none to the root, none elsewhere.
  expect(asked.length).toBeGreaterThan(0);
  expect(asked.filter((url) => !url.startsWith(host))).toEqual([]);
});
