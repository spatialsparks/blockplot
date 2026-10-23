// The check of what the server gives, and of what it gives no more (ST-030, ST-040, ST-041):
// serve.js as a process of its own, on a port the operating system picked, told that port alone
// and started in a folder of its own in the system's temporary files. It is a plain file server:
// the pad's pages, scripts and stylesheets, and three.js under three/, each the file on the disk -
// and no plot. It says one line as it starts. No site.js under whatever case, no list of the
// plots, nothing under a plot's address, and nothing sent on: 404, with no 302. No kept sketch
// (T-040.5): under /kept/ and a plot's /kept/ 404 by GET and 403 by every other method, on either
// pad. No plot made (T-041.4): New plot's old /new-plot/ 404 by GET and 403 by every other method,
// as any path is, on either pad. The map's page as routes.js says it: the page on the one pad, and
// on the made-up pad 204 with no body. Nothing is written - not where the pad was started - and of
// this checkout nothing changed: not the pad's folder, and nothing of design/ - asked, and never
// printed; and serve.js names neither design/ nor a setting but PORT.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { HOST, SWITCH } from './routes.js';

const HERE = import.meta.dirname;
const ROOT = path.join(HERE, '..', '..');
const DEEP = { recursive: true };
const GONE = { ...DEEP, force: true, maxRetries: 5 };
const JS = 'text/javascript; charset=utf-8';
const paths = ({ raw: [written] }) => written.trim().split(/\s+/);

// What a folder holds, at whatever depth: each thing by its name, its size and when it was
// written - one text, to be held against what it was. Never printed: of this checkout it is
// asked of the pad's own folder, where a plot of the owner's lay, and of design/, where one lies.
const lying = (folder) => {
  const said = (name) => {
    const { size, mtimeMs } = fs.statSync(path.join(folder, name));
    return [name, size, mtimeMs].join(' ');
  };
  const all = fs.existsSync(folder) ? fs.readdirSync(folder, DEEP) : [];
  return all
    .filter((name) => !name.includes('node_modules'))
    .map(said)
    .join();
};
const CHECKOUT = [HERE, path.join(ROOT, 'design')];
const lay = CHECKOUT.map(lying);

// Where the pad is started: a folder of this check's own, empty, which no request writes into.
const started = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'blockplot-started-')));

// The server, asked as its own page asks unless told otherwise: the status of its answer, the
// body and the headers. And who else may ask: an address typed in, and a page of another site.
let port = 0;
const said = (says, mode) => ({ 'sec-fetch-site': says, 'sec-fetch-mode': mode });
const [OWN, TYPED] = [said('same-origin', 'no-cors'), said('none', 'navigate')];
const ask = (target, { method = 'GET', ...headers } = OWN, body = undefined) =>
  new Promise((resolve, reject) => {
    const options = { host: HOST, port, path: target, method, headers, agent: false };
    const sent = request(options, (answer) => {
      const parts = [];
      answer.on('data', (part) => parts.push(part));
      answer.on('end', () => resolve([answer.statusCode, Buffer.concat(parts), answer.headers]));
    });
    sent.on('error', reject).end(body);
  });
const statusOf = async (target, how, body) => (await ask(target, how, body))[0];

/**
 * The pad as a process of its own, on a port that was free - started in a folder of its own, and
 * told that port alone: itself, and what it says, from its first line on.
 */
async function start(asked, tries = 3) {
  const probe = createServer().listen(0, HOST);
  await once(probe, 'listening');
  ({ port } = probe.address());
  await Promise.all([once(probe, 'close'), probe.close()]);
  const env = { ...process.env, PORT: String(port) };
  const how = { cwd: started, env, stdio: ['ignore', 'pipe', 'pipe'] };
  const pad = spawn(process.execPath, [path.join(HERE, 'serve.js'), ...asked], how);
  // However this check ends, nothing it started outlives it.
  process.once('exit', () => pad.kill());
  let heard = '';
  for (const one of [pad.stdout, pad.stderr]) one.on('data', (text) => (heard += text));
  const listens = await new Promise((done) => {
    pad.on('close', () => done(false));
    pad.stdout.on('data', () => heard.includes('\n') && done(true));
  });
  assert.ok(listens || tries > 1, `serve.js did not start on a free port: ${heard}`);
  return listens ? { pad, said: () => heard } : start(asked, tries - 1);
}
const stop = async (pad) =>
  pad.exitCode === null && pad.signalCode === null && Promise.all([once(pad, 'close'), pad.kill()]);

