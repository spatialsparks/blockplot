// What blocks.js works out, checked on its own: what is left of a box once a box is cut out of
// it, the edge of boxes taken together, the blocks of a sketch of coloured cells, what a block
// counts as - a room, open air or glass - and the top of a box that slopes: what a box says of
// it and what says nothing, where its top lies at its two ends, how high it then is, the two
// tops that slope in the golden file, a slope where its box went, what a plane shows of a top
// and how much of it the box covers. check.js runs it first; check-slices.js takes what is no slope.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const file of ['categories', 'blocks']) await import(`./${file}.js`);
const { blocks } = globalThis;

// What is left of a box once a box is cut out of it, and the edge of boxes taken together.
const [floor, well] = [
  [0, 0, 10, 8],
  [4, 3, 6, 6],
];
assert.deepEqual(blocks.minus(floor, well), [
  [0, 0, 10, 3],
  [0, 6, 10, 8],
  [0, 3, 4, 6],
  [6, 3, 10, 6],
]);
assert.deepEqual(blocks.minus(floor, [-1, -1, 11, 9]), []);
assert.deepEqual(blocks.minus(floor, [10, 0, 12, 8]), [floor]);
assert.deepEqual(blocks.minus(floor, [8, 6, 12, 9]), [
  [0, 0, 10, 6],
  [0, 6, 8, 8],
]);
const beside2 = [
  [0, 0, 2, 1],
  [2, 0, 3, 1],
];
assert.equal(blocks.outline(beside2).length, 8);
assert.equal(blocks.outline(blocks.minus(floor, well)).length, 36 + 10);
// How much boxes cover together: what two of them share counts once.
assert.equal(blocks.area(blocks.minus(floor, well)), 80 - 6);
assert.equal(blocks.area([floor, well, [8, 6, 12, 9]]), 80 + 12 - 4);

// The blocks of coloured cells: a box of one colour is one block; another colour below, another
// length below, or a line drawn across cuts it in two; a line beside it or along its top does not.
const box = (left, top, right, bottom, colour) => {
  const coloured = {};
  for (let x = left; x < right; x += 1) {
    for (let y = top; y < bottom; y += 1) coloured[`${x},${y}`] = colour;
  }
  return coloured;
};
const cut = (coloured, lines = []) => blocks.ofCells(coloured, lines).map((b) => b.slice(0, 4));
const upper = [4, 10, 24, 13];
const lower = [4, 13, 24, 16];
assert.deepEqual(blocks.ofCells(box(4, 10, 24, 16, 1), []), [[4, 10, 24, 16, 1]]);
assert.deepEqual(cut({ ...box(4, 10, 24, 13, 1), ...box(4, 13, 24, 16, 2) }), [upper, lower]);
assert.deepEqual(cut({ ...box(4, 10, 24, 13, 1), ...box(4, 13, 30, 16, 1) }), [
  upper,
  [4, 13, 30, 16],
]);
assert.deepEqual(cut(box(4, 10, 24, 16, 1), [[30, 13, 2, 13, 0]]), [upper, lower]);
const beside = [
  [24, 13, 30, 13, 0],
  [4, 10, 24, 10, 0],
  [10, 10, 10, 16, 0],
];
assert.deepEqual(cut(box(4, 10, 24, 16, 1), beside), [[4, 10, 24, 16]]);

