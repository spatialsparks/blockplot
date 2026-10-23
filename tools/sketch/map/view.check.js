// The check of the map's arithmetic (ST-031): view.js by hand, with nothing running and no page.
// A view is a level and the place at its middle, in a place of so many pixels. Held here, each
// against figures that a hand works out: the place under a pixel and the pixel of a place; the
// pictures of a view at the origin of the Swiss grid, and where each lies; nearer and further
// with the place under the pointer kept under it; the first view; a view held to the sheet, at
// its four corners, with the level's last column and row; the levels that there are none of;
// which layer shows. And for every level from the first view's to the nearest, on views of
// several places: the pictures of a view are the tiles of which it shows ground - said here a
// second time, in other words - each lies where its ground lies, and each one's address is one
// that tileAddress builds. Run by check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { CADASTRAL_FROM, LAYERS, LEVELS, SHEET, TILE_PX } from '../swisstopo/hosts.js';
import { matrixOf, tileAddress } from '../swisstopo/hosts.js';
import { NEAREST, first, held, moved, pictures, pixelOf, placeAt } from './view.js';
import { showing, stepped } from './view.js';

// The map's own figures that the hand goes by, typed in: a picture of 256 pixels, the sheet, and
// the metres of a pixel at the levels of the cases.
assert.deepEqual([TILE_PX, NEAREST], [256, 28]);
assert.deepEqual(
  { ...SHEET },
  { west: 2_420_000, east: 2_900_000, south: 1_030_000, north: 1_350_000 },
);
assert.deepEqual(
  [15, 20, 26, 27, 28].map((level) => LEVELS[level]),
  [500, 10, 0.5, 0.25, 0.1],
);
// The place of the hand cases, and the view that has the origin of the Swiss grid at its middle.
const PLACE = { wide: 1024, high: 768 };
const ORIGIN = { level: 26, e: 2_600_000, n: 1_200_000 };
const at = (e, n) => ({ e, n });

// The place under a pixel, counted from the top left: half a metre a pixel at level 26, east to
// the right and north upward - and the pixel of a place, the other way round, off the place too.
const UNDER = [
  [[0, 0], at(2_599_744, 1_200_192)],
  [[512, 384], at(2_600_000, 1_200_000)],
  [[1024, 768], at(2_600_256, 1_199_808)],
  [[768, 192], at(2_600_128, 1_200_096)],
  [[2512, -616], at(2_601_000, 1_200_500)],
];
for (const [pixel, place] of UNDER) {
  assert.deepEqual(placeAt(ORIGIN, PLACE, pixel), place, `${pixel}`);
  assert.deepEqual(pixelOf(ORIGIN, PLACE, place), pixel, `${pixel}`);
}

// Twenty pictures: the columns 1404 to 1408 and the rows 1170 to 1173, a row after another. The
// place's west edge lies 64 pixels into column 1404 and its north edge 96 into row 1170 - and
// 1406/1171 lies 448 pixels from the left and 160 from the top.
const twenty = pictures(ORIGIN, PLACE);
const expected = [];
for (const row of [1170, 1171, 1172, 1173]) {
  for (const column of [1404, 1405, 1406, 1407, 1408]) {
    expected.push({ column, row, left: 256 * (column - 1404) - 64, top: 256 * (row - 1170) - 96 });
  }
}
assert.deepEqual(twenty, expected);
assert.deepEqual(twenty[7], { column: 1406, row: 1171, left: 448, top: 160 });

