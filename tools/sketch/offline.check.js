// The proof of the gate (ST-031, rule 3), with nothing sent: offline.js refuses every connection
// that leaves this machine, in the process that loads it and in every Node process which that
// one starts. First the rule alone, `beyond`: which call of connect leads where. Then a Node
// process that is started with the guard and asks an official host by its name, on a socket
// whose own lookup answers nothing: it is refused before that lookup is asked. The same process
// started without the guard asks the lookup - so this proof can fail - and a lookup that answers
// nothing sends nothing either. A process that the guarded one starts in turn is refused: the
// guard is in NODE_OPTIONS, once. 127.0.0.1 goes through. And of check.js the text: the guard is
// the first thing of the pad that it imports - which holds whichever way this check is run, by
// the gate or by hand. The host is taken from hosts.js: no check names one (named.check.js).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import net from 'node:net';
import process from 'node:process';
import { beyond } from './offline.js';
import { HOSTS } from './swisstopo/hosts.js';

const HOST = HOSTS.map;
const REFUSED = "The pad's checks ask this machine alone (ST-031, rule 3), so nothing was sent: ";

// The rule alone. A loopback address, written as an address, is this machine: by options, by a
// port and a host, and as `net.connect` hands them on, already read, in one list.
const THROUGH = [[{ host: '127.0.0.1', port: 4764 }], [4764, '127.0.0.1'], ['4764', '127.0.0.1']];
THROUGH.push([{ host: '127.5.6.7', port: 1 }], [{ host: '::1', port: 1 }], [1, '::1']);
THROUGH.push([[{ host: '127.0.0.1', port: 1 }, null]], [{ host: '127.0.0.1' }]);
for (const args of THROUGH) assert.equal(beyond(args), undefined, JSON.stringify(args));
// Everything else is beyond, and named: a name - `localhost` too, and what Node asks where it is
// given no host - an address of another machine, of every machine, a loopback address written
// any other way, and a pipe.
const pipe = ['\\\\.\\pipe\\pad', '\\\\elsewhere\\pipe\\pad', '/tmp/pad.sock'];
const BEYOND = [
  [[{ host: HOST, port: 443 }], `${HOST}:443`],
  [[443, HOST], `${HOST}:443`],
  [[[{ host: HOST, port: '443' }, null]], `${HOST}:443`],
  [[{ host: HOST }], HOST],
  [[{ host: 'localhost', port: 4764 }], 'localhost:4764'],
  [[{ port: 4764 }], 'localhost:4764'],
  [[4764], 'localhost:4764'],
  [[4764, ''], 'localhost:4764'],
  [[{}], 'localhost'],
  [[], 'localhost'],
  [[null], 'localhost'],
  [[{ host: '192.0.2.1', port: 80 }], '192.0.2.1:80'],
  [[{ host: '128.0.0.1', port: 80 }], '128.0.0.1:80'],
  [[{ host: '0.0.0.0', port: 80 }], '0.0.0.0:80'],
  [[{ host: '127.1', port: 80 }], '127.1:80'],
  [[{ host: '127.0.0.1.example.org', port: 80 }], '127.0.0.1.example.org:80'],
  [[{ host: '::ffff:127.0.0.1', port: 80 }], '[::ffff:127.0.0.1]:80'],
  [[{ host: '0:0:0:0:0:0:0:1', port: 80 }], '[0:0:0:0:0:0:0:1]:80'],
  [[{ host: '2001:db8::1', port: 443 }], '[2001:db8::1]:443'],
  [[{ path: pipe[0] }], pipe[0]],
  [[{ path: pipe[1], host: '127.0.0.1', port: 1 }], pipe[1]],
  [[pipe[0]], pipe[0]],
  [[pipe[2]], pipe[2]],
];
for (const [args, where] of BEYOND) assert.equal(beyond(args), where, JSON.stringify(args));

