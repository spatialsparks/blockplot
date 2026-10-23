// The check of a sofa, a corner sofa, a table and a desk by their size (T-035.7): each made up here
// at its kind's own size and at the two ends of its ranges, at each of its four turns, on the floor
// of a made-up hall and on the ground beside it - against what holds of every part, against the
// thickness of its pieces at its kind's own size, against the pad's own top view, which draws them
// by their size, and against a table of 4 m by 1.5 m, 1.1 m high, and a corner sofa of 4 m by
// 3 m that a person worked out by hand. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { furniture } from './furniture.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { seats } from './seats.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the script that draws the furniture, these four among it.
for (const script of ['figures', 'shapes', 'furniture']) await import(`../${script}.js`);
const { shapes } = globalThis;

// A made-up plot of 64 m by 66 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 66 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m: in row 30.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 64,
  yFromM: 0,
  yToM: 66,
  sideM: [100, 120],
  outline: [
    [1, 65],
    [63, 65],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(133).fill(Array(129).fill('475').join(' ')) },
};
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.375,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.5,
  sillHighM: 1,
};

// Each kind at three sizes: its own, which says no size; the least of each of its ranges; and
// the most - its ranges are the pad's `TAKES`. A sofa is then 2 m by 1 m, 1.5 m by 1 m and 4 m
// by 1.5 m; a table 2 m by 1 m by 0.75 m, 1 m by 1 m by 0.7 m and 4 m by 1.5 m by 1.1 m.
const ORDER = ['sofa', 'cornersofa', 'table', 'desk'];
const RULES = { ...furniture, ...seats };
const [OWN, LEAST, MOST] = [0, 1, 2];
const sizesOf = (kind) => [
  {},
  ...[0, 1].map((end) =>
    Object.fromEntries(Object.entries(shapes.TAKES[kind]).map(([way, range]) => [way, range[end]])),
  ),
];

// A hall of 30 m by 64 m, a storey of 3 m high, on level 30 at 105 m: its floor slab is 0.375 m
// thick. Each kind at each size stands in it four times, turned by none to three quarters, each
// on a square of 5 m of its own - the first a metre clear of the hall's edges - and the same again
// on the ground, 32 m further down the plot. A row of squares is a kind at a size.
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 62], y: [2, 130], z: [24, 30], name: 'Hall' };
const span = (first, far) => [first, first + far];
function made(kind, own, turn, column, row, floor) {
  const [along, wide, high] = shapes.sizeOf({ kind, turn, ...own }).map((m) => 2 * m);
  const [x, y, z] = [span(column, along), span(row, wide), span(floor - high, high)];
  return { kind, turn, ...own, fill: shapes.KINDS[kind].fill, floor, x, y, z };
}
const things = [
  { ...HALL, colour: { name: 'grey', hex: '#8795a1' } },
  ...[30, 30.5].flatMap((floor, outside) =>
    ORDER.flatMap((kind, nth) =>
      sizesOf(kind).flatMap((own, size) =>
        TURNS.map((turn) =>
          made(kind, own, turn, 4 + 10 * turn + 64 * outside, 4 + 10 * (3 * nth + size), floor),
        ),
      ),
    ),
  ),
];
/** The place in `things` of a kind at a size and a turn: in the hall, or on the ground. */
const placeOf = (kind, size, turn, outside = 0) =>
  1 + 4 * (12 * outside + 3 * ORDER.indexOf(kind) + size) + turn;
const [INSIDE, OBJECTS] = [48, 96].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);
const everyOne = (does) =>
  ORDER.forEach((kind) =>
    [OWN, LEAST, MOST].forEach((size) =>
      TURNS.forEach((turn) => [0, 1].forEach((out) => does(kind, size, turn, out))),
    ),
  );

// A figure that a person works out in hundredths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects these four.
const alone = { blocks: [], kinds: Object.fromEntries(ORDER.map((kind) => [kind, RULES[kind]])) };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));

