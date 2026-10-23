// The check of the sketch pad's server. First its rule alone, routes.js, with nothing running:
// the mode and the port, every kind of path that gets a file, and every way of asking for more,
// which gets none. Then the server itself, serve.js, as a process of its own on a port the
// operating system picked: it gives the files the rule says, and refuses for a file what it
// always refused - another host name, another site's page, another method - and under /kept/,
// where it kept sketches until T-040.5, it has nothing. On the made-up plot alone, and with
// nothing left running: plots-served.check.js asks a pad with plots. Run by check.js.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import { connect, createServer } from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { HOST, PORTS, SWITCH, route, setting } from './routes.js';

const [HTML, CSS] = ['text/html; charset=utf-8', 'text/css; charset=utf-8'];
const JS = 'text/javascript; charset=utf-8';

// The mode and the port. No argument is the pad on its own port, --demo the made-up plot on its
// own. A PORT of the environment is listened on in either mode; named but empty, it is not named.
assert.equal(SWITCH, '--demo');
assert.deepEqual(PORTS, { pad: 4764, demo: 4765 });
assert.deepEqual(setting([], {}), { demo: false, port: 4764 });
assert.deepEqual(setting([SWITCH], {}), { demo: true, port: 4765 });
assert.deepEqual(setting([], { PORT: '5123' }), { demo: false, port: 5123 });
assert.deepEqual(setting([SWITCH], { PORT: '5123' }), { demo: true, port: 5123 });
assert.deepEqual(setting([], { PORT: '' }), { demo: false, port: 4764 });
assert.deepEqual(setting([SWITCH], { PORT: '' }), { demo: true, port: 4765 });
assert.deepEqual(setting([], { PORT: '1' }), { demo: false, port: 1 });
assert.deepEqual(setting([], { PORT: '65535' }), { demo: false, port: 65_535 });
// What is no port is refused, with no mode and no port given: nothing can listen by mistake.
for (const named of ['0', '65536', '-1', '4764.5', 'pad', '4764 4765', ' ']) {
  assert.deepEqual(setting([SWITCH], { PORT: named }), { refused: `PORT is "${named}", no port.` });
}
// So is an argument nobody knows - alone, and beside the switch and a port: it is never skipped.
for (const unknown of ['--dmeo', '--Demo', 'demo', '--demo=1', '--port', '']) {
  const said = { refused: `"${unknown}" is no switch of its. It has one, --demo.` };
  assert.deepEqual(setting([unknown], {}), said);
  assert.deepEqual(setting([SWITCH, unknown], { PORT: '5123' }), said);
}

// Every kind of path that gets a file: the file, from the pad's folder on, and its type. Each of
// them is there, on the disk: further down the server is asked for every one.
const three = (file) => [`/three/${file}`, `node_modules/three/${file}`, JS];
const GIVEN = [
  ['/', 'index.html', HTML],
  ['/index.html', 'index.html', HTML],
  ['/3d.html', '3d.html', HTML],
  ...['frame.css', 'pad.css', 'icons.css'].map((sheet) => [`/${sheet}`, sheet, CSS]),
  ['/sketch.js', 'sketch.js', JS],
  ['/kept.js', 'kept.js', JS],
  ['/scene/cut.check.js', 'scene/cut.check.js', JS],
  ['/view3d/main.js', 'view3d/main.js', JS],
  three('build/three.module.js'),
  three('build/three.core.js'),
  three('examples/jsm/controls/OrbitControls.js'),
  three('examples/jsm/libs/draco/draco_decoder.js'),
  // What stands after a `?` is not read.
  ['/index.html?and=more', 'index.html', HTML],
  ['/?', 'index.html', HTML],
];
for (const demo of [false, true]) {
  for (const [asked, file, type] of GIVEN) assert.deepEqual(route(asked, demo), { file, type });
}