// Nearer from there with the pointer at 768, 192 - which is E 2 600 128, N 1 200 096: the middle
// is E 2 600 064, N 1 200 048 at level 27, and that place lies under that pixel still. Further
// with the pointer there is the view of before; and at the middle, the middle stays.
const POINTER = [768, 192];
const nearer = stepped(ORIGIN, PLACE, 1, POINTER);
assert.deepEqual(nearer, { level: 27, e: 2_600_064, n: 1_200_048 });
assert.deepEqual(placeAt(nearer, PLACE, POINTER), at(2_600_128, 1_200_096));
assert.deepEqual(stepped(nearer, PLACE, -1, POINTER), ORIGIN);
assert.deepEqual(stepped(ORIGIN, PLACE, 1, [512, 384]), { ...ORIGIN, level: 27 });
assert.deepEqual(stepped(ORIGIN, PLACE, -1, [512, 384]), { ...ORIGIN, level: 25 });

// The first view: the whole sheet, its middle at E 2 660 000, N 1 190 000, at the nearest level
// at which it shows whole - level 15, 500 m a pixel, in the place of the hand cases, with all
// twelve pictures of that level, four across and three down. The sheet is 960 by 640 pixels
// there: a place a pixel less either way has it at 650 m, one twice as large at 250 m, and one
// that no level shows it whole in, at the furthest.
const FIRST = { level: 15, e: 2_660_000, n: 1_190_000 };
assert.deepEqual(first(PLACE), FIRST);
const twelve = pictures(FIRST, PLACE);
assert.deepEqual(matrixOf(15), { columns: 4, rows: 3 });
assert.equal(twelve.length, 12);
twelve.forEach((one, index) => {
  const [column, row] = [index % 4, Math.floor(index / 4)];
  assert.deepEqual(one, { column, row, left: 256 * column + 32, top: 256 * row + 64 });
});
const FIRST_LEVELS = [
  [960, 640, 15],
  [959, 640, 14],
  [960, 639, 14],
  [976, 925, 15],
  [1920, 1280, 16],
  [1919, 1280, 15],
  [120, 80, 0],
  [119, 80, 0],
  [0, 0, 0],
  [5_000_000, 3_500_000, 28],
];
for (const [wide, high, level] of FIRST_LEVELS) {
  assert.deepEqual(first({ wide, high }), { ...FIRST, level }, `${wide} by ${high}`);
}

// The level goes from the first view's to the nearest: a level beyond 28 is none, and neither is
// one before the first view's - which is 15 in the place of the hand cases, and 14 in a smaller.
const SMALLER = { wide: 800, high: 600 };
assert.equal(stepped({ ...ORIGIN, level: 28 }, PLACE, 1, POINTER), null);
assert.equal(stepped({ ...ORIGIN, level: 15 }, PLACE, -1, POINTER), null);
assert.equal(stepped({ ...ORIGIN, level: 15 }, SMALLER, -1, [400, 300]).level, 14);
assert.equal(stepped({ ...ORIGIN, level: 14 }, SMALLER, -1, [400, 300]), null);
assert.equal(stepped({ ...ORIGIN, level: 27 }, PLACE, 1, POINTER).level, 28);

// Moved by so many pixels, as a drag moves the ground: 100 to the right and 50 up at half a
// metre a pixel, and the middle lies 50 m further west and 25 m further south.
assert.deepEqual(moved(ORIGIN, PLACE, [100, -50]), { level: 26, e: 2_599_950, n: 1_199_975 });
assert.deepEqual(moved(ORIGIN, PLACE, [0, 0]), ORIGIN);
// Held to the sheet: the middle never leaves it, however far the ground is moved, and the level
// is one that the place has.
const far = (right, down) => moved(FIRST, PLACE, [right, down]);
assert.deepEqual(far(10_000, 0), { ...FIRST, e: 2_420_000 });
assert.deepEqual(far(-10_000, 10_000), { level: 15, e: 2_900_000, n: 1_350_000 });
assert.deepEqual(far(0, -10_000), { ...FIRST, n: 1_030_000 });
assert.deepEqual(held({ level: 3, e: 0, n: 0 }, PLACE), { level: 15, e: 2_420_000, n: 1_030_000 });
assert.deepEqual(held({ level: 40, e: 9e9, n: 9e9 }, PLACE), {
  level: 28,
  e: 2_900_000,
  n: 1_350_000,
});
assert.deepEqual(held(ORIGIN, PLACE), ORIGIN);
// And a place under the pointer that the sheet's edge does not let go of the middle for: the
// middle stays on the sheet, and the place is not kept.
const edge = stepped({ level: 15, e: 2_420_000, n: 1_190_000 }, PLACE, 1, [0, 384]);
assert.deepEqual(edge, { level: 16, e: 2_420_000, n: 1_190_000 });