// What a block counts as. Where no box of it says so, its name does: glass with "greenhouse" in
// it; open air with one of six words in it - in capitals or not, and whatever else stands in
// the name; a room with none of them. Each word is tried alone, in capitals and in a longer name.
const BY_NAME = {
  glass: ['greenhouse', 'Greenhouse', 'GREENHOUSE', 'The greenhouse on the roof terrace'],
  open: [
    ...['balcon', 'terrace', 'garden', 'courtyard', 'roof'],
    ...['BALCON', 'TERRACE', 'GARDEN', 'COURTYARD', 'ROOF'],
    ...['Balcony, south', 'Two balconies', 'Roof terrace', 'Kitchen garden', 'Gardens'],
    ...['Courtyard / Filled', 'Green Roof', 'Green roof', 'Flat roofs 2'],
    ...['terrass', 'TERRASS', 'Terrasse', 'Dachterrasse'],
  ],
  room: ['Day rooms', 'Bath', 'Glass porch', 'Store', 'Green house', 'Balkon', 'Court yard', 'Roo'],
};
for (const [as, names] of Object.entries(BY_NAME)) {
  for (const name of names) assert.deepEqual(blocks.countsAs([{ name }]), { as, by: 'name' }, name);
}
// A block without a name is a room. The name of a block is the first box's that has one.
for (const none of [[{}], [{ name: '' }], [{ colour: 4 }, { colour: 4 }], []]) {
  assert.deepEqual(blocks.countsAs(none), { as: 'room', by: 'name' });
}
assert.deepEqual(blocks.countsAs([{}, { name: 'Garden' }, { name: 'Bath' }]).as, 'open');
assert.deepEqual(blocks.countsAs([{ name: 404 }, { name: 'Garden' }]).as, 'room');
// A box that says `is` is read before the name, and against it: each of the three. Of several
// boxes the first that says one of the three counts, wherever the name stands.
const IS_AGAINST = { room: 'Garden', open: 'Greenhouse', glass: 'Glass porch' };
for (const [is, name] of Object.entries(IS_AGAINST)) {
  assert.deepEqual(blocks.countsAs([{ name, is }]), { as: is, by: 'is' });
  assert.notEqual(blocks.countsAs([{ name }]).as, is, `"${name}" is ${is} by its name already`);
}
const several = [{ name: 'Garden' }, { is: 'glass' }, { name: 'Bath', is: 'room' }];
assert.deepEqual(blocks.countsAs(several), { as: 'glass', by: 'is' });
// Anything else under `is` says nothing: the name is read, and a later box that says one counts.
for (const is of ['pool', 'Glass', 'OPEN', ' room', '', 7, null, true, ['open'], { as: 'open' }]) {
  assert.deepEqual(blocks.countsAs([{ name: 'Roof terrace', is }]), { as: 'open', by: 'name' });
  assert.deepEqual(blocks.countsAs([{ is }, { is: 'glass' }]), { as: 'glass', by: 'is' });
}

// --- the top of a box that slopes -------------------------------------------------------------------
// A box of 8 m by 4 m and 4 m high: columns 30 to 46, rows 20 to 28 of the top view, and of a
// standing view rows 12 to 20 - its top in row 12 and its floor in row 20, for rows count
// downward. `more` is what a box has otherwise that was cut, made longer or moved.
const BOX = { x: [30, 46], y: [20, 28], z: [12, 20] };
const sloped = (slope, more) => ({ ...BOX, ...more, slope });
const topOf = (slope, more) => blocks.topOf(sloped(slope, more));
const highOf = (slope, more) => blocks.highOf(sloped(slope, more));

// WHAT A BOX SAYS of it: the axis the plane falls along, the two lines of the grid it is said
// at, and the row its top lies in at each. Down the plot, a plane from row 12 at column 30 to
// row 16 at column 46; the same said the other way up; across the plot, under `y`; and one said
// from the paper's first column on. What is read is the reading's own: who changes it changes
// nothing of the box.
const DOWN = { x: [30, 46], z: [12, 16] };
const UP = { x: [30, 46], z: [16, 12] };
const ACROSS = { y: [20, 28], z: [12, 16] };
for (const said of [DOWN, UP, ACROSS, { x: [0, 8], z: [3, 0] }]) {
  const [axis] = Object.keys(said);
  const read = blocks.slopeOf(sloped(said));
  assert.deepEqual(read, { axis, at: said[axis], z: said.z });
  read.at.push(99);
  read.z.reverse();
  assert.deepEqual(blocks.slopeOf(sloped(said)), { axis, at: said[axis], z: said.z });
}

