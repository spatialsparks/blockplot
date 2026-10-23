// The check of the house as White shows it in Google Earth (ST-038, T-038.1): of a made-up room
// with a window, built by the scene's own rules, the file of houseFile read back against
// figures worked out by hand - the wall around the window, its four pieces and its pane, the
// hole left open - and of two made-up rooms side by side, what each switch of the 3D page takes
// out of the file. The site and the figures are scene/openings.check.js's, typed in again: a
// check imports no other check. It asks nobody, and holds nothing of a real plot.
import assert from 'node:assert/strict';
import process from 'node:process';
import { sceneOf } from '../scene/scene.js';
import { houseFile } from './house.js';
import { wgs84Of } from './wgs84.js';

// A made-up plot of 12 m by 5 m, in cells of half a metre: a column c is x = c / 2, a row r of
// the top view y = 8 - r / 2, a level z the height 116 - z / 2. Its ground is flat, at 105 m.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 12,
  yFromM: 3,
  yToM: 8,
  sideM: [100, 116],
  outline: [
    [1, 7],
    [11, 7],
    [1, 4],
  ],
  ground: { baseM: 100, rowsCm: Array(11).fill(Array(25).fill('500').join(' ')) },
};
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.375,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.25,
  sillHighM: 0.875,
};
const grey = { name: 'grey', hex: '#8795a1' };
const room = (name, x, more = {}) => ({ x, y: [1, 9], z: [16, 22], colour: grey, name, ...more });
// A window up the paper, on the parlour's face at y = 7.5, from x 2 to 3.5: its sill 0.875 m
// over the floor slab's top, 105.375 m, at 106.25 m, its head 1.25 m higher, at 107.5 m.
const window = { x: [4, 7], y: [0.7, 1.3], z: [17.75, 20.25], kind: 'window', turn: 0 };
Object.assign(window, { fill: '#b0b0b0', floor: 22 });
const [E0, N0] = [2_600_000, 1_200_000];
const at = { ...site, name: 'Made-up room', bearingDeg: 90, originLV95: [E0, N0] };
const RAISE_M = 2.5;
const NOW = new Date('2026-10-18T12:00:00Z');

/** The Placemarks of a file, each `{ name, style, rings }`, a ring its points as the file writes them. */
const placemarksOf = (text) =>
  [...text.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)].map(([, mark]) => ({
    name: mark.match(/<name>(.*?)<\/name>/)[1],
    style: mark.match(/<styleUrl>#(.*?)<\/styleUrl>/)?.[1],
    rings: [...mark.matchAll(/<coordinates>([^<]*)<\/coordinates>/g)].map(([, points]) =>
      points.split(' '),
    ),
  }));
/** A point as the file writes it, of x and y of the plot - x east, y north - and a height, raised. */
const pointAt = (x, y, h) => {
  const [longitude, latitude] = wgs84Of([E0 + x, N0 + y]);
  return `${longitude.toFixed(7)},${latitude.toFixed(7)},${(h + RAISE_M).toFixed(2)}`;
};
/** The eight corners of a box, each as the file writes it, sorted. */
const cornersOf = ([x0, x1], [y0, y1], [h0, h1]) =>
  [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [h0, h1].map((h) => pointAt(x, y, h)))).sort();

// --- the room with its window --------------------------------------------------------------------
// BY HAND: the parlour is x 1 to 5, y 3.5 to 7.5, 105 to 108 m. Its wall on the face y = 7.5 lies
// the outer wall's 0.375 m inside it, y 7.125 to 7.5, from the floor slab's top, 105 + 0.375, to
// the roof slab's foot, 108 - 0.3125. The window cuts it at x 2 and 3.5: a piece beside it each
// way, the full height; under the sill, to 106.25; the lintel, from the head, 107.5, up. Its pane
// lies in the middle of the wall's thickness, (7.125 + 7.5 - 0.04) / 2 = 7.2925, PANE_M thick.
const WALL = [7.125, 7.5];
const UP = [105.375, 107.6875];
const HAND = [
  ['Parlour — wall', [1, 2], WALL, UP],
  ['Parlour — wall', [2, 3.5], WALL, [105.375, 106.25]],
  ['Parlour — wall', [2, 3.5], WALL, [107.5, 107.6875]],
  ['Parlour — wall', [3.5, 5], WALL, UP],
  ['Parlour — pane', [2, 3.5], [7.2925, 7.3325], [106.25, 107.5]],
];
// The hole: x 2 to 3.5, 106.25 to 107.5 m. No piece of the wall above reaches into it.
const into = ([from, to], [holeFrom, holeTo]) => from < holeTo && to > holeFrom;
const walls = HAND.filter(([name]) => name.endsWith('wall'));
assert.ok(walls.every(([, x, , h]) => !(into(x, [2, 3.5]) && into(h, [106.25, 107.5]))));

