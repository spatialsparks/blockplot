// The runner of the pad's checks: each *.check.js under this folder, outside any node_modules, in
// the order of their names, as a Node process of its own and on a clock. tools/sketch/check.js
// loads it last, after its own checks; it is no check to be run by hand.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import process from 'node:process';

// The clock of each check, in seconds. A check that starts a pad, or the stand-in, and waits for
// its line takes seconds; one that has not ended in two minutes waits for something that does not
// come - a pad that never says its line - and would hang the fast gate, and a session with it.
const CLOCK_S = 120;

const slashed = (file) => file.replaceAll('\\', '/');
const isCheck = (file) => file.endsWith('.check.js') && !file.split('/').includes('node_modules');
const checks = (files) => files.map(slashed).filter(isCheck).sort();
const names = ['b/x.check.js', 'check.js', 'b\\node_modules\\y.check.js', 'a.check.js', 'b/x.js'];
assert.deepEqual(checks(names), ['a.check.js', 'b/x.check.js']);
const found = checks(readdirSync(import.meta.dirname, { recursive: true }));
assert.match(found.join(' '), /\//, 'no check is found in the folders below this one');

// How a script ended, run on a clock of so many seconds: it passed, it failed, or it ran out of
// its time and was ended - and what it started may run still, for that is not ended with it.
const ended = (seconds, ...args) => {
  const run = spawnSync(process.execPath, args, { stdio: 'inherit', timeout: seconds * 1000 });
  if (run.error?.code === 'ETIMEDOUT') return 'ran out';
  return run.status === 0 ? 'passed' : 'failed';
};
assert.equal(
  ended(CLOCK_S, '-e', 'process.exit(1)'),
  'failed',
  'a check that fails goes unnoticed',
);
assert.equal(
  ended(1, '-e', 'setInterval(() => {}, 1000)'),
  'ran out',
  'a check that never ends is waited for',
);

// The first check that does not pass fails the gate; one that ran out of its clock is named.
const passes = (file) => {
  const how = ended(CLOCK_S, `${import.meta.dirname}/${file}`);
  if (how === 'ran out')
    process.stderr.write(
      `tools/sketch/${file} ran out of its ${CLOCK_S} seconds, and was ended: a server that it started may be running still.\n`,
    );
  return how === 'passed';
};
if (!found.every(passes)) process.exit(1);