// What gets no file, in either mode: paths as they are written here, a backslash a backslash.
const paths = ({ raw: [written] }) => written.trim().split(/\s+/);
// A letter that a disk may take for another one, by its number: the i with no dot, the long s.
const [DOTLESS_I, LONG_S] = [0x131, 0x17f].map((point) => String.fromCodePoint(point));
const REFUSED = {
  'two dots, or one': paths`
    /../site.js /scene/../site.js /.. /three/build/../package.json /three/../serve.js
    /./site.js /scene/./cut.js`,
  'two dots, encoded': paths`
    /%2e%2e/site.js /%2E%2E/site.js /.%2e/site.js /scene/%2e%2e/site.js /..%2fsite.js
    /%2e%2e%2fsite.js /%252e%252e/site.js /three/build/%2e%2e/package.json /%73ite.js`,
  'a backslash': paths`
    /..\site.js /scene\cut.js /scene/..\site.js \site.js /three\build\three.module.js
    /%5c..%5csite.js`,
  'a name that starts with a dot': paths`
    /.gitignore /.hidden.js /.3d.html /.git/config.js /scene/.hidden.js
    /three/build/.three.module.js`,
  'another type': paths`
    /CLAUDE.md /package.json /sketch /js /scene/html /index.htm /sketch.mjs /sketch.js.map
    /index.HTML /sketch.JS /three/build/three.cjs /three/build/three.module.html
    /three/examples/jsm/libs/draco/draco_decoder.wasm /three/examples/jsm/libs/draco/README.md`,
  'a folder two deep': paths`/a/b/c.js /scene/deeper/cut.js /view3d/a/b.html`,
  'a stylesheet that is none of the pad': paths`
    /view3d/deeper/frame.css /three/build/three.css /three/examples/jsm/libs/frame.css /.frame.css
    /view3d/.frame.css /frame.CSS /frame.Css /frame.scss /frame.css.map /frame.css. /framecss`,
  'three.js beyond its build and its addons': paths`
    /three/package.json /three/package.js /three/src/Three.js /three/build/deeper/three.module.js
    /three/examples/fonts/a.js /three/examples/a.js /three/examples/jsm.js /three/a.js /three
    /three/ /Three/build/three.module.js /three/Build/three.module.js`,
  "the pad's own node_modules": paths`
    /node_modules/three/build/three.module.js /node_modules/three.js /node_modules/a.js
    /Node_Modules/a.js /NODE_MODULES/a.html /node_modules`,
  'what is no path of the pad': [
    ...paths`
      index.html * //index.html /scene//cut.js /index.html/ /index.html#top /index.html%00
      /site.js%20 /site.js. /site..js /site.js::$DATA`,
    ...['', '/in dex.html', `/s${DOTLESS_I}te.js`, `/${LONG_S}ite.js`],
    ...[`http://${HOST}:${PORTS.pad}/index.html`, `//${HOST}:${PORTS.pad}/index.html`],
  ],
};
assert.deepEqual(REFUSED['a backslash'].slice(0, 2), ['/..\\site.js', '/scene\\cut.js']);
for (const [what, written] of Object.entries(REFUSED)) {
  for (const asked of written) {
    for (const demo of [false, true]) assert.equal(route(asked, demo), null, `${what}: ${asked}`);
  }
}
for (const no of [undefined, null, 7, ['/index.html']]) assert.equal(route(no, true), null);
// Under /kept/ the pad has no folder, and keeps no sketch (T-040.5): further down, 404.
const KEPT = paths`/kept/ /kept/index.html /kept/sketch.js /kept/plan.json /plots/terrace/kept/`;
// No path is made into a plot (ST-040): site.js is a name as any other, however it is written -
// the file of that name, which the pad's folder does not hold (example/own.check.js), and the
// same on either pad. The server has none to give: further down, 404.
const SITE_NAMES = ['/site.js', '/SITE.js', '/Site.js', '/sITE.js', '/site.js?as=before'];
for (const asked of SITE_NAMES) {
  const file = { file: asked.slice(1).split('?')[0], type: JS };
  assert.deepEqual([route(asked, false), route(asked, true)], [file, file]);
}
// And both give the same: plain names from the pad's folder on - for every path of this check,
// as it is written, in capitals and in small letters.
const INSIDE = /^[\w-]+(\.[\w-]+)*(\/[\w-]+(\.[\w-]+)*)*$/;
const tried = [...GIVEN.map(([asked]) => asked), ...Object.values(REFUSED).flat(), '/site.js'];
for (const asked of tried.flatMap((one) => [one, one.toUpperCase(), one.toLowerCase()])) {
  const [real, madeUp] = [route(asked, false), route(asked, true)];
  assert.deepEqual(real, madeUp, asked);
  assert.ok(madeUp === null || INSIDE.test(madeUp.file), asked);
}