// WITHIN ITS BOX, LIFTED. At every size and turn, on the slab and on the ground: each piece lies
// within the box of its object, and no two pieces of different surfaces lie in each other
// (holds.js). Told of no lift, the same question finds every object in the hall, and none outside.
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// AS MANY PIECES, AS THICK, AT EVERY SIZE. A sofa is four pieces - a seat, a back and two arms;
// a corner sofa five - two backs, two seats and an arm; a table five - a top and four legs; a desk
// three - a top, a board and its drawers. Of each piece, the ways it is as thick in metres at
// every size and turn as at its kind's own size, not turned: `along` its length, `across` it, and
// `up`. A sofa's heights are all as they are; a table's and a desk's top is 0.0525 m thick.
const COUNT = { sofa: 4, cornersofa: 5, table: 5, desk: 3 };
const THICK = {
  sofa: ['up', 'across up', 'along up', 'along up'],
  cornersofa: ['across up', 'along up', 'across up', 'along up', 'along across up'],
  table: ['up', 'along across', 'along across', 'along across', 'along across'],
  desk: ['up', 'along', 'along'],
};
/** The thicknesses of the pieces of an object, in metres, by the ways `THICK` says of each. */
function thicknessOf(kind, at) {
  const ways = { along: things[at].turn % 2, across: 1 - (things[at].turn % 2), up: 2 };
  return partsOf(at).map(({ min, max }, nth) =>
    THICK[kind][nth].split(' ').map((way) => held(max[ways[way]] - min[ways[way]])),
  );
}
everyOne((kind, size, turn, out) => {
  const [at, said] = [placeOf(kind, size, turn, out), `a ${kind} of size ${size}, turn ${turn}`];
  assert.equal(partsOf(at).length, COUNT[kind], said);
  assert.deepEqual(thicknessOf(kind, at), thicknessOf(kind, placeOf(kind, OWN, 0)), said);
});

// TURNED. A quarter on, an object lies a quarter on about the middle of its box, clockwise seen
// from above: at every size, the pieces at a turn are those of the one that is not turned, each a
// quarter on as often. On the ground it is the same pieces, not lifted.
function about(at) {
  const { min, max } = scene.solids[at];
  const middle = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2] + lift(at)];
  return partsOf(at).map(({ shape, surface, ...box }) => {
    const [x, y, h] = middle.map((here, way) => held([box.min[way] - here, box.max[way] - here]));
    return { shape, surface, x, y, h };
  });
}
const quarterOn = ({ x, y, ...rest }) => ({ ...rest, x: y, y: held([-x[1], -x[0]]) });
for (const kind of ORDER) {
  for (const size of [OWN, LEAST, MOST]) {
    let pieces = about(placeOf(kind, size, 0));
    for (const turn of TURNS) {
      const said = `a ${kind} of size ${size} turned by ${turn}`;
      assert.deepEqual(about(placeOf(kind, size, turn)), pieces, said);
      assert.deepEqual(about(placeOf(kind, size, turn, 1)), pieces, `${said}, on the ground`);
      pieces = pieces.map(quarterOn);
    }
  }
}

/** What the pad's top view draws of a thing: the places of each shape, in metres, as it draws them. */
function padDraws({ kind, turn, long, deep, high, x, y }) {
  const drawn = [];
  const canvas = {
    beginPath: () => drawn.push([]),
    lineTo: (column, row) => drawn.at(-1).push([column, row]),
    ellipse: (column, row, wide, tall) =>
      drawn.at(-1).push([column - wide, row - tall], [column + wide, row + tall]),
  };
  for (const other of ['closePath', 'fill', 'stroke', 'setLineDash']) canvas[other] = () => {};
  const thing = { kind, turn, long, deep, high };
  shapes.draw(canvas, thing, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 66 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the floor. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});
/** Whether a place is a corner of a piece, seen from above. */
const cornerOf = ({ min, max }, place) =>
  [0, 1].every((way) => [min[way], max[way]].includes(place[way]));

// WHERE THE PAD DRAWS IT, AT EVERY SIZE. Of each kind the piece at a place in its list - the first
// is 0 - covers the floor that the shape at a place in the pad's top view covers, at every size
// and quarter: `3:1` is the fourth piece on the second shape. A desk's drawers begin where the
// pad's line under its top lies, and its board lies on the other side of that line. A corner
// sofa's second seat has for two of its corners the inner corner of the pad's L, and the end of
// that L's inner side.
const LIES_ON = {
  sofa: '1:1 2:2 3:3', // its back, and its two arms
  cornersofa: '0:1 1:2 4:3', // its two backs, and its arm
  table: '0:0 1:1 2:2 3:3 4:4', // its top, and its four legs
  desk: '0:0', // its top
};
everyOne((kind, size, turn, out) => {
  const at = placeOf(kind, size, turn, out);
  const [pieces, drawn] = [partsOf(at), padDraws(things[at])];
  const flat = pieces.map((part) => around([part.min, part.max]));
  const said = `a ${kind} of size ${size} turned by ${turn}`;
  for (const [piece, shape] of LIES_ON[kind].split(' ').map((pair) => pair.split(':'))) {
    assert.deepEqual(flat[piece], around(drawn[shape]), `piece ${piece} of ${said}`);
  }
  if (kind === 'desk') {
    const line = around(drawn[1]);
    const way = line.min[0] === line.max[0] ? 0 : 1;
    const [[, board, drawers], where] = [flat, line.min[way]];
    const sideOf = ({ min, max }) => Math.sign(min[way] + max[way] - 2 * where);
    assert.ok([drawers.min[way], drawers.max[way]].includes(where), `the drawers of ${said}`);
    assert.equal(sideOf(drawers) * sideOf(board), -1, `the board of ${said}`);
  }
  if (kind === 'cornersofa') {
    assert.ok(cornerOf(flat[3], drawn[0][3]) && cornerOf(flat[3], drawn[0][4]), said);
  }
});

