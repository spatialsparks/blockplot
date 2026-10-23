// The test file (ST-016, rule 3): one box on a plot's ground, and the plot's outline, in Google
// Earth - at the place in LV95 that the command is given, for no plot's file says yet where it
// lies. The orchestrator runs it on the owner's plot and sends the owner the file; an agent runs
// it on the made-up plot alone.
//
//   pnpm sketch:kml <plot.json> <east> <north> <out.kml> [raise]
//
// It reads the plot's file by the one reader, writes the file nowhere inside the repository and
// over no file, and prints `Written: <out.kml>` - nothing of the plot: no name, no figure, no
// place. A refusal is one sentence, on the error stream, with nothing written. try.check.js
// proves it.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { isLV95 } from '../new-plot/frame.js';
import { read } from '../plot-file.js';
import { kmlOf } from './kml.js';
import { ACCURACY_M } from './wgs84.js';

/** The box of the test file: so many metres along the plot's x and y, so high, red and solid. */
export const TRIAL_SIDE_M = 8;
export const TRIAL_HIGH_M = 6;
const TRIAL = {
  colour: '#ff0000',
  see: 'solid',
  name: "Test box, 8 by 8 by 6 m, on the plot's ground",
};
// The repository: the folder three up from this script. A plot's file is never written into it.
const REPOSITORY = fileURLToPath(new URL('../../../', import.meta.url));

const SAID = {
  usage: 'Say: pnpm sketch:kml <plot.json> <east> <north> <out.kml> [raise].',
  place:
    "The place is no place of LV95: an east from 2 000 000 to under 3 000 000 and a north from 1 000 000 to under 2 000 000 - LV03's figures have six digits.",
  raise: 'The raise is no number of metres.',
  inside: (out) => `${out} lies inside the repository: a file of a plot is never written there.`,
  unread: "The plot's file cannot be read.",
  there: (out) => `A file lies at ${out} already: the command writes over none.`,
};

/** A text as a number, where it is one: not blank, and finite. */
const numberOf = (text) => (text.trim() === '' ? NaN : Number(text));
/** Whether a path lies inside the repository: a path on another drive lies outside. */
function inside(out) {
  const relative = path.relative(REPOSITORY, path.resolve(out));
  return !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

/**
 * The box and the outline of a site's test file. The box is `TRIAL_SIDE_M` by `TRIAL_SIDE_M`
 * along the plot's x and y and `TRIAL_HIGH_M` high, its middle the mean of the outline's
 * corners, and its foot the plot's ground at the grid point of the paper nearest that middle -
 * `baseM` plus that point's centimetres of `rowsCm`, a row from y = yToM down and in it a height
 * from x = xFromM on. The outline is the site's.
 */
export function trialOf(site) {
  const { outline, cellM, xFromM, xToM, yFromM, yToM, ground } = site;
  const middle = [0, 1].map(
    (axis) => outline.reduce((sum, corner) => sum + corner[axis], 0) / outline.length,
  );
  const nearest = (offM, spanM) => Math.min(Math.max(Math.round(offM / cellM), 0), spanM / cellM);
  const column = nearest(middle[0] - xFromM, xToM - xFromM);
  const row = nearest(yToM - middle[1], yToM - yFromM);
  const cm = Number(ground.rowsCm[row].split(' ')[column]);
  const footM = (ground.baseM * 100 + cm) / 100;
  const half = TRIAL_SIDE_M / 2;
  const box = {
    min: [middle[0] - half, middle[1] - half, footM],
    max: [middle[0] + half, middle[1] + half, footM + TRIAL_HIGH_M],
    ...TRIAL,
  };
  return { box, outline };
}

/**
 * The command, of its arguments: `{ written }`, the path of the file written, or `{ refused }`,
 * one sentence - with nothing written.
 */
export function trial([plot, eastText, northText, out, raiseText = '0', ...more]) {
  if (out === undefined || more.length > 0) return { refused: SAID.usage };
  const place = [numberOf(eastText), numberOf(northText)];
  if (!isLV95(place)) return { refused: SAID.place };
  const raiseM = numberOf(raiseText);
  if (!Number.isFinite(raiseM)) return { refused: SAID.raise };
  if (inside(out)) return { refused: SAID.inside(out) };
  let text;
  try {
    text = fs.readFileSync(plot, 'utf8');
  } catch {
    return { refused: SAID.unread };
  }
  const { site, refused } = read(text);
  if (refused !== undefined) return { refused };
  const { box, outline } = trialOf(site);
  const kml = kmlOf({
    name: `${site.name} — test box`,
    about: aboutOf(raiseM),
    place: { originLV95: place, bearingDeg: site.bearingDeg },
    raiseM,
    boxes: [box],
    outline,
  });
  try {
    fs.writeFileSync(out, kml, { flag: 'wx' });
  } catch (error) {
    return {
      refused:
        error.code === 'EEXIST' ? SAID.there(out) : `${out} cannot be written: ${error.code}.`,
    };
  }
  return { written: out };
}

/** The lines of the file's description. */
const aboutOf = (raiseM) => [
  "A test file of the sketch pad: one box on the plot's ground, and the plot's outline.",
  `The box is ${TRIAL_SIDE_M} by ${TRIAL_SIDE_M} by ${TRIAL_HIGH_M} m, turned with the plot, its middle the middle of the outline's corners, its foot the plot's ground there, in metres above sea level.`,
  `Raised by ${raiseM} m: the raise was tuned by nobody yet.`,
  `Places to within ${ACCURACY_M.toFixed(1)} m, by swisstopo's approximate formulas from LV95 to WGS84.`,
];

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { written, refused } = trial(process.argv.slice(2));
  if (refused !== undefined) {
    process.stderr.write(`${refused}\n`);
    process.exitCode = 1;
  } else process.stdout.write(`Written: ${written}\n`);
}