// A view at a corner of the sheet has pictures of the sheet alone: at level 20, 10 m a pixel,
// the level has 188 columns and 125 rows, and its last picture is 187/124.
assert.deepEqual(matrixOf(20), { columns: 188, rows: 125 });
const corner = (e, n) => pictures({ level: 20, e, n }, PLACE);
const names = (all) => all.map(({ column, row }) => `${column}/${row}`).join(' ');
assert.equal(names(corner(SHEET.west, SHEET.north)), '0/0 1/0 0/1 1/1');
assert.equal(names(corner(SHEET.west, SHEET.south)), '0/123 1/123 0/124 1/124');
assert.equal(names(corner(SHEET.east, SHEET.north)), '185/0 186/0 187/0 185/1 186/1 187/1');
const last = corner(SHEET.east, SHEET.south);
assert.equal(names(last), '185/123 186/123 187/123 185/124 186/124 187/124');
// Where they lie: the sheet's corner at the middle of the place, 512 pixels in and 384 down.
assert.deepEqual(corner(SHEET.west, SHEET.north)[0], { column: 0, row: 0, left: 512, top: 384 });
assert.deepEqual(last[0], { column: 185, row: 123, left: -128, top: -128 });
assert.deepEqual(last[5], { column: 187, row: 124, left: 384, top: 128 });
// And a place of no pixels has no picture.
assert.deepEqual(pictures(ORIGIN, { wide: 0, high: 768 }), []);
assert.deepEqual(pictures(ORIGIN, { wide: 1024, high: 0 }), []);

// A view whose edges lie on the edges of pictures has no picture beyond them. At level 28 a
// picture is 25.6 m: this place's west edge lies on column 7000's and its north edge on row
// 4000's, and it is four pictures wide and three high. The sum of metres and pixels leaves a
// hair beside the whole pixel - which, floored, would be a column and a row more: twenty.
const ON_EDGE = { level: 28, e: 2_599_251.2, n: 1_247_561.6 };
const hair = (ON_EDGE.e - SHEET.west) / 0.1 - 512 - 7000 * 256;
assert.ok(hair !== 0 && Math.abs(hair) < 1e-6, `${hair}`);
const onEdge = pictures(ON_EDGE, PLACE);
assert.equal(
  names(onEdge),
  [4000, 4001, 4002].map((r) => `7000/${r} 7001/${r} 7002/${r} 7003/${r}`).join(' '),
);
assert.deepEqual(onEdge[0], { column: 7000, row: 4000, left: 0, top: 0 });

// Which layer shows, typed in by level, for both values of `from` (docs/sketch/cadastre.md): with
// the cadastre's 25 the national map up to level 24 and the cadastral map from 25 on; with null,
// no cadastre, the national map up to 27, its last, and the aerial photo at 28; and the photo at
// every level where the switch says so, both - one at a time. Without a `from` it is the switch's,
// `CADASTRAL_FROM`; and each layer that this pad has shows at levels that it has.
const SHOWN = {
  25: (level) => (level <= 24 ? 'national' : 'cadastral'),
  null: (level) => (level <= 27 ? 'national' : 'photo'),
};
for (let level = 0; level <= NEAREST; level += 1) {
  for (const from of [25, null]) {
    const map = SHOWN[String(from)](level);
    assert.deepEqual(
      [showing(level, false, from), showing(level, true, from)],
      [map, 'photo'],
      `${level} from ${from}`,
    );
  }
  const map = SHOWN[String(CADASTRAL_FROM)](level);
  assert.deepEqual([showing(level, false), showing(level, true)], [map, 'photo'], `${level}`);
  for (const layer of [map, 'photo']) {
    assert.ok(level >= LAYERS[layer].from && level <= LAYERS[layer].to, `${layer} at ${level}`);
  }
}

