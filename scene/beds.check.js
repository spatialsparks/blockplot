// The check of a bed by its width (T-035.4): a bed made up here 1, 1.5 and 2 m wide and at each of
// its four turns, on the floor of a made-up hall and on the ground beside it - against what holds
// of every part, against the pad's own top view, which draws its pillows by its width, and
// against a bed of 1 m and one of 2 m that a person worked out by hand. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { furniture } from './furniture.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the script that draws the furniture, the bed among it.
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

// A hall of 30 m by 64 m, a storey of 3 m high, on level 30 at 105 m: its floor slab is 0.375 m
// thick. A bed of each width stands in it four times, turned by none to three quarters, each on a
// square of 5 m of its own - the first a metre clear of the hall's edges - and the same again on
// the ground, 32 m further down the plot. A row of squares is a width, the narrowest first. A bed
// of 2 m says no width: it is the kind's own.
const WIDTHS = [1, 1.5, 2];
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 62], y: [2, 130], z: [24, 30], name: 'Hall' };
const span = (first, far) => [first, first + far];
function made(deep, turn, column, row, floor) {
  const own = deep === 2 ? {} : { deep };
  const [along, wide, high] = shapes.sizeOf({ kind: 'bed', turn, ...own }).map((m) => 2 * m);
  const [x, y, z] = [span(column, along), span(row, wide), span(floor - high, high)];
  return { kind: 'bed', turn, ...own, fill: '#eceff2', floor, x, y, z };
}
const things = [
  { ...HALL, colour: { name: 'grey', hex: '#8795a1' } },
  ...[30, 30.5].flatMap((floor, outside) =>
    WIDTHS.flatMap((deep, nth) =>
      TURNS.map((turn) => made(deep, turn, 4 + 10 * turn + 64 * outside, 4 + 10 * nth, floor)),
    ),
  ),
];
/** The place in `things` of the bed of a width at a turn: in the hall, or on the ground. */
const placeOf = (deep, turn, outside = 0) =>
  1 + 4 * (WIDTHS.length * outside + WIDTHS.indexOf(deep)) + turn;
const [INSIDE, OBJECTS] = [12, 24].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);
const widthOf = (at) => WIDTHS[Math.floor((at - 1) / 4) % 3];

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects the furniture's.
const alone = { blocks: [], kinds: furniture };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));

// WITHIN ITS BOX, LIFTED. At every width and turn, on the slab and on the ground: each piece lies
// within the box of its object, and no two pieces of different surfaces lie in each other
// (holds.js). Told of no lift, the same question finds every bed in the hall, and none outside.
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// AS MANY PIECES AS ITS WIDTH SAYS. A head, a base, a mattress and a pillow - four - under 1.5 m;
// from 1.5 m a second pillow - five. Its mattress is 4 cm in from either side, in metres, at
// every width: as wide as the bed, less 8 cm.
const COUNT = [4, 5, 5];
for (const at of OBJECTS) {
  const [deep, parts] = [widthOf(at), partsOf(at)];
  assert.equal(parts.length, COUNT[WIDTHS.indexOf(deep)], `a bed of ${deep} m`);
  const way = things[at].turn % 2 === 0 ? 1 : 0;
  const mattress = parts[2];
  assert.equal(held(mattress.max[way] - mattress.min[way]), held(deep - 0.08), `${deep} m`);
}

// TURNED. A quarter on, a bed lies a quarter on about the middle of its box, clockwise seen from
// above: at every width, the pieces at a turn are those of the bed that is not turned, each a
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
for (const deep of WIDTHS) {
  let pieces = about(placeOf(deep, 0));
  for (const turn of TURNS) {
    assert.deepEqual(about(placeOf(deep, turn)), pieces, `${deep} m turned by ${turn}`);
    assert.deepEqual(about(placeOf(deep, turn, 1)), pieces, `${deep} m on the ground`);
    pieces = pieces.map(quarterOn);
  }
}

/** What the pad's top view draws of a thing: the places of each shape, in metres, as it draws them. */
function padDraws({ kind, turn, deep, x, y }) {
  const drawn = [];
  const canvas = { beginPath: () => drawn.push([]), lineTo: (...at) => drawn.at(-1).push(at) };
  for (const other of ['closePath', 'fill', 'stroke', 'setLineDash']) canvas[other] = () => {};
  shapes.draw(canvas, { kind, turn, deep }, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 66 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the floor. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});