// WHAT IS NO SLOPE SAYS NOTHING, each kind of it: no object under `slope`; both axes, or
// neither; lines that are not two whole numbers with the first the smaller; rows that are not
// two whole numbers, or do not differ. The box is level then: it has no top that slopes, and it
// is as high as it is drawn, 8 rows.
const [AT, ROWS] = [DOWN.x, DOWN.z];
const LIKE_A_LIST = { 0: 30, 1: 46, length: 2 };
export const NO_SLOPES = {
  'no object': [undefined, null, 'x', '', 7, 0, true, false, [], [AT, ROWS]],
  'both axes, or neither': [
    { x: AT, y: [20, 28], z: ROWS },
    { x: AT, y: null, z: ROWS },
    { x: null, y: null, z: ROWS },
    {},
    { z: ROWS },
    { X: AT, z: ROWS },
    { at: AT, z: ROWS },
  ],
  'lines that are not two whole numbers, the first the smaller': [
    ...[[46, 30], [30, 30], [30.5, 46], [30], [30, 46, 62], [], '30,46', [30, '46'], ['30', '46']],
    ...[[30, null], [30, Infinity], [NaN, 46], 30, null, true, LIKE_A_LIST],
  ].map((x) => ({ x, z: ROWS })),
  'rows that are not two whole numbers, or do not differ': [
    ...[[12, 12], [12.5, 16], [12], [12, 14, 16], [], '12,16', [12, '16'], ['12', '16']],
    ...[[12, null], [12, NaN], [-Infinity, 16], 16, undefined, null, false, LIKE_A_LIST],
  ].map((z) => ({ y: [20, 28], z })),
};
for (const [kind, slopes] of Object.entries(NO_SLOPES)) {
  for (const slope of slopes) {
    const box = sloped(slope);
    const read = [blocks.slopeOf(box), blocks.topOf(box), blocks.highOf(box)];
    assert.deepEqual(read, [null, null, 8], `${kind}: ${JSON.stringify(slope)}`);
  }
}
// An axis that is `undefined` is not there, as it is not once the sketch is written. And what
// has no `slope` is level: a box that says nothing, an object, and no thing at all.
assert.deepEqual(blocks.slopeOf(sloped({ ...DOWN, y: undefined })), blocks.slopeOf(sloped(DOWN)));
for (const none of [BOX, { kind: 'bed', x: 3, y: 4, floor: 18 }, {}, undefined, null]) {
  assert.deepEqual([blocks.slopeOf(none), blocks.topOf(none)], [null, null]);
}
assert.equal(blocks.highOf(BOX), 8);

// THE TOP, by hand. The plane down the plot falls a quarter of a row with every column: the
// top of the box lies in row 12 at its uphill end and in row 16 at its downhill one - the box
// is 4 m high there, and 2 m here. Said the other way up, it falls up the plot. Under `y` it
// falls across the plot, from row 20 of the top view to row 28, and either way too.
assert.deepEqual(topOf(DOWN), { axis: 'x', rows: [12, 16] });
assert.deepEqual(topOf(UP), { axis: 'x', rows: [16, 12] });
assert.deepEqual(topOf(ACROSS), { axis: 'y', rows: [12, 16] });
assert.deepEqual(topOf({ y: [20, 28], z: [16, 12] }), { axis: 'y', rows: [16, 12] });
// Down to the floor, a wedge: at its low end the top meets the floor, row 20. Lower it cannot
// go: a plane that is said to fall to row 24 there is held at the floor - and one that is said
// to begin over the box, in row 8, is held at its top: a slope takes away from a box, and adds
// nothing to it. Between its two ends the top is one straight line.
assert.deepEqual(topOf({ x: [30, 46], z: [12, 20] }), { axis: 'x', rows: [12, 20] });
assert.deepEqual(topOf({ y: [20, 28], z: [20, 12] }), { axis: 'y', rows: [20, 12] });
assert.deepEqual(topOf({ x: [30, 46], z: [12, 24] }), { axis: 'x', rows: [12, 20] });
assert.deepEqual(topOf({ x: [30, 46], z: [8, 16] }), { axis: 'x', rows: [12, 16] });

// A BOX CUT OUT OF IT lies on the same plane, for the plane is said on the paper, and not from
// the box: its uphill half ends in row 14, where its downhill half begins; a piece from column
// 33 to 43 has rows that are no whole numbers; and a strip cut along the slope, a metre across,
// has the rows of the whole.
assert.deepEqual(topOf(DOWN, { x: [30, 38] }), { axis: 'x', rows: [12, 14] });
assert.deepEqual(topOf(DOWN, { x: [38, 46] }), { axis: 'x', rows: [14, 16] });
assert.deepEqual(topOf(DOWN, { x: [33, 43] }), { axis: 'x', rows: [12.75, 15.25] });
assert.deepEqual(topOf(DOWN, { y: [22, 24] }), { axis: 'x', rows: [12, 16] });
assert.deepEqual(topOf(ACROSS, { y: [22, 26] }), { axis: 'y', rows: [13, 15] });
// Cut level, in a slice, each part is held within its own height: the upper metre falls to its
// own floor, row 14, and the rest begins at its own top, row 14 - two tops, each one straight
// line, where the plane crossed both. What lies wholly under the plane is a box.
assert.deepEqual(topOf(DOWN, { z: [12, 14] }), { axis: 'x', rows: [12, 14] });
assert.deepEqual(topOf(DOWN, { z: [14, 20] }), { axis: 'x', rows: [14, 16] });
assert.equal(topOf(DOWN, { z: [16, 20] }), null);