// The pad's own files, as its three pages name them - but the site, which is no file - and what
// a page loads beside them: read off the pages, so that a script that is added is asked for too.
const onDisk = (name) =>
  fs.readFileSync(path.join(HERE, name.replace(/^three\//, 'node_modules/$&')));
const PAGES = ['index.html', '3d.html', 'info.html'];
const pages = PAGES.map((name) => onDisk(name).toString());
const NAMED = /(?:src|href)="([\w./-]+\.(?:js|css))"/g;
const named = pages.flatMap((page) => [...page.matchAll(NAMED)].map(([, name]) => name));
assert.ok(
  named.length > 40 && named.filter((name) => name === 'site.js').length === 3,
  named.join(),
);
const FILES = [...new Set(named)].filter((name) => name !== 'site.js');
FILES.push(...PAGES, 'scene/scene.js', 'three/build/three.module.js');

// What no pad gives, whoever asks: the plot's script, under whatever case; the list; every page,
// script and stylesheet under a plot's address, of a plot there is or not, and the address
// without its slash; a plot's own file, a kept sketch by its place on the disk. Each 404, with no
// address to be sent on to. A query is never read: /?no-plot=terrace is the pad's page, as / is.
const NO_FILE = paths`
  /site.js /SITE.js /Site.js /site.js?as=before /plots/ /plots/?as=asked /plots/terrace
  /plots/terrace/ /plots/terrace/index.html /plots/terrace/3d.html /plots/terrace/info.html
  /plots/terrace/sketch.js /plots/terrace/site.js /plots/terrace/frame.css /plots/home/
  /plots/example/ /plots/example/3d.html /plots/nowhere/ /plots/nowhere/index.html
  /plots/My%20plot/3d.html /plots/terrace/three/build/three.module.js /plots/terrace/plot.json
  /plots/terrace/sketches/plan.json /plot.json /example/plot.json /plots/../ /plots//site.js`;
const WHO = [OWN, TYPED, {}];
/** Holds what a pad gives and what it does not: the pad's files, as they lie, and none of NO_FILE. */
async function gives() {
  for (const name of FILES) {
    const [status, body, says] = await ask(`/${name}`, TYPED);
    assert.ok(status === 200 && body.equals(onDisk(name)), `/${name}: another file`);
    if (name.endsWith('.js')) assert.equal(says['content-type'], JS, name);
  }
  for (const address of ['/', '/?no-plot=terrace']) {
    const [status, body, says] = await ask(address, TYPED);
    assert.ok(status === 200 && body.equals(onDisk('index.html')), `${address}: not the page`);
    assert.equal(says.location, undefined, address);
  }
  for (const target of NO_FILE) {
    for (const who of WHO) {
      const [status, , says] = await ask(target, who);
      assert.deepEqual([status, says.location], [404, undefined], target);
    }
  }
}

// Where the server kept sketches until T-040.5, it keeps none: for its own page, an address
// typed in, one with no word of the browser's and another site's page that opens the pad, 404 by
// GET and 403 by every other method - a file is given by GET alone - and for a stranger 403.
// Nothing is written: not into the copy, and no folder of the temporary files.
const STRANGERS = [said('cross-site', 'cors'), said('cross-site', 'no-cors')];
STRANGERS.push(said('same-site', 'cors'));
const KEPT = paths`/kept/ /kept/plan.json /kept/a%20b.json /plots/terrace/kept/
  /plots/terrace/kept/plan.json /plots/example/kept/ /plots/example/kept/plan.json`;
const METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];
const SKETCH = '{"space":6,"things":[],"floors":[],"notes":[],"on":{},"show":{}}';
const bodyOf = (method) => (['PUT', 'POST', 'PATCH'].includes(method) ? SKETCH : undefined);
/** Holds that nothing is kept, that no plot is made, and that no request writes a plot. */
async function guards() {
  const asking = [OWN, TYPED, {}, said('cross-site', 'navigate')].map((who) => [who, true]);
  for (const host of [HOST, `another-name:${port}`, `[::1]:${port}`])
    asking.push([{ ...OWN, host }, false]);
  asking.push(...STRANGERS.map((who) => [who, false]));
  for (const target of KEPT) {
    for (const [who, its] of asking) {
      const asked = METHODS.map((method) => statusOf(target, { ...who, method }, bodyOf(method)));
      const nothing = METHODS.map((method) => (its && method === 'GET' ? 404 : 403));
      assert.deepEqual(await Promise.all(asked), nothing, `${target} ${JSON.stringify(who)}`);
    }
  }
  const keeps = path.join(tmpdir(), `blockplot-kept-${port}`);
  assert.ok(!fs.existsSync(keeps), 'a folder of kept sketches was made');
  // New plot's old address: a path as any other, of no file - 404 by GET, 403 by every other.
  for (const target of paths`/new-plot/ /new-plot /new-plot/?as=asked /New-plot/`) {
    for (const [who, its] of asking) {
      const asked = METHODS.map((method) => statusOf(target, { ...who, method }, bodyOf(method)));
      const nothing = METHODS.map((method) => (its && method === 'GET' ? 404 : 403));
      assert.deepEqual(await Promise.all(asked), nothing, `${target} ${JSON.stringify(who)}`);
    }
  }
  const PLOT = onDisk('example/plot.json');
  for (const [method, body] of [['PUT', PLOT], ['POST', PLOT], ['PATCH', PLOT], ['DELETE']]) {
    for (const target of paths`
      /plots/ /plots/terrace /plots/terrace/ /plots/terrace/plot.json /site.js
      /plots/new/ /plots/new/plot.json /plots/example/plot.json /example/plot.json`) {
      const status = await statusOf(target, { ...OWN, method }, body);
      assert.ok([403, 404].includes(status), `${method} ${target}: ${status}`);
    }
  }
  assert.deepEqual(fs.readdirSync(started), [], 'a request wrote where the pad was started');
}
// The map's page, by GET of the pad's own page: the page itself on the one pad, nothing on the
// made-up pad - 204, with no body and no type.
async function mapPage(demo) {
  const [status, body, says] = await ask('/map/index.html');
  if (!demo) assert.ok(status === 200 && body.equals(onDisk('map/index.html')), 'the map page');
  else assert.deepEqual([status, body.length, says['content-type']], [204, 0, undefined]);
}

let { pad, said: heard } = await start([]);
const lineOf = (madeUp) => `The sketch pad${madeUp}: http://${HOST}:${port} - Ctrl+C stops it.\n`;
try {
  // Told nothing but its port, it reads no plots and names none: serve.js imports routes.js alone
  // of the pad, and names no setting but PORT, nor design/, nor New plot's old address.
  const serveJs = onDisk('serve.js').toString();
  const imported = [...serveJs.matchAll(/^import .* from '([^']+)';$/gm)].map(([, name]) => name);
  assert.deepEqual(
    imported.filter((name) => !name.startsWith('node:')),
    ['./routes.js'],
  );
  assert.ok(!/design|PLOTS|ASKS|new-plot/.test(serveJs), 'what serve.js reads');
  await gives();
  await guards();
  await mapPage(false);
  await stop(pad);
  // It said one line, and that alone.
  assert.equal(heard(), lineOf(''));

  // The made-up pad: the same files, and the same nothing, but the map's page, which it answers
  // with nothing - no error on a page's console, and no New plot. It said its one line.
  ({ pad, said: heard } = await start([SWITCH]));
  await gives();
  await guards();
  await mapPage(true);
  await stop(pad);
  assert.equal(heard(), lineOf(', on the made-up plot'));
} finally {
  await stop(pad);
  fs.rmSync(started, GONE);
}
// And of this checkout nothing is another file than before: not in the pad's own folder, and
// not in design/, where the owner's plots lie.
assert.deepEqual(
  CHECKOUT.map((folder, at) => lying(folder) === lay[at]),
  [true, true],
  'the pad wrote into its own folder, or into design/',
);
process.stdout.write(
  "tools/sketch: the server gives the pad's files and three.js as they lie, says one line, and no plot - no site.js, no list, nothing under a plot's address, no kept sketch, no /new-plot/, nothing sent on - on either pad; the made-up pad answers the map's page with 204\n",
);
