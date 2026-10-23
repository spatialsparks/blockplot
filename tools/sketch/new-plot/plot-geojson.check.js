// The check of what the plot of corners from a GeoJSON file says for good (ST-045, T-045.1):
// plot.js and request.js by hand, with nothing running and no file read. The plot of a file's
// order on made-up level ground, as plot-parcel.check.js makes it: its credit and the first of its
// sources to the letter - as given and changed by hand, converted from WGS84 or not, the eight
// words of the card - with swisstopo's credit alone, and the cantons' beside it where a corner
// was moved on the cadastral map; nothing of the file but its corners in the plot; and the rest
// of the plot that of the same corners marked by hand. All of it lies at the origin of the Swiss
// grid. Run by check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { paperOf } from './frame.js';
import { plotOf } from './plot.js';
import { orderOf } from './request.js';

const [E0, N0] = [2_600_000, 1_200_000];
const DAY = '2026-10-23';
// A rectangle of 24 m by 16 m, its first side the longest, running east.
const RECTANGLE = [
  [E0 + 10, N0 + 10],
  [E0 + 34, N0 + 10],
  [E0 + 34, N0 + 26],
  [E0 + 10, N0 + 26],
];
const ORDER = { name: 'Made-up file', corners: RECTANGLE, side: 0, aroundM: 5 };
const of = (order) => orderOf(JSON.stringify(order));

// Made-up level ground: the ground of the box that the paper asks for, a 32-bit height at the
// middle of every cell, as plot-parcel.check.js makes it.
const TILE = { name: 'swissalti3d_2025_2600-1200', year: 2025 };
function groundOf(box) {
  const [west, south] = [box.minE, box.minN].map((edge) => Math.floor(edge / 0.5 - 0.5));
  const [east, north] = [box.maxE, box.maxN].map((edge) => Math.ceil(edge / 0.5 - 0.5));
  const row = () => Array.from({ length: east - west + 1 }, () => Math.fround(560.25));
  const heightsM = Array.from({ length: north - south + 1 }, row);
  return { cells: { west, east, south, north }, heightsM, tiles: [TILE] };
}
const ground = groundOf(paperOf(RECTANGLE, 0, 5).box);
const made = (order) => plotOf({ ...of(order), ground, day: DAY }).site;

const SWISSTOPO = '© swisstopo';
const BOTH = '© swisstopo, © Cadastral Surveying Switzerland / FL';
const GROUND = `Ground: swissALTI3D of swisstopo, the tile swissalti3d_2025_2600-1200 in its state of 2025, read on ${DAY}: a height every 0.5 m, read between the four cells around it, in whole centimetres. © swisstopo`;
const FRAME =
  'Frame: x = 0, y = 0 lies at E 2600010.00, N 1200010.00 in LV95; x runs at 90 degrees from north, clockwise, and y to its left. Heights are metres above sea level, LN02.';
const UNRECORDED =
  'Where the file came from, and on what terms, is not recorded. No survey: it has no legal effect.';
// The eight words, typed in: of each file, its credit before " Ground: …" and its source before
// the credits.
const WORDS = [
  [
    { wgs84: false, asGiven: true },
    'Outline: from a file you gave, no survey.',
    `Outline: from a GeoJSON file you gave, read on ${DAY}, its corners unchanged. ${UNRECORDED}`,
  ],
  [
    { wgs84: false, asGiven: false },
    'Outline: after a file you gave, changed by hand, no survey.',
    `Outline: after a GeoJSON file you gave, read on ${DAY}, and changed by hand since. ${UNRECORDED}`,
  ],
  [
    { wgs84: true, asGiven: true },
    'Outline: from a file you gave, converted from WGS84 to about a metre, no survey.',
    `Outline: from a GeoJSON file you gave in longitude and latitude (WGS84), read on ${DAY} and converted to LV95 by swisstopo's approximate formulas, good to about a metre, its corners unchanged since. ${UNRECORDED}`,
  ],
  [
    { wgs84: true, asGiven: false },
    'Outline: after a file you gave, converted from WGS84 to about a metre, changed by hand, no survey.',
    `Outline: after a GeoJSON file you gave in longitude and latitude (WGS84), read on ${DAY} and converted to LV95 by swisstopo's approximate formulas, good to about a metre, and changed by hand since. ${UNRECORDED}`,
  ],
];
// Marked on nothing, or a corner moved on the national map or the photo: swisstopo's credit alone.
// A corner moved on the cadastral map, in a pad that offers it: both.
const CREDITS = [
  [[], SWISSTOPO],
  [['national'], SWISSTOPO],
  [['photo'], SWISSTOPO],
  [['national', 'photo'], SWISSTOPO],
  [['cadastral'], BOTH],
  [['cadastral', 'photo'], BOTH],
];
for (const [file, credit, outline] of WORDS) {
  for (const [on, credits] of CREDITS) {
    const site = made({ ...ORDER, on, file });
    const said = [site.credit, site.sources];
    const words = [
      `${credit} Ground: swissALTI3D. ${credits}`,
      [`${outline} ${credits}`, GROUND, FRAME],
    ];
    assert.deepEqual(said, words, `${JSON.stringify(file)} on ${JSON.stringify(on)}`);
  }
}

// Nothing of the file but its corners reaches the plot: no key of its own, no word of its order
// but those above. And the rest of the plot is the plot of the same corners marked by hand.
const rest = (site) =>
  Object.fromEntries(Object.entries(site).filter(([key]) => !['credit', 'sources'].includes(key)));
const byHand = made({ ...ORDER, on: ['photo'] });
for (const [file] of WORDS) {
  const site = made({ ...ORDER, on: [], file });
  assert.deepEqual(Object.keys(site), Object.keys(byHand));
  assert.deepEqual(rest(site), rest(byHand));
  assert.ok(!JSON.stringify(site).includes('wgs84') && !JSON.stringify(site).includes('asGiven'));
}

process.stdout.write(
  'tools/sketch/new-plot: the plot of corners from a file says for good that they came from a file you gave, as given or changed, converted from WGS84 or not, with no survey and no legal effect, and with the cantons credit only where a corner was moved on the cadastral map\n',
);