// A BOX MADE LONGER past an end of the slope. Downhill to column 62, the plane meets its floor
// there, row 20. To column 70 the plane would lie two rows under the floor: the box has its own
// floor there, and its top is one straight line to it - no longer the plane that was said.
// Uphill to column 22, the plane would lie two rows over the top: the box has its own top there.
assert.deepEqual(topOf(DOWN, { x: [30, 62] }), { axis: 'x', rows: [12, 20] });
assert.deepEqual(topOf(DOWN, { x: [30, 70] }), { axis: 'x', rows: [12, 20] });
assert.deepEqual(topOf(DOWN, { x: [22, 46] }), { axis: 'x', rows: [12, 16] });
// So with the plane that falls up the plot - uphill it goes on down to row 18, and further to
// the floor; downhill it is held at the top - and with the one across it.
assert.deepEqual(topOf(UP, { x: [22, 46] }), { axis: 'x', rows: [18, 12] });
assert.deepEqual(topOf(UP, { x: [6, 46] }), { axis: 'x', rows: [20, 12] });
assert.deepEqual(topOf(UP, { x: [30, 54] }), { axis: 'x', rows: [16, 12] });
assert.deepEqual(topOf(ACROSS, { y: [20, 40] }), { axis: 'y', rows: [12, 20] });
assert.deepEqual(topOf(ACROSS, { y: [12, 28] }), { axis: 'y', rows: [12, 16] });

// A PLANE OVER A BOX, AND ONE UNDER IT, leave it level. Wholly over it, both ends are held at
// its top; wholly under it, both at its floor, and a box that a slope leaves no height reads as
// the level box it was drawn as. So does a plane that only meets the top, or the floor, at one
// end; a box that was moved off its slope, 25 m down the plot or 15 m up it; and the part of
// a box that was cut level over the plane.
const LEVEL = [
  [{ x: [30, 46], z: [4, 8] }],
  [{ x: [30, 46], z: [22, 26] }],
  [{ x: [30, 46], z: [8, 12] }],
  [{ x: [30, 46], z: [20, 24] }],
  [{ y: [20, 28], z: [26, 22] }],
  [DOWN, { x: [80, 96] }],
  [DOWN, { x: [0, 16] }],
  [DOWN, { z: [8, 12] }],
];
for (const [slope, more] of LEVEL) {
  const whole = more?.z ? 4 : 8;
  assert.deepEqual([topOf(slope, more), highOf(slope, more)], [null, whole], JSON.stringify(slope));
  assert.notEqual(blocks.slopeOf(sloped(slope, more)), null);
}

// HOW HIGH a box is from end to end: the mean of its two ends, under one straight line. 8 rows
// where it is level; 6 under a top that falls 4 rows, whichever way; 4 as a wedge, half the
// box. Its two halves are 7 and 5 rows high: together they hold what the whole holds.
assert.deepEqual([highOf(DOWN), highOf(UP), highOf(ACROSS)], [6, 6, 6]);
assert.equal(highOf({ x: [30, 46], z: [12, 20] }), 4);
assert.deepEqual([highOf(DOWN, { x: [30, 38] }), highOf(DOWN, { x: [38, 46] })], [7, 5]);
assert.equal(highOf(DOWN, { x: [33, 43] }), 6);
assert.deepEqual([highOf(DOWN, { z: [12, 14] }), highOf(DOWN, { z: [14, 20] })], [1, 5]);

// A row that is whole comes out whole, however the plane falls: of one that falls a row with
// every column over 49 columns, the row a column on is 1 - where 1 / 49 * 49 is a hair less.
const exact = { x: [11, 59], y: [0, 2], z: [0, 60], slope: { x: [10, 59], z: [0, 49] } };
assert.deepEqual(blocks.topOf(exact).rows, [1, 49]);
assert.notEqual((1 / 49) * 49, 1);

