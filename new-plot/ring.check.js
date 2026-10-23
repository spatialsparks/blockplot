// The check of a polygon's outline (ST-045, T-045.2): ring.js by hand, with nothing running.
// Rings in LV95 from E 2 600 000, N 1 200 000, each area worked out by hand: a square of 10 m
// with a hole and a second part, the square marked and the two sentences to the letter; three
// parts; two holes; a ring closed and one left open; a corner repeated twice running; two parts
// that enclose alike; nothing left out. The corners come as given - none rounded, moved or
// turned. And of ring.js itself: nothing imported but ./frame.js. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { largestOf } from './ring.js';

const [E0, N0] = [2_600_000, 1_200_000];
// A box of `wide` by `high` metres whose south-west corner lies `east` and `north` metres from
// the origin of the cases, its corners clockwise from there, the ring closed.
const box = (east, north, wide, high = wide) => {
  const [w, s] = [E0 + east, N0 + north];
  return [
    [w, s],
    [w, s + high],
    [w + wide, s + high],
    [w + wide, s],
    [w, s],
  ];
};
const SQUARE = box(0, 0, 10);
// The square's corners as given, clockwise, the closing one off.
const CORNERS = SQUARE.slice(0, 4);

// The square of 10 m, 100 m², with a hole of 2 m by 2 m, 4 m², and a second part of 3 m by
// 3 m, 9 m², given first: the square is marked, by its area and not by its place.
assert.deepEqual(largestOf([[box(20, 0, 3)], [SQUARE, box(2, 2, 2)]]), {
  corners: CORNERS,
  left: 'The largest of its 2 parts is marked; the other, 9 m², is left out. Its hole of 4 m² is not left out of the plot.',
});
// Three parts: the others, 9 m² and 4 m², 13 m² in all.
assert.deepEqual(largestOf([[SQUARE], [box(20, 0, 3)], [box(30, 0, 2)]]), {
  corners: CORNERS,
  left: 'The largest of its 3 parts is marked; the other 2, 13 m² in all, are left out.',
});
// Two holes, 4 m² and 1 m², 5 m² in all.
assert.deepEqual(largestOf([[SQUARE, box(2, 2, 2), box(6, 6, 1)]]), {
  corners: CORNERS,
  left: 'Its 2 holes, 5 m² in all, are not left out of the plot.',
});
// A ring closed and the same ring left open: the same corners, nothing left out.
assert.deepEqual(largestOf([[SQUARE]]), { corners: CORNERS, left: '' });
assert.deepEqual(largestOf([[CORNERS]]), { corners: CORNERS, left: '' });
// A corner repeated twice running - given three times in a row - is taken once.
const [A, B, C, D] = CORNERS;
assert.deepEqual(largestOf([[[A, B, B, B, C, D, A]]]).corners, CORNERS);
// Two parts that enclose alike, 100 m² each: the first is taken, the other said.
assert.deepEqual(largestOf([[box(20, 0, 10)], [SQUARE]]), {
  corners: box(20, 0, 10).slice(0, 4),
  left: 'The largest of its 2 parts is marked; the other, 100 m², is left out.',
});
// Figures to the centimetre come as they were given, none rounded.
const FINE = [
  [E0 + 0.01, N0 + 0.02],
  [E0 + 0.03, N0 + 12.34],
  [E0 + 15.67, N0 + 7.89],
];
assert.deepEqual(largestOf([[[...FINE, FINE[0]]]]), { corners: FINE, left: '' });

// ring.js itself: nothing imported but ./frame.js.
const code = fs
  .readFileSync(path.join(import.meta.dirname, 'ring.js'), 'utf8')
  .replace(/^\s*\/\/.*$/gm, '');
const IMPORTED = [...code.matchAll(/\bfrom\s*['"]([^'"]+)['"]|\brequire\s*\(|\bimport\s*\(/g)].map(
  (found) => found[1] ?? found[0],
);
assert.deepEqual(IMPORTED, ['./frame.js']);

process.stdout.write(
  'tools/sketch/new-plot: the outline of a polygon by hand - the largest part, its corners as given, the closing and the repeated corner, what was left out said to the letter\n',
);