// A CORNER SOFA OF 4 M BY 3 M, by hand. Not turned, in the hall, it lies between x = 2 and 6 and
// between y = 36 and 39, its far side at 39, on the slab at 105.375 m, and is 0.8 m high. Its back
// along its far side is 0.25 m deep; its back along its left end 0.25 m thick, from its front to
// that back. Its long seat, 0.448 m high, runs from x = 2.25 to 5.8, 0.2 m short of its right end,
// and from its back to 1 m out, y = 38; its arm, 0.6 m high, from 5.8 to 6, as far out; its second
// seat from x = 2.25 to 3, 1 m along, and from y = 38 to its front: it comes forward 2 m.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing });
const sofaPiece = (min, max) => piece(21, 'box', 'fabric', min, max);
assert.equal(placeOf('cornersofa', MOST, 0), 21);
assert.deepEqual(partsOf(21), [
  sofaPiece([2, 38.75, 105.375], [6, 39, 106.175]),
  sofaPiece([2, 36, 105.375], [2.25, 38.75, 106.175]),
  sofaPiece([2.25, 38, 105.375], [5.8, 38.75, 105.823]),
  sofaPiece([2.25, 36, 105.375], [3, 38, 105.823]),
  sofaPiece([5.8, 38, 105.375], [6, 38.75, 105.975]),
]);
// A TABLE OF 4 M BY 1.5 M, 1.1 M HIGH, by hand. Not turned, in the hall, between x = 2 and 6 and
// between y = 22.5 and 24, on the slab at 105.375 m: its top 0.0525 m thick, from 106.4225 m to
// 106.475 m; its four legs round, 8 cm across, each 8 cm in from its end and from its side - from
// x = 2.08 and to 5.92, from y = 22.58 and to 23.92 - up to its top.
const leg = (x, y) =>
  held(piece(33, 'round', 'joinery', [x, y, 105.375], [x + 0.08, y + 0.08, 106.4225]));
assert.equal(placeOf('table', MOST, 0), 33);
assert.deepEqual(partsOf(33), [
  piece(33, 'box', 'joinery', [2, 22.5, 106.4225], [6, 24, 106.475]),
  ...[leg(2.08, 23.84), leg(2.08, 22.58), leg(5.84, 23.84), leg(5.84, 22.58)],
]);

// CUT WHERE ITS ROOM ENDS (clear.js): each of the four left 0.3 m or 5 cm long and deep and
// 0.5 m high by a room too small for it is still as many pieces, each within the box it is given
// and none turned inside out - laid out in shares of its kind's least size.
for (const kind of ORDER) {
  for (const far of [0.3, 0.05]) {
    const cut = { things: [{ turn: 0 }], boxOf: () => ({ min: [0, 0, 0], max: [far, far, 0.5] }) };
    const pieces = RULES[kind](cut, 0);
    assert.equal(pieces.length, COUNT[kind], `a ${kind} cut to ${far} m`);
    for (const { min, max } of pieces) {
      const within = [0, 1, 2].every((way) => min[way] >= 0 && min[way] < max[way]);
      assert.ok(within && max[0] <= far && max[1] <= far && max[2] <= 0.5, `${kind}, ${far} m`);
    }
  }
}

// IN THE HOUSE. objects.js has these rules; with every rule there is - the hall's floor, its
// walls and its roof too - each object is the same pieces, and what holds of every part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === RULES[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a sofa, a corner sofa, a table and a desk are built by their size, each piece as thick at every size, within its box, on what the pad draws\n',
);
