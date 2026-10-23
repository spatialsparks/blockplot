// The check of how the server gives the page of a new plot (ST-031, ST-041): serve.js as a process
// of its own, on a port the operating system picked, told that port alone - as
// plots-served.check.js starts it. The map's page comes at the pad's own address alone, with
// neither the policy nor the referrer as a header: it brings both itself, and learns whom it asks
// from its own address (T-041.2) - the server tells it nothing. The page is given under its own
// name alone, and under no plot's address. And the made-up pad answers the page with 204 and
// nothing, has nothing else of the map's folder, and gives its own pages as they were (T-041.4).
// Nothing is asked but these pads, on 127.0.0.1.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import { request } from 'node:http';
import { createServer } from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers';
import { HOST, MAP_PAGE, SWITCH } from '../routes.js';

const PAD = path.join(import.meta.dirname, '..');
const paths = ({ raw: [written] }) => written.trim().split(/\s+/);
const onDisk = (name) => fs.readFileSync(path.join(PAD, name));
// How long a pad may take to say its line, in milliseconds: it takes a tenth of a second.
const LIMIT_MS = 20_000;

/** A port of this machine that was free a moment ago. */
async function free() {
  const probe = createServer().listen(0, HOST);
  await once(probe, 'listening');
  const { port } = probe.address();
  await Promise.all([once(probe, 'close'), probe.close()]);
  return port;
}

/**
 * The pad as a process of its own, on a port that was free, and told that port alone: itself and
 * its port, once it has said its line - and again on another port, where that one was taken.
 */
async function start(switches, tries = 3) {
  const port = await free();
  const env = { ...process.env, PORT: String(port) };
  const pad = spawn(process.execPath, [path.join(PAD, 'serve.js'), ...switches], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // However this check ends, nothing it started outlives it.
  process.once('exit', () => pad.kill());
  const heard = { out: '', err: '' };
  pad.stdout.on('data', (text) => (heard.out += text));
  pad.stderr.on('data', (text) => (heard.err += text));
  const started = await new Promise((done) => {
    pad.on('close', () => done(false));
    pad.stdout.on('data', () => heard.out.includes('\n') && done(true));
    setTimeout(() => done(false), LIMIT_MS).unref();
  });
  if (started) return { pad, port };
  const taken = heard.err.includes('may be running already') && tries > 1;
  assert.ok(taken, `the pad did not say its line: ${heard.out}${heard.err}`);
  return start(switches, tries - 1);
}
/** Stops a pad that runs still - one that was stopped has no code, and a signal - and waits. */
async function stop(pad) {
  const runs = pad.exitCode === null && pad.signalCode === null;
  if (runs) await Promise.all([once(pad, 'close'), pad.kill()]);
}

// A pad, asked as its own page asks unless told otherwise: the status of its answer, the body as
// text and the headers. And who else may ask: an address typed in.
const said = (says, mode) => ({ 'sec-fetch-site': says, 'sec-fetch-mode': mode });
const [OWN, TYPED] = [said('same-origin', 'cors'), said('none', 'navigate')];
function asker(port) {
  return (target, { method = 'GET', ...headers } = OWN) =>
    new Promise((resolve, reject) => {
      const options = { host: HOST, port, path: target, method, headers, agent: false };
      const sent = request(options, (answer) => {
        const parts = [];
        const whole = () => [answer.statusCode, `${Buffer.concat(parts)}`, answer.headers];
        answer.on('data', (part) => parts.push(part)).on('end', () => resolve(whole()));
      });
      sent.on('error', reject).end();
    });
}
/** Holds that a pad's own pages come with no policy and no referrer of the server's. */
async function ownPages(ask) {
  for (const target of paths`/ /index.html /3d.html /sketch.js /frame.css`) {
    const [status, , says] = await ask(target, TYPED);
    const sent = [says['content-security-policy'], says['referrer-policy']];
    assert.deepEqual([status, ...sent], [200, undefined, undefined], target);
  }
}

const HTML = 'text/html; charset=utf-8';
assert.equal(MAP_PAGE, 'map/index.html');
const PAGE = onDisk(MAP_PAGE).toString();
const MAP_AT = paths`/map/index.html /map/index.html?as=asked /map/index.html?asks=5123`;

let running = null;
try {
  // The map's page: the file, at the pad's own address - to whom a page is given, an address
  // typed in among them - with neither the policy nor the referrer as a header, which the page
  // brings itself, and with every file's own: no frame. A page of another site gets nothing,
  // and the page is given by GET alone.
  running = await start([]);
  let ask = asker(running.port);
  for (const target of MAP_AT) {
    for (const who of [OWN, TYPED, {}]) {
      const [status, body, says] = await ask(target, who);
      assert.deepEqual([status, says['content-type'], body === PAGE], [200, HTML, true], target);
      const sent = [says['content-security-policy'], says['referrer-policy']];
      assert.deepEqual([...sent, says['x-frame-options']], [undefined, undefined, 'DENY'], target);
    }
    const others = [said('cross-site', 'no-cors'), said('same-site', 'cors')];
    for (const who of [...others, { ...OWN, method: 'POST' }]) {
      assert.equal((await ask(target, who))[0], 403, target);
    }
  }
  // Nor does any other file of the pad: its own pages are as they were.
  await ownPages(ask);
  // And the page is given under its own name alone - a disk may take `Map` for `map` - and
  // under no plot's address: the server gives none (ST-040).
  for (const target of paths`/Map/index.html /MAP/index.html /map/INDEX.html /map/Index.html
    /plots/terrace/Map/index.html /plots/nowhere/map/index.html /plots/no-json/map/index.html
    /plots/Terrace/map/index.html /map/ /map /map/index.htm /map/map/index.html
    /plots/terrace/map/index.html /plots/home/map/index.html /plots/example/map/index.html`) {
    assert.equal((await ask(target, TYPED))[0], 404, target);
  }
  await stop(running.pad);

  // The made-up pad: its page of a new plot is nothing - 204, with no body and no type, to whom
  // a page is given - so that a page that asks for it has no error on its console and no New
  // plot (open-plot.js); a page of another site gets nothing, and the page is given by GET alone.
  // It has nothing else of the map's folder, under whatever letters; its pages are as they were.
  running = await start([SWITCH]);
  ask = asker(running.port);
  for (const target of MAP_AT) {
    for (const who of [OWN, TYPED, {}]) {
      const [status, body, says] = await ask(target, who);
      assert.deepEqual([status, body, says['content-type']], [204, '', undefined], target);
    }
    for (const who of [said('cross-site', 'cors'), { ...OWN, method: 'POST' }]) {
      assert.equal((await ask(target, who))[0], 403, target);
    }
  }
  for (const target of paths`/plots/example/map/index.html /Map/index.html /map/INDEX.html
    /map/map.js /map/page.js /map/map.css /plots/example/map/map.css /map/ /map`) {
    for (const who of [OWN, TYPED]) assert.equal((await ask(target, who))[0], 404, target);
  }
  await ownPages(ask);
  await stop(running.pad);
} finally {
  if (running) await stop(running.pad);
}

process.stdout.write(
  "tools/sketch/swisstopo: the pad gives the page of a new plot under its own name alone, with no header of its own, and the made-up pad answers it with 204 and has nothing else of the map's folder\n",
);