// For every level from the first view's to the nearest, on views of several places: the
// pictures are the tiles of which the view shows ground, and no other - said a second time, as
// the tiles of the level whose pixels overlap the place's; each lies where its ground lies -
// column c from the sheet's west edge plus c pictures on, row r down from its north edge - to
// the thousandth of a pixel that a view's corner is taken to; each one's address is one that
// tileAddress builds, for the layer that shows there and for the photo; and a level nearer, the
// place under the pointer is kept under it, wherever the sheet's edge does not hold the middle.
const STAND_IN = 'http://127.0.0.1:5123';
const PLACES = [PLACE, { wide: 976, high: 925 }, { wide: 333, high: 1201 }];
const MIDDLES = [ORIGIN, FIRST, at(2_683_456.78, 1_247_890.12), at(2_420_300, 1_349_900)];
const near = (one, other, within = 1e-6) => Math.abs(one - other) <= within;
const inside = ({ e, n }) => e > SHEET.west && e < SHEET.east && n > SHEET.south && n < SHEET.north;
let [kept, none] = [0, 0];
for (let level = first(PLACE).level; level <= NEAREST; level += 1) {
  const metres = LEVELS[level];
  const { columns, rows } = matrixOf(level);
  for (const size of PLACES) {
    for (const { e, n } of MIDDLES) {
      const view = { level, e, n };
      const [west, north] = [
        (e - SHEET.west) / metres - size.wide / 2,
        (SHEET.north - n) / metres - size.high / 2,
      ];
      const overlaps = (tile, from, length) =>
        tile * 256 < from + length && (tile + 1) * 256 > from;
      const shows = [];
      for (let row = 0; row < rows; row += 1) {
        if (!overlaps(row, north, size.high)) continue;
        for (let column = Math.max(Math.floor(west / 256) - 2, 0); column < columns; column += 1) {
          if (overlaps(column, west, size.wide)) shows.push(`${column}/${row}`);
        }
      }
      const all = pictures(view, size);
      assert.equal(names(all), shows.join(' '), `level ${level}, ${e} ${n}`);
      for (const { column, row, left, top } of all) {
        const ground = at(SHEET.west + 256 * metres * column, SHEET.north - 256 * metres * row);
        const [x, y] = pixelOf(view, size, ground);
        assert.ok(near(x, left, 0.000501) && near(y, top, 0.000501), `${level}/${column}/${row}`);
        for (const layer of [showing(level, false), 'photo']) {
          const address = tileAddress(STAND_IN, layer, level, column, row);
          const ends = `/${level}/${column}/${row}.${LAYERS[layer].ending}`;
          assert.ok(
            address?.startsWith(`${STAND_IN}/`) && address.endsWith(ends),
            `${layer}${ends}`,
          );
        }
      }
      const next = stepped(view, size, 1, [137, 59]);
      if (next === null) none += 1;
      else if (inside(next)) {
        const [was, is] = [placeAt(view, size, [137, 59]), placeAt(next, size, [137, 59])];
        assert.ok(near(was.e, is.e) && near(was.n, is.n) && next.level === level + 1, `${level}`);
        kept += 1;
      }
    }
  }
}
// The nearest level has none nearer, of every place and every middle; and of the thirteen
// levels before it the place was kept on the views of the first two middles, at the least.
assert.equal(none, PLACES.length * MIDDLES.length);
assert.ok(kept >= 13 * PLACES.length * 2, `${kept}`);

process.stdout.write(
  'tools/sketch/map: a view of the map by hand - the place under a pixel, the pictures of a view and where each lies, nearer and further at the pointer, the first view, the sheet held, and which layer shows\n',
);