// WHERE THE PAD DRAWS ITS PILLOWS. From above, the pad draws a bed as its box, its pillows and
// the line of its cover. At every width and every quarter it draws as many pillows as the bed
// has, and each pillow, from the fourth piece on, covers the floor its pillow there covers.
for (const deep of WIDTHS) {
  for (const turn of TURNS) {
    const at = placeOf(deep, turn);
    const [[, , , ...pillows], [, ...drawn]] = [partsOf(at), padDraws(things[at])];
    const said = `a bed of ${deep} m turned by ${turn}`;
    assert.equal(drawn.length - 1, pillows.length, said);
    pillows.forEach(({ min, max }, nth) => {
      assert.deepEqual({ min: min.slice(0, 2), max: max.slice(0, 2) }, around(drawn[nth]), said);
    });
  }
}

// A BED OF 1 M, by hand. Not turned, in the hall, it lies between x = 2 and 4 and between
// y = 63 and 64, its far side at 64, on the slab at 105.375 m, and is 1 m high. Its head, 8 cm
// thick, and its base of 0.3 m are its whole width; its mattress of 0.2 m lies 4 cm in at its
// foot and at either side; its one pillow, 0.36 m by 0.8 m and 12 cm high, lies at the head,
// 0.1 m from either side.
const PIECE = { of: 'piece', floor: 105, shape: 'box' };
const piece = (thing, surface, min, max) => ({ ...PIECE, min, max, surface, thing });
assert.equal(placeOf(1, 0), 1);
assert.deepEqual(partsOf(1), [
  piece(1, 'joinery', [2, 63, 105.375], [2.08, 64, 106.375]),
  piece(1, 'joinery', [2.08, 63, 105.375], [4, 64, 105.675]),
  piece(1, 'fabric', [2.08, 63.04, 105.675], [3.96, 63.96, 105.875]),
  piece(1, 'fabric', [2.08, 63.1, 105.875], [2.44, 63.9, 105.995]),
]);
// A BED OF 1.5 M has two pillows of 0.6 m, 9 cm from either side and 12 cm apart: not turned,
// between y = 57.5 and 59, they lie from 58.31 to 58.91 and from 57.59 to 58.19 across.
const [, , , ...wider] = partsOf(placeOf(1.5, 0));
assert.deepEqual(
  wider.map(({ min, max }) => [min[1], max[1]]),
  [
    [58.31, 58.91],
    [57.59, 58.19],
  ],
);
// A BED OF 2 M, by hand: the five pieces of the bed before it had a width. Not turned, between
// x = 2 and 4 and between y = 52 and 54, its two pillows of 0.36 m by 0.8 m 12 cm from either
// side.
assert.equal(placeOf(2, 0), 9);
assert.deepEqual(partsOf(9), [
  piece(9, 'joinery', [2, 52, 105.375], [2.08, 54, 106.375]),
  piece(9, 'joinery', [2.08, 52, 105.375], [4, 54, 105.675]),
  piece(9, 'fabric', [2.08, 52.04, 105.675], [3.96, 53.96, 105.875]),
  piece(9, 'fabric', [2.08, 53.08, 105.875], [2.44, 53.88, 105.995]),
  piece(9, 'fabric', [2.08, 52.12, 105.875], [2.44, 52.92, 105.995]),
]);

// CUT WHERE ITS ROOM ENDS (clear.js): a bed left 0.5 m or 5 cm wide by a room too small for it is
// still a head, a base, a mattress and one pillow, each within the box it is given and none
// turned inside out - the rule reads that box, not the sketch's width.
const cut = (far) => ({
  things: [{ turn: 0 }],
  boxOf: () => ({ min: [0, 0, 0], max: [2, far, 1] }),
});
for (const far of [0.5, 0.05]) {
  const pieces = furniture.bed(cut(far), 0);
  assert.equal(pieces.length, 4, `a bed cut to ${far} m`);
  for (const { min, max } of pieces) {
    const within = [0, 1, 2].every((way) => min[way] >= 0 && min[way] < max[way]);
    assert.ok(within && max[1] <= far && max[0] <= 2, `a bed cut to ${far} m`);
  }
}

// IN THE HOUSE. objects.js has this rule; with every rule there is - the hall's floor, its walls
// and its roof too - each bed is the same pieces, and what holds of every part holds.
assert.ok(KINDS.bed === furniture.bed);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), `bed ${at}`);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a bed is built by its width - one pillow under 1.5 m, two from 1.5 m, its mattress 4 cm in - within its box, turned as the pad turns its drawing\n',
);
