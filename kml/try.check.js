// The check of try.js, the test file: `trialOf` on the made-up plot, worked out by hand, and the
// command - what it writes and prints, and each refusal, with nothing written - in a folder of
// the system's temporary files, which it takes away however it ends. It reads the made-up plot
// alone, and asks nobody.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { read } from '../plot-file.js';
import { TRIAL_HIGH_M, TRIAL_SIDE_M, trial, trialOf } from './try.js';

const TRY = fileURLToPath(new URL('./try.js', import.meta.url));
const EXAMPLE = fileURLToPath(new URL('../example/plot.json', import.meta.url));
const REPOSITORY = fileURLToPath(new URL('../../../', import.meta.url));
const { site } = read(fs.readFileSync(EXAMPLE, 'utf8'));

// By hand: the outline's six corners, (2, 6), (2, 23), (36, 23), (36, 9), (29, 3), (12, 3), have
// their mean at x 117 / 6 = 19.5 and y 67 / 6. The nearest grid point: column (19.5 + 4) / 0.5 =
// 47, row (28 - 67 / 6) / 0.5 = 33.67, so 34 - where the made-up plane is 1400 - 10 * 47 - 2 * 34
// = 862 cm over 806 m: the foot 814.62 m, the top 820.62 m.
const { box, outline } = trialOf(site);
assert.deepEqual([TRIAL_SIDE_M, TRIAL_HIGH_M], [8, 6]);
assert.deepEqual(outline, site.outline);
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-9, `${value}`);
[15.5, 67 / 6 - 4, 814.62].forEach((value, at) => near(box.min[at], value));
[23.5, 67 / 6 + 4, 820.62].forEach((value, at) => near(box.max[at], value));
assert.deepEqual([box.colour, box.see], ['#ff0000', 'solid']);
assert.equal(box.name, "Test box, 8 by 8 by 6 m, on the plot's ground");
// The nearest grid point of the paper, where the middle lies off it: its edge. A made-up site of
// a paper 2 m by 1 m, a cell 0.5, a ground of 3 rows of 5 heights: the middle at x 5, y -1.
const SMALL = {
  outline: [
    [4, -2],
    [6, -2],
    [6, 0],
    [4, 0],
  ],
  cellM: 0.5,
  xFromM: 0,
  xToM: 2,
  yFromM: 0,
  yToM: 1,
  ground: { baseM: 500, rowsCm: ['0 1 2 3 4', '10 11 12 13 14', '20 21 22 23 24'] },
};
near(trialOf(SMALL).box.min[2], 500.24);

const folder = fs.mkdtempSync(path.join(tmpdir(), 'kml-try-'));
try {
  // The command: one line, the file written - the box and the outline, at its heights raised.
  const out = path.join(folder, 'trial.kml');
  const run = spawnSync(process.execPath, [TRY, EXAMPLE, '2600000', '1200000', out, '-2.5'], {
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, `Written: ${out}\n`);
  assert.equal(run.stderr, '');
  const text = fs.readFileSync(out, 'utf8');
  assert.equal(text.split('<Placemark>').length, 3);
  assert.equal(text.split('<Polygon>').length, 7);
  assert.ok(text.includes(',812.12 ') && text.includes(',818.12 '), 'the foot and the top, -2.5 m');
  assert.ok(text.includes('<name>Made-up hillside plot — test box</name>'));
  assert.ok(text.includes('Raised by -2.5 m: the raise was tuned by nobody yet.'));
  assert.ok(text.includes('Places to within 4.5 m'));
  // With no raise, none.
  assert.deepEqual(trial([EXAMPLE, '2600000', '1200000', path.join(folder, 'none.kml')]), {
    written: path.join(folder, 'none.kml'),
  });
  assert.ok(fs.readFileSync(path.join(folder, 'none.kml'), 'utf8').includes(',814.62 '));

  // A refusal: one sentence on the error stream, nothing on the other, and nothing written.
  const refusedRun = spawnSync(
    process.execPath,
    [TRY, EXAMPLE, '600000', '200000', path.join(folder, 'lv03.kml')],
    {
      encoding: 'utf8',
    },
  );
  const LV03 =
    "The place is no place of LV95: an east from 2 000 000 to under 3 000 000 and a north from 1 000 000 to under 2 000 000 - LV03's figures have six digits.";
  assert.deepEqual([refusedRun.status, refusedRun.stdout, refusedRun.stderr], [1, '', `${LV03}\n`]);
  // Each refusal, and where the file would be, nothing.
  const NOT_JSON = path.join(folder, 'not.json');
  fs.writeFileSync(NOT_JSON, 'no plot');
  const there = path.join(folder, 'there.kml');
  fs.writeFileSync(there, 'kept');
  const insideOut = path.join(REPOSITORY, 'tools', 'sketch', 'kml', 'inside.kml');
  const REFUSALS = [
    [
      [EXAMPLE, '2600000', '1200000'],
      'Say: pnpm sketch:kml <plot.json> <east> <north> <out.kml> [raise].',
    ],
    [[EXAMPLE, '600000', '200000', 'w.kml'], LV03],
    [[EXAMPLE, '2600000', '', 'w.kml'], LV03],
    [[EXAMPLE, '2600000', '1200000', 'w.kml', 'up'], 'The raise is no number of metres.'],
    [[EXAMPLE, '2600000', '1200000', 'w.kml', ' '], 'The raise is no number of metres.'],
    [
      [EXAMPLE, '2600000', '1200000', insideOut],
      `${insideOut} lies inside the repository: a file of a plot is never written there.`,
    ],
    [
      [EXAMPLE, '2600000', '1200000', REPOSITORY],
      `${REPOSITORY} lies inside the repository: a file of a plot is never written there.`,
    ],
    [
      [path.join(folder, 'none.json'), '2600000', '1200000', 'w.kml'],
      "The plot's file cannot be read.",
    ],
    [[NOT_JSON, '2600000', '1200000', 'w.kml'], 'It is no JSON.'],
    [
      [EXAMPLE, '2600000', '1200000', there],
      `A file lies at ${there} already: the command writes over none.`,
    ],
  ];
  for (const [args, said] of REFUSALS) {
    const answer = trial(args.map((arg) => (arg === 'w.kml' ? path.join(folder, arg) : arg)));
    assert.deepEqual(answer, { refused: said });
  }
  assert.ok(!fs.existsSync(insideOut) && !fs.existsSync(path.join(folder, 'w.kml')));
  assert.ok(!fs.existsSync(path.join(folder, 'lv03.kml')));
  assert.equal(fs.readFileSync(there, 'utf8'), 'kept');
} finally {
  fs.rmSync(folder, { recursive: true, force: true });
}

process.stdout.write(
  "tools/sketch/kml: the test file's box stands on the made-up plot where it is worked out by hand, the command prints one line, and it refuses a place of LV03, a raise that is none, a path inside the repository and a file that is there, with nothing written\n",
);
