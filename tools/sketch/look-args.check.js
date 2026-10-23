// The check of what `pnpm sketch:look` reads of its command line (ST-040, T-040.4), look-args.js,
// by hand and with nothing started: which plot - --demo, or --plot=<a plot's file>, one of the
// two, and neither or both refused in its one sentence - the three files, the width and the
// steps. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { argsOf, NO_PLOT, SWITCH, USAGE, WIDE } from './look-args.js';

const FILES = ['index.html#top', 'made-up.json', 'picture.png'];
const plain = (asked) => {
  const { steps, ...rest } = argsOf(asked);
  return { ...rest, steps: steps.map(({ text }) => text) };
};
const seen = { page: 'index.html#top', sketchFile: 'made-up.json', pictureFile: 'picture.png' };

// The made-up plot, or a plot's file, by its path as it is written - an = in it kept.
assert.equal(SWITCH, '--demo');
assert.deepEqual(plain([...FILES, SWITCH]), {
  ...seen,
  demo: true,
  plotFile: null,
  width: WIDE,
  steps: [],
});
const terrace = 'tests/__fixtures__/plots/terrace/plot.json';
assert.deepEqual(plain([`--plot=${terrace}`, ...FILES, '--width=900', 'key=2', 'wait=10']), {
  ...seen,
  demo: false,
  plotFile: terrace,
  width: 900,
  steps: ['key=2', 'wait=10'],
});
assert.equal(argsOf([...FILES, '--plot=a=b.json']).plotFile, 'a=b.json');

// Neither, or both, or two files: the one sentence, whatever else is right.
assert.match(NO_PLOT, /^A look is of the made-up plot, --demo, or of a plot's file, --plot=<file>/);
const NONE = [[...FILES], [...FILES, SWITCH, `--plot=${terrace}`]];
NONE.push([...FILES, '--plot=a.json', '--plot=b.json'], [...FILES, '--width=900', 'key=2']);
for (const asked of NONE) assert.throws(() => argsOf(asked), { message: NO_PLOT }, asked.join());
// What is no switch is refused before it: a mistyped --demo, a --plot with no file, --plot alone.
for (const unknown of ['--dmeo', '--plot=', '--plot', '--Demo', '--width=319', '--width=4001']) {
  const said = `"${unknown}" is no switch, or no width: ${USAGE}`;
  assert.throws(() => argsOf([...FILES, unknown]), { message: said }, unknown);
}
// Two files are not three, and a step that is none is said.
assert.throws(() => argsOf(['index.html', 'a.json', SWITCH]), /^Error: Three things are needed/);
for (const no of ['click=', 'key=', 'drag=1,2,3', 'wheel=1,2,0', 'wait=-1', 'jump=2']) {
  assert.throws(() => argsOf([...FILES, SWITCH, no]), { message: `"${no}" is no step: ${USAGE}` });
}
for (const step of [
  'click=#larger',
  'click=3,4',
  'sdrag=1,2,3,4',
  'rdrag=1,2,3,4',
  'wheel=1,2,-3',
]) {
  assert.equal(typeof argsOf([...FILES, SWITCH, step]).steps[0].act, 'function', step);
}

process.stdout.write(
  "tools/sketch: a look is of --demo or of --plot=<a plot's file>, one of the two, and refuses neither or both in one sentence\n",
);