// The server itself. How long it may take to say that it listens, or to stop; and how often a
// free port is looked for - one that was found free may be taken before the pad binds it.
const START_MS = 10_000;
const TRIES = 3;
// What every answer says: never from a cache, and for the pad's own page alone.
const FOR_ITS_PAGE = {
  'cache-control': 'no-store',
  'cross-origin-resource-policy': 'same-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

/** A port of this machine that nothing listens on: the operating system picks it. */
async function freePort() {
  const probe = createServer().listen(0, HOST);
  await once(probe, 'listening');
  const { port } = probe.address();
  probe.close();
  await once(probe, 'close');
  return port;
}

/** Whether nothing listens on a port of this machine: a knock there gets no answer. */
async function silent(port) {
  const knock = connect(port, HOST);
  const [answered] = await Promise.allSettled([once(knock, 'connect')]);
  knock.destroy();
  return answered.status === 'rejected';
}

/**
 * Runs the server with these arguments and this PORT until it says that it listens - `{ pad }` -
 * or stops: `{ code, said }`, how it ended and what it said on standard error.
 */
function run(asked, port) {
  const pad = spawn(process.execPath, [path.join(import.meta.dirname, 'serve.js'), ...asked], {
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // However this check ends, nothing it started outlives it.
  process.once('exit', () => pad.kill());
  const [heard, said] = [[], []];
  let late;
  return new Promise((resolve, reject) => {
    late = setTimeout(() => reject(new Error('serve.js neither listens nor stops')), START_MS);
    pad.stderr.on('data', (text) => said.push(text));
    pad.on('error', reject);
    // Closed, not only ended: by then all it said has been heard.
    pad.on('close', (code) => resolve({ code, said: said.join('') }));
    pad.stdout.on('data', (text) => {
      heard.push(text);
      if (heard.join('').includes(`http://${HOST}:${port} `)) resolve({ pad });
    });
  }).finally(() => clearTimeout(late));
}

/** Stops a server this check started, and is over when it has stopped. */
async function stop(pad) {
  const running = pad.exitCode === null && pad.signalCode === null;
  if (running) await Promise.all([once(pad, 'exit'), pad.kill()]);
}

/** The pad on the made-up plot, on a port that was free: `{ pad, port }`. */
async function madeUpPad() {
  for (let attempt = 1; ; attempt += 1) {
    const port = await freePort();
    const { pad, said } = await run([SWITCH], String(port));
    if (pad) return { pad, port };
    const taken = said.includes('may be running already') && attempt < TRIES;
    assert.ok(taken, `serve.js did not start on a free port: ${said}`);
  }
}

/** What the server answers to a path as it is written here: asked by GET and in its own name, unless told otherwise. */
function ask(port, target, { method = 'GET', ...headers } = {}) {
  return new Promise((resolve, reject) => {
    const options = { host: HOST, port, path: target, method, headers, agent: false };
    const sent = request(options, (answer) => {
      const parts = [];
      answer.on('data', (part) => parts.push(part));
      answer.on('end', () => {
        const { statusCode: status, headers: says } = answer;
        const guarded = Object.entries(FOR_ITS_PAGE).every(([name, value]) => says[name] === value);
        resolve({ status, says, guarded, body: Buffer.concat(parts) });
      });
    });
    sent.on('error', reject);
    sent.end();
  });
}

// It does not start with a switch nobody knows, nor on what is no port: it says why and ends
// with 1. Asked beside --demo and a free port: a server that skipped either would be a made-up
// pad on a port of its own, and this check would stop it.
const mistyped = await run([SWITCH, '--dmeo'], String(await freePort()));
const mistypedSaid = '"--dmeo" is no switch of its. It has one, --demo.';
assert.deepEqual(mistyped, { code: 1, said: `The sketch pad did not start: ${mistypedSaid}\n` });
const portless = await run([SWITCH], 'pad');
const portlessSaid = 'The sketch pad did not start: PORT is "pad", no port.\n';
assert.deepEqual(portless, { code: 1, said: portlessSaid });

const { pad, port } = await madeUpPad();
try {
  // What the rule gives, the server gives: that file's bytes, as that type.
  for (const [asked] of GIVEN) {
    const { file, type } = route(asked, true);
    const answer = await ask(port, asked);
    assert.equal(answer.status, 200, asked);
    assert.equal(answer.says['content-type'], type, asked);
    assert.ok(answer.guarded, `${asked}: not for the pad's own page alone`);
    // Yes or no: a file's bytes are no part of what a failure prints.
    const same = answer.body.equals(await readFile(path.join(import.meta.dirname, file)));
    assert.ok(same, `${asked} is not answered with ${file}`);
  }
  // What the rule refuses, the server refuses - asked as it is written here, where a request
  // can be: nothing works the dots out on the way. And it has no file where there is none - and
  // no site.js, under whatever case.
  const sendable = (asked) => /^\/[\x21-\x7e]*$/.test(asked);
  const refused = Object.values(REFUSED).flat().filter(sendable);
  const none = ['/no-such-file.js', '/three/build/no-such-file.js', ...SITE_NAMES, ...KEPT];
  for (const asked of [...refused, ...none]) {
    const answer = await ask(port, asked);
    assert.equal(answer.status, 404, asked);
    assert.ok(answer.guarded, asked);
  }

  // For its own page alone. Under another name - without the port, on another one, this
  // machine's other name, a made-up one - it gives nothing.
  for (const host of [HOST, `${HOST}:${port + 1}`, `[::1]:${port}`, `another-name:${port}`]) {
    const answer = await ask(port, '/index.html', { host });
    assert.equal(answer.status, 403, `asked as ${host}`);
    assert.ok(answer.guarded, host);
  }
  // Asked for as localhost, it sends on to the one address, with what was asked.
  const asLocalhost = await ask(port, '/3d.html?as=asked', { host: `localhost:${port}` });
  assert.equal(asLocalhost.status, 302);
  assert.equal(asLocalhost.says.location, `http://${HOST}:${port}/3d.html?as=asked`);
  // To another site's page it gives nothing, unless that only opens the pad; its own page and
  // the person at the address bar get what they ask for.
  const sites = [
    [403, { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'no-cors' }],
    [403, { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'cors' }],
    [403, { 'sec-fetch-site': 'cross-site' }],
    [200, { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate' }],
    [200, { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'no-cors' }],
    [200, { 'sec-fetch-site': 'none', 'sec-fetch-mode': 'navigate' }],
  ];
  for (const [status, headers] of sites) {
    const answer = await ask(port, '/sketch.js', headers);
    assert.equal(answer.status, status, Object.values(headers).join(', '));
  }
  // And a file by no method but GET, whoever asks: no PUT keeps a sketch, under /kept/ or anywhere.
  for (const method of ['POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']) {
    for (const headers of [{}, { 'sec-fetch-site': 'same-origin' }]) {
      assert.equal((await ask(port, '/index.html', { method, ...headers })).status, 403, method);
    }
  }
} finally {
  await stop(pad);
}
assert.ok(await silent(port), `something still listens on port ${port}`);

process.stdout.write('tools/sketch: its own page gets the pad and three.js, and no other file\n');