const alone = houseFile(
  sceneOf(site, [room('Parlour', [2, 10]), window], figures),
  at,
  RAISE_M,
  NOW,
);
const marks = placemarksOf(alone.text);
// The room is 18 parts - five slabs of its floor, five of its roof, the wall, cut round the
// window, and the pane - of 108 faces, and the outline.
assert.equal(alone.parts, 18);
assert.equal(marks.length, 19);
assert.equal(alone.text.split('<Polygon>').length - 1, 108);
assert.ok(!alone.text.includes('innerBoundaryIs'), 'no face has a hole');
// The wall with its window: the five Placemarks of the table, one after another, in its order -
// each six closed faces of five points, all eight of its corners, white, the pane see-through.
const pointsOf = (mark) => [...new Set(mark.rings.flat())].sort();
const [, ...beside] = HAND[0];
const first = marks.findIndex((mark) => String(pointsOf(mark)) === String(cornersOf(...beside)));
assert.ok(first >= 0, 'the first piece beside the window');
const run = marks.slice(first, first + HAND.length);
HAND.forEach(([name, x, y, h], index) => {
  const mark = run[index];
  assert.equal(mark.name, name, `part ${index}`);
  assert.equal(mark.rings.length, 6);
  assert.ok(mark.rings.every((ring) => ring.length === 5 && ring[4] === ring[0]));
  assert.deepEqual(pointsOf(mark), cornersOf(x, y, h), `part ${index}`);
  assert.equal(mark.style, name.endsWith('pane') ? 'box-59ffffff' : 'box-ffffffff');
});
assert.ok(
  alone.text.includes('<PolyStyle><color>59ffffff</color><outline>0</outline></PolyStyle>'),
);
assert.ok(
  alone.text.includes('<PolyStyle><color>ffffffff</color><outline>0</outline></PolyStyle>'),
);
assert.ok(!alone.text.includes('<LineStyle>'), 'no edge is drawn');

// --- two rooms, and the switches -----------------------------------------------------------------
// The parlour, in section 1, and a dining room beside it, in section 2, both on level 22, 105 m.
const two = sceneOf(
  site,
  [room('Parlour', [2, 10], { section: 1 }), room('Dining', [10, 16], { section: 2 }), window],
  figures,
);
const fileOf = (off) => houseFile(two, at, RAISE_M, NOW, off);
const namesOf = (file) => new Set(placemarksOf(file.text).map(({ name }) => name.split(' — ')[0]));
const lastOf = (file) =>
  file.text.match(/<description>([\s\S]*?)<\/description>/)[1].split('\n')[3];
// No switch, or none given, is the whole house: every part of both rooms.
const whole = fileOf(undefined);
assert.equal(whole.parts, two.parts.length);
assert.deepEqual(namesOf(whole), new Set(['Parlour', 'Dining', 'Plot outline']));
assert.deepEqual(fileOf({}), whole);
assert.equal(lastOf(whole), 'Left out: the objects, and the ground as the sketch shapes it.');
// The dining room's section off: none of its parts, every one of the parlour's, and it says so.
const parlour = fileOf({ sections: [2] });
assert.deepEqual(namesOf(parlour), new Set(['Parlour', 'Plot outline']));
assert.equal(parlour.parts, two.parts.filter(({ thing }) => thing === 0).length);
assert.equal(
  lastOf(parlour),
  'Left out: the objects, and the ground as the sketch shapes it, and what is switched off in 3D.',
);
// The level of both off leaves no part: no file. A group is of objects, and takes no block's part.
assert.deepEqual(fileOf({ levels: [105] }), { text: null });
assert.deepEqual(fileOf({ groups: ['Kitchen'] }), whole);

process.stdout.write(
  'tools/sketch/kml: the house as White shows it - a wall around its window, its pane see-through, the hole open, every face plain and white - and what a section or a level switched off in 3D takes out of the file\n',
);
