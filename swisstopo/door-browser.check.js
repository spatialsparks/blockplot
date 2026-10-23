// The check of the pad's door as a browser meets it (ST-041): door.js asks from a page of another
// origin as it asks from Node - the same requests, the same refusals in words - and the stand-in
// answers such a page as swisstopo answered the orchestrator's trial of 2026-10-20. What a page
// is shown of an answer is what as-a-browser.js shows: no header that the service does not
// expose, so no Content-Range of a part; no Location of a redirect; no answer at all without
// Access-Control-Allow-Origin. Five things: the door imports nothing of Node, and names a status
// in Node's words all the same; what it hands `fetch`; a part, a redirect and a refusal on
// servers of this check's own, each on 127.0.0.1 at a port that the system picked; the ground
// of the first hand case of a plot through the stand-in, by Node and as a browser, the same;
// and the stand-in's preflight. Nothing here leaves this machine, and no host is typed.
import '../offline.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { STATUS_CODES, createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { asABrowser } from './as-a-browser.js';
import { getBytes, getJson } from './door.js';
import { groundOf } from './ground.js';
import { fileAddress, tileName } from './hosts.js';
import { STATUS_WORDS } from './statuses.js';

// A case, under its title: where one fails, the title says which.
let cases = 0;
async function it(title, run) {
  cases += 1;
  try {
    await run();
  } catch (error) {
    throw new Error(`${title}: ${error.message}`, { cause: error });
  }
}
const { AbortSignal, Response } = globalThis;
const machines = globalThis.fetch;
/** What `run` gives with `ask` in the place of the machine's `fetch`, which comes back after. */
async function asking(ask, run) {
  globalThis.fetch = ask;
  try {
    return await run();
  } finally {
    globalThis.fetch = machines;
  }
}
const asABrowsersPage = (run) => asking(asABrowser(machines), run);
/** What a request was refused with - or that it was not - and why, where the door says. */
const refusal = (request) =>
  request.then(
    () => ({ words: 'no error' }),
    (error) => ({ words: error.message, cause: error.cause }),
  );

