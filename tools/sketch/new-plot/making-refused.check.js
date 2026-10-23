// The check of what a plot made in the page is refused with (ST-041, T-041.3): `plotMadeOf` of
// making.js, through what a page of another origin is shown of the answers
// (../swisstopo/as-a-browser.js), against the stand-in for swisstopo. Each refusal is the sentence
// that the server said for it (made-refused.check.js), typed in: fourteen orders that are none or
// have no paper, with nothing asked of the stand-in; and ground that does not come - the one cell
// without a height, the tile that there is not, cut at 300 characters, the tile whose file is no
// tile, and the stand-in stopped. What is made is making.check.js's. Nothing is asked but this
// machine.
import '../offline.js';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { asABrowser } from '../swisstopo/as-a-browser.js';
import { getJson } from '../swisstopo/door.js';
import { collectionAddress, fileAddress, itemsAddress, tileName } from '../swisstopo/hosts.js';
import { plotMadeOf } from './making.js';

const PAD = path.join(import.meta.dirname, '..');
const DAY = '2026-10-20';
const soon = { signal: globalThis.AbortSignal.timeout(20_000) };

// The stand-in, on a port that the system picked: it says its address, and is asked there.
const standIn = spawn(process.execPath, [path.join(PAD, 'swisstopo', 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const [, AT] = /^The stand-in for swisstopo: (\S+) - /.exec(
  await once(standIn.stdout, 'data', soon),
);
const machines = globalThis.fetch;
const asked = () => getJson(AT, '/asked');
/** What the page's making says of an order, as a browser's page asks: its refusal. */
async function refusalOf(text) {
  globalThis.fetch = asABrowser(machines);
  try {
    return await plotMadeOf(text, { origin: AT, day: DAY });
  } finally {
    globalThis.fetch = machines;
  }
}

// An order that is one: a rectangle at the origin of the Swiss grid, so many metres east and
// north of it, so long and so wide - made-refused.check.js's, to the letter.
const pairs = (flat) => flat.flatMap((x, at) => (at % 2 === 0 ? [[x, flat[at + 1]]] : []));
const [E0, N0] = [2_600_000, 1_200_000];
const cornersAt = (east, north, long = 10, wide = 10) => {
  const [e, n] = [E0 + east, N0 + north];
  return pairs([e, n, e + long, n, e + long, n + wide, e, n + wide]);
};
const ORDER = { name: 'Refused', corners: cornersAt(10, 10), side: 0, aroundM: 0, on: ['photo'] };
const text = (changes = {}) => JSON.stringify({ ...ORDER, ...changes });
const [first, second, third, fourth] = ORDER.corners;
// The order with one byte of its name that no text has, read as the server reads such bytes:
// what is none (the server's made.js was handed no text where its bytes were none, T-041.4).
const NO_TEXT = Buffer.from(text());
NO_TEXT[NO_TEXT.indexOf('Refused')] = 0xff;
const noText = (() => {
  try {
    return new globalThis.TextDecoder('utf-8', { fatal: true }).decode(NO_TEXT);
  } catch {
    return undefined;
  }
})();

// What is no order, and a paper that is none: the first sentence that holds.
const NO_ORDER = 'It is no order for a plot: one object, as JSON.';
const NO_OUTLINE =
  'It has no outline: three corners to 1000, each an easting and a northing in metres.';
const NONE = [
  ['a text that is no JSON', '{"name":"Refused"', NO_ORDER],
  ['what is no object', '[]', NO_ORDER],
  ['bytes that are no text', noText, NO_ORDER],
  ['a field more', text({ zone: 'W2' }), 'It holds "zone", which no order for a plot has.'],
  ['no name', text({ name: undefined }), 'It has no name, or one of more than 80 characters.'],
  ['two corners', text({ corners: [first, second] }), NO_OUTLINE],
  [
    'a corner off the map',
    text({ corners: [[2_419_999.5, N0], second, third] }),
    'A corner lies off the map of Switzerland: E 2420000 to 2900000, N 1030000 to 1350000.',
  ],
  ['a side that is none', text({ side: 4 }), "Its side is none of its outline's."],
  [
    'ground around that is none',
    text({ aroundM: 20.5 }),
    'The ground around the plot is none: 0 to 20 m, in steps of half a metre.',
  ],
  [
    'no `on`',
    text({ on: undefined }),
    'It does not say what the corners were marked on: a map, the aerial photo, or a map and the photo.',
  ],
  [
    'two corners at one place',
    text({ corners: [first, first, third] }),
    'Two corners that follow each other lie at one place.',
  ],
  [
    'corners on one line',
    text({ corners: [first, second, [E0 + 40, N0 + 10]] }),
    'Its outline encloses no area.',
  ],
  [
    "the rectangle's corners in the order 1, 2, 4, 3",
    text({ corners: [first, second, fourth, third] }),
    'Its outline crosses itself.',
  ],
  [
    'a plot of 991 m',
    text({ corners: cornersAt(10, 10, 991, 20), aroundM: 5 }),
    'Its paper would be 1001 m by 30 m, and the pad takes 1000 m each way: mark a smaller plot, or less ground around it.',
  ],
];

// Ground that does not come: what the reader or the door said - which ends with the address
// that was asked - cut to 300 characters. The made-up world has one cell without a height,
// 100.25 m south-west of the origin; no tile east of its four; and north of them a tile whose
// file is a text.
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const itemsOf = (eastKm, northKm) =>
  itemsAddress(
    AT,
    YEARS.map((year) => tileName(year, eastKm, northKm)),
  );
const fileOf = (eastKm, northKm) => fileAddress(AT, tileName(2025, eastKm, northKm));
const NOT_COME = [
  [
    'a plot over the one cell that has no height',
    text({ corners: cornersAt(-110, -110, 20, 20) }),
    `swissALTI3D states no height at E 2599899.75, N 1199899.75: ${fileOf(2599, 1199)}`,
  ],
  [
    'a plot in the tile that there is not',
    text({ corners: cornersAt(1010, 10) }),
    `The download service's answer was refused: swissALTI3D has no tile for the square kilometre at E 2601 km, N 1200 km: ${itemsOf(2601, 1200)}`,
  ],
  // The one sentence that is not the server's: a browser's page reads no Content-Range, and the
  // door holds a part to its length alone - so a file of 33 bytes, which Node reads as a whole
  // file too short to be a tile, is a part too short to be the one asked for here
  // (docs/sketch/swisstopo.md, Gotchas, "In a browser the door is told less, and says less").
  [
    'a plot in the tile whose file is no tile',
    text({ corners: cornersAt(10, 1010) }),
    `The service answered with another part than bytes 0 to 16383 - 33 bytes, called nothing: ${fileOf(2600, 1201)}`,
  ],
];
const notCome = (why) => ({ refused: `The ground did not come: ${why.slice(0, 300)}` });

try {
  assert.equal(noText, undefined);
  await getJson(AT, '/asked?forget');
  for (const [what, order, sentence] of NONE) {
    assert.deepEqual(await refusalOf(order), { refused: sentence }, what);
  }
  // Of none of them was the stand-in asked anything: a paper that is too large among them.
  assert.deepEqual(await asked(), []);
  for (const [what, order, why] of NOT_COME) {
    assert.deepEqual(await refusalOf(order), notCome(why), what);
  }
  // The second of them is cut: its address names eight tiles, and of some 440 characters 300 are
  // said, after the 25 of "The ground did not come: ".
  const [, [, , long]] = NOT_COME;
  assert.deepEqual([long.length > 400, notCome(long).refused.length], [true, 25 + 300]);
  // The requests were those of the ground that did not come - four, two and three.
  assert.equal((await asked()).length, 9);

  // The stand-in stopped: the ground does not come, and the door says so - as a browser's page
  // is told of a request that failed.
  await Promise.all([once(standIn, 'close'), standIn.kill()]);
  const unreached = `The service could not be reached: ${collectionAddress(AT)}`;
  assert.deepEqual(await refusalOf(text()), notCome(unreached));
} finally {
  standIn.kill();
}
process.stdout.write(
  `tools/sketch/new-plot: a plot made in the page is refused in the server's sentences - ${NONE.length} that are no order or have no paper, with nothing asked; ${NOT_COME.length + 1} whose ground does not come, as a browser's page is shown it\n`,
);