// THE GOLDEN FILE that holds every field of the format has six boxes, four of them level. Of
// the two tops that slope, its studio's falls down the plot, from row 12 to row 15 over its 6 m,
// and that of its workshop's second box across it, from row 12 at row 30 of the top view to row
// 16 at row 20. After its wide staircase stand two boxes alone, ground and a cut, and then a
// cupboard. The made-up house has two tops that slope. Its text - without its lawn, its
// cut, its slopes and its wide staircase the file of version 3 - was held here, in three lines
// that had no room to say the cut: view3d/made-up-cut.check.js holds it now, whole.
const golden = (name) =>
  readFileSync(`${import.meta.dirname}/../../tests/__fixtures__/sketch/${name}.json`, 'utf8');
const every = JSON.parse(golden('every-part')).things;
const TOPS = [{ axis: 'x', rows: [12, 15] }, null, { axis: 'y', rows: [16, 12] }, null, null, null];
assert.deepEqual(every.filter((thing) => thing.kind === undefined).map(blocks.topOf), TOPS);
assert.deepEqual(every.at(-4), { kind: 'widestairs', x: 38.5, y: 17.5, floor: 18, long: 5.5 });
const falls = JSON.parse(golden('made-up')).things.map(blocks.topOf).filter(Boolean);
assert.equal(JSON.stringify(falls), '[{"axis":"x","rows":[18,22]},{"axis":"y","rows":[12,14]}]');
// A SLOPE GOES WHERE ITS BOX GOES (`carried`): 5 m up the plot and 3 m up, 10 columns back and 6
// rows less; 3 m across a plot it falls across, 6 rows on; its top edge 1 m up, the rows with it.
const went = (slope, to) => blocks.carried(sloped(slope), sloped(slope, to)).slope;
assert.deepEqual(went(DOWN, { x: [20, 36], z: [6, 14] }), { x: [20, 36], z: [6, 10] });
assert.deepEqual(went(ACROSS, { y: [26, 34] }), { y: [26, 34], z: [12, 16] });
assert.deepEqual(went(UP, { x: [30, 40], z: [10, 20] }), { x: [30, 46], z: [14, 10] });
// Moved across a plane that falls along the plot, an end or the floor moved, or saying none: the
// very slope it had. One that went is a new one, with all that the old one - frozen here - held.
const STAYS = [{ y: [26, 34] }, { x: [30, 62] }, { x: [38, 46] }, { z: [12, 26] }];
for (const to of STAYS) assert.equal(went(DOWN, to), DOWN, JSON.stringify(to));
assert.equal(went('x', { x: [0, 16] }), 'x');
const old = Object.freeze({ note: 'kept', x: [30, 46], z: [12, 16] });
assert.equal(JSON.stringify(went(old, { x: [31, 47] })), '{"note":"kept","x":[31,47],"z":[12,16]}');
// WHAT A PLANE SHOWS OF A TOP (`topOn`), on the box's three rects: from above the step on the
// paper that leads down it; along the slope the rows of the top at the left of the rect and at
// the right; looked at along it the higher end at both, and the lower - of a cut half, row 14.
const RECTS = { top: [30, 20, 46, 28], side: [30, 12, 46, 20], end: [20, 12, 28, 20] };
const shows = (slope, to) => Object.keys(RECTS).map((p) => blocks.topOn(sloped(slope, to), p));
const [RUNS, LOOKS] = [{ ends: [12, 16] }, { ends: [12, 12], low: 16 }];
assert.deepEqual(shows(DOWN), [{ falls: [1, 0] }, RUNS, LOOKS]);
assert.deepEqual(shows(UP), [{ falls: [-1, 0] }, { ends: [16, 12] }, LOOKS]);
assert.deepEqual(shows(ACROSS), [{ falls: [0, 1] }, LOOKS, RUNS]);
assert.deepEqual(shows(DOWN, { x: [38, 46] })[2], { ends: [14, 14], low: 16 });
// HOW MUCH OF A PLANE THE BOX COVERS (`covers`), in cells: what the paper fills of it (`fills`).
// From above its rect, 16 by 8. Standing, its 8 rows under its top: along a top that falls 4 rows
// 6 in the mean - and looked at along it up to the higher end, all 8, or 6 of that cut half.
const covers = (slope) => Object.keys(RECTS).map((p) => blocks.covers(sloped(slope), p, RECTS[p]));
assert.deepEqual([covers(DOWN), covers(ACROSS)].flat(), [128, 96, 64, 128, 128, 48]);
assert.deepEqual(covers(), [128, 128, 64]);
assert.equal(blocks.covers(sloped(DOWN, { x: [38, 46] }), 'end', RECTS.end), 48);