// What a script imports, by every way of writing it: each name, in its order.
const IMPORTED = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]|\brequire\s*\(/g;
const importsOf = (text) => [...text.matchAll(IMPORTED)].map((found) => found[1] ?? 'require(');
const textOf = (name) => readFileSync(path.join(import.meta.dirname, name), 'utf8');
const part = (first, last) => ({ range: { first, last } });
await it('imports nothing of Node, and names a status in the words of STATUS_CODES', () => {
  // The rule, proved on what it must find: an import of Node's, written three ways.
  const node = "import { STATUS_CODES } from 'node:http';\nimport('node:fs'); require('http');\n";
  assert.deepEqual(importsOf(node), ['node:http', 'node:fs', 'require(']);
  assert.deepEqual(importsOf(textOf('door.js')), ['./hosts.js', './statuses.js']);
  assert.deepEqual(importsOf(textOf('statuses.js')), []);
  // A copy, key for key and word for word, that nothing changes while the pad runs.
  assert.ok(Object.isFrozen(STATUS_WORDS));
  assert.deepEqual(STATUS_WORDS, { ...STATUS_CODES });
});

// What the door hands `fetch`, noted by a `fetch` of this check's own, which sends nothing.
const NOWHERE = 'http://127.0.0.1:9';
await it('hands fetch one GET with Range alone, no redirect followed, nothing of the person', async () => {
  const sent = [];
  const noted = (to, how) => {
    sent.push({ to: String(to), ...how, signal: how.signal instanceof AbortSignal });
    const aPart = { status: 206, headers: { 'content-range': 'bytes 2-5/16' } };
    const answer = how.headers.range ? new Response(new Uint8Array(4), aPart) : new Response('{}');
    return Promise.resolve(answer);
  };
  await asking(noted, async () => {
    assert.equal((await getBytes(NOWHERE, '/tile.tif', part(2, 5))).length, 4);
    assert.deepEqual(await getJson(NOWHERE, '/data.json'), {});
  });
  const asks = { redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer' };
  assert.deepEqual(sent, [
    { to: `${NOWHERE}/tile.tif`, ...asks, signal: true, headers: { range: 'bytes=2-5' } },
    { to: `${NOWHERE}/data.json`, ...asks, signal: true, headers: {} },
  ]);
});

// Servers of this check's own: each answers as `answer` says, and keeps the paths it was asked.
const servers = [];
async function serve(answer) {
  const asked = [];
  const server = createServer((request, response) => {
    asked.push(request.url);
    answer(request, response);
  });
  servers.push(server);
  await once(server.listen(0, '127.0.0.1'), 'listening');
  return { origin: `http://127.0.0.1:${server.address().port}`, asked };
}
// A file of sixteen bytes, each of them its own number; and what a service of the trial says.
const FILE = Uint8Array.from({ length: 16 }, (_, index) => index);
const ALLOWS = { 'access-control-allow-origin': '*', 'content-type': 'image/tiff' };
const answers = (status, headers, bytes) => (_request, response) =>
  response.writeHead(status, headers).end(bytes);
/** The bytes of FILE from `first` to before `end`, as a part that says so and its length. */
const aPart = (first, end) => {
  const says = { 'content-range': `bytes ${first}-${end - 1}/16`, 'content-length': end - first };
  return answers(206, { ...ALLOWS, ...says }, FILE.subarray(first, end));
};
const partOf = (origin, first, last) => refusal(getBytes(origin, '/tile.tif', part(first, last)));
const ANOTHER = 'The service answered with another part than bytes';

await it('takes a part of exactly the bytes asked, where its Content-Range is not shown', async () => {
  const { origin } = await serve(aPart(2, 6));
  // What a page is shown of it: its type and its length, and none of the rest.
  const seen = await asABrowser(machines)(`${origin}/tile.tif`, { redirect: 'manual' });
  assert.deepEqual([...seen.headers.keys()], ['content-length', 'content-type']);
  assert.deepEqual([seen.status, seen.type, (await seen.bytes()).join()], [206, 'cors', '2,3,4,5']);
  const bytes = await asABrowsersPage(() => getBytes(origin, '/tile.tif', part(2, 5)));
  assert.equal(bytes.join(), '2,3,4,5');
  // Node reads its Content-Range, and takes it too.
  assert.equal((await getBytes(origin, '/tile.tif', part(2, 5))).join(), '2,3,4,5');
});
await it('refuses a part one byte short, which cannot be told from another part there', async () => {
  const short = await serve(aPart(2, 5));
  const said = await asABrowsersPage(() => partOf(short.origin, 2, 5));
  assert.equal(said.words, `${ANOTHER} 2 to 5 - 3 bytes, called nothing: ${short.origin}/tile.tif`);
  // And so the end of a file, which Node takes for what its Content-Range says.
  const end = await serve(aPart(12, 16));
  assert.equal((await partOf(end.origin, 12, 40)).words, 'no error');
  const there = await asABrowsersPage(() => partOf(end.origin, 12, 40));
  assert.equal(
    there.words,
    `${ANOTHER} 12 to 40 - 4 bytes, called nothing: ${end.origin}/tile.tif`,
  );
});
await it('refuses the whole file for a part, as Node does', async () => {
  const { origin } = await serve(answers(200, ALLOWS, FILE));
  const words = `The service sent the whole file where a part was asked for: ${origin}/tile.tif`;
  assert.equal((await asABrowsersPage(() => partOf(origin, 0, 15))).words, words);
  assert.equal((await partOf(origin, 0, 15)).words, words);
});
await it('refuses a redirect that it is not shown, with the address, and asks nothing after it', async () => {
  const server = await serve((request, response) => {
    if (request.url !== '/tile.tif') return aPart(2, 6)(request, response);
    return response.writeHead(302, { ...ALLOWS, location: '/new.tif' }).end();
  });
  const said = await asABrowsersPage(() => partOf(server.origin, 2, 5));
  const words = `The service sends on elsewhere, and was not followed: ${server.origin}/tile.tif`;
  assert.equal(said.words, words);
  assert.deepEqual(server.asked, ['/tile.tif']);
});
await it('could not reach a service that does not allow every origin', async () => {
  const { origin } = await serve(
    answers(206, { 'content-range': 'bytes 2-5/16' }, FILE.subarray(2, 6)),
  );
  const said = await asABrowsersPage(() => partOf(origin, 2, 5));
  assert.equal(said.words, `The service could not be reached: ${origin}/tile.tif`);
  assert.ok(said.cause instanceof TypeError, said.cause);
});
const stopped = (server) =>
  [once(server, 'close'), server.close(), server.closeAllConnections()][0];
await Promise.all(servers.map(stopped));

// The stand-in for swisstopo, as ground.check.js starts it: on a port that the system picked.
const standIn = spawn(process.execPath, [path.join(import.meta.dirname, 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const soon = { signal: AbortSignal.timeout(20_000) };
const [, AT] = /^The stand-in for swisstopo: (\S+) - /.exec(
  await once(standIn.stdout, 'data', soon),
);
/** The ground of a box asked by `ask`, and what the stand-in was asked for it, in its order. */
async function read(box, ask) {
  await getJson(AT, '/asked?forget');
  const ground = await asking(ask, () => groundOf(AT, box));
  return { ground, asked: await getJson(AT, '/asked') };
}
await it('reads the ground of the first hand case of a plot as a browser as Node reads it', async () => {
  // E 2 599 997 to 2 600 045, N 1 200 003 to 1 200 053 (T-031.3): two tiles of two years.
  const box = { minE: 2_599_997, maxE: 2_600_045, minN: 1_200_003, maxN: 1_200_053 };
  const byNode = await read(box, machines);
  const byPage = await read(box, asABrowser(machines));
  assert.deepEqual([byPage.ground.heightsM.length, byPage.ground.heightsM[0].length], [102, 98]);
  // Height for height, and by the same GETs, target and range, in the same order.
  assert.deepEqual(byPage.ground, byNode.ground);
  assert.deepEqual(byPage.asked, byNode.asked);
  assert.equal(byPage.asked.length, 8);
  assert.ok(byPage.asked.every((one) => one.method === 'GET' && one.beside === 0));
  assert.ok(byPage.asked.slice(2).every((one) => one.range !== null));
});
await it('answers a preflight as swisstopo does, exposes no header, and notes the OPTIONS', async () => {
  const file = fileAddress(AT, tileName(2025, 2600, 1200));
  const preflight = {
    'access-control-request-method': 'GET',
    'access-control-request-headers': 'range',
  };
  await getJson(AT, '/asked?forget');
  const asked = await machines(file, { method: 'OPTIONS', headers: preflight });
  const [allows, methods, headers] = ['origin', 'methods', 'headers'].map((name) =>
    asked.headers.get(`access-control-allow-${name}`),
  );
  assert.deepEqual([asked.status, allows, methods, headers], [204, '*', 'GET', 'range']);
  assert.equal((await asked.bytes()).length, 0);
  // A part, and an OPTIONS that is no preflight for a GET, which is refused as any other method.
  const got = await machines(file, { headers: { range: 'bytes=0-16383' } });
  const other = await machines(file, { method: 'OPTIONS' });
  assert.deepEqual([got.status, (await got.bytes()).length, other.status], [206, 16_384, 405]);
  await other.bytes();
  for (const answer of [asked, got, other]) {
    assert.equal(answer.headers.get('access-control-expose-headers'), null);
  }
  const target = file.slice(AT.length);
  const none = { referer: null, cookie: null, origin: null, beside: 0 };
  assert.deepEqual(await getJson(AT, '/asked'), [
    { method: 'OPTIONS', target, range: null, ...none },
    { method: 'GET', target, range: 'bytes=0-16383', ...none },
    { method: 'OPTIONS', target, range: null, ...none },
  ]);
});
standIn.kill();

assert.equal(cases, 9);
process.stdout.write(
  `tools/sketch/swisstopo: the door asks as a browser's page as it asks from Node - it imports nothing of Node, sends nothing of the person's, takes a part by its length where its Content-Range is not shown, refuses a redirect it is not shown - and reads the ground of a plot from the stand-in, which answers a preflight and exposes no header, as swisstopo does: ${cases} cases\n`,
);