// A process that asks an official host by its name, on a socket whose own lookup answers
// nothing: it says whether it was refused, whether the lookup was asked, and what its
// NODE_OPTIONS are - and, handed its own text, starts itself once more and says what that said.
const ASKING = `
  import { spawnSync } from 'node:child_process';
  import net from 'node:net';
  import process from 'node:process';
  const [host, again] = process.argv.slice(1);
  const said = { refused: null, lookedUp: false, options: process.env.NODE_OPTIONS ?? '' };
  const socket = new net.Socket();
  socket.on('error', () => {});
  try {
    socket.connect({ host, port: 443, lookup: () => (said.lookedUp = true) });
  } catch (error) {
    said.refused = error.message;
  }
  if (said.refused === null && !said.lookedUp) await new Promise((done) => setTimeout(done, 500));
  socket.destroy();
  if (again !== undefined) {
    const how = ['--input-type=module', '-e', again, host];
    said.next = JSON.parse(spawnSync(process.execPath, how, { encoding: 'utf8' }).stdout);
  }
  process.stdout.write(JSON.stringify(said));
`;
// The order that loads the guard, as the guard itself writes it: its own address, as a file's.
const ORDER = `--import=${import.meta.resolve('./offline.js')}`;
const held = (options) => options.split(' ').filter((one) => one === ORDER).length;
/** What such a process said: started with these words before its text, and these NODE_OPTIONS. */
function started(before, options, ...after) {
  const how = [...before, '--input-type=module', '-e', ASKING, HOST, ...after];
  const env = { ...process.env, NODE_OPTIONS: options };
  const { status, stdout, stderr } = spawnSync(process.execPath, how, { env, encoding: 'utf8' });
  assert.equal(status, 0, stderr);
  return JSON.parse(stdout);
}

// Without the guard the lookup is asked, and nothing refuses: so the proof can fail.
assert.deepEqual(started([], ''), { refused: null, lookedUp: true, options: '' });
// With it - told in so many words, and by NODE_OPTIONS alone - the process is refused before
// the lookup is asked; and it holds the order once, after what its NODE_OPTIONS held.
const refused = { refused: `${REFUSED}${HOST}:443`, lookedUp: false };
const KEPT = '--no-warnings';
assert.deepEqual(started([ORDER], KEPT), { ...refused, options: `${KEPT} ${ORDER}` });
assert.deepEqual(started([ORDER], ''), { ...refused, options: ORDER });
assert.deepEqual(started([], ORDER), { ...refused, options: ORDER });
assert.deepEqual(started([], `${KEPT} ${ORDER}`), { ...refused, options: `${KEPT} ${ORDER}` });
// And a process that the guarded one starts in turn is refused: it was told by NODE_OPTIONS,
// which hold the order once still. Started so by a process that has no guard, it has none.
const next = { ...refused, options: `${KEPT} ${ORDER}` };
assert.deepEqual(started([ORDER], KEPT, ASKING), { ...next, next });
const unguarded = { refused: null, lookedUp: true, options: KEPT };
assert.deepEqual(started([], KEPT, ASKING), { ...unguarded, next: unguarded });

// This very process has the guard - loaded by the gate, or by this check - and its order once.
assert.equal(held(process.env.NODE_OPTIONS), 1);
let lookedUp = false;
const asking = () =>
  new net.Socket().connect({ host: HOST, port: 443, lookup: () => (lookedUp = true) });
assert.throws(asking, { message: `${REFUSED}${HOST}:443` });
assert.equal(lookedUp, false);
// And 127.0.0.1 goes through: a server of this check on a port that the system picked, asked.
const server = net.createServer((socket) => socket.end('through'));
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const heard = await new Promise((resolve, reject) => {
  const parts = [];
  const socket = net.connect(server.address().port, '127.0.0.1');
  socket.on('data', (part) => parts.push(part)).on('error', reject);
  socket.on('end', () => resolve(parts.join('')));
});
await Promise.all([once(server, 'close'), server.close()]);
assert.equal(heard, 'through');

// And of check.js the text: of what it imports, the first that is no module of Node's own is the
// guard - so every part of the gate, and every check that it starts, runs behind it.
const checkJs = fs.readFileSync(`${import.meta.dirname}/check.js`, 'utf8');
const imported = [...checkJs.matchAll(/^import\s[^;]*?'([^']+)';/gm)].map(([, from]) => from);
const own = imported.filter((from) => !from.startsWith('node:'));
assert.deepEqual(
  [own[0], own.filter((from) => from === './offline.js').length],
  ['./offline.js', 1],
);
assert.ok(imported.length > own.length && own.length > 1, 'what check.js imports was not read');

process.stdout.write(
  "tools/sketch: the pad's checks ask this machine alone - a name is refused before it is looked up, in a process that a check starts too, and 127.0.0.1 goes through\n",
);
