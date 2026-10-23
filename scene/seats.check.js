// The check of the seats: of each kind that seats.js has a rule for - an office chair, an
// armchair, a corner sofa - an object made up here at each of its four turns, on the floor of a
// made-up hall and on the ground beside it: against what holds of every part, against the pad's
// own top view, which draws each of them, and against an armchair that a person worked out by
// hand. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { seats } from './seats.js';
import { SURFACES } from './surfaces.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the script that draws the furniture, the seats among it.
for (const script of ['figures', 'shapes', 'furniture']) await import(`../${script}.js`);
const { shapes } = globalThis;

// A made-up plot of 48 m by 60 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 60 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m: in row 30.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 48,
  yFromM: 0,
  yToM: 60,
  sideM: [100, 120],
  outline: [
    [1, 59],
    [47, 59],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(121).fill(Array(97).fill('475').join(' ')) },
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

// A hall of 22 m by 57 m, a storey of 3 m high, on level 30 at 105 m: its floor slab is 0.375 m
// thick. Each kind stands in it four times, turned by none to three quarters, each on a square
// of 5 m of its own - the first a metre clear of the hall's edges - and the same four again on
// the ground, 24 m further down the plot. A kind's number is its place in `ORDER`: an office
// chair is 0, an armchair 1, a corner sofa 2.
const ORDER = Object.keys(seats);
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 46], y: [2, 116], z: [24, 30], name: 'Hall' };
const span = (first, far) => [first, first + far];
function made(kind, turn, column, row, floor) {
  const [long, wide, high] = shapes.sizeOf({ kind, turn }).map((metres) => 2 * metres);
  const [x, y, z] = [span(column, long), span(row, wide), span(floor - high, high)];
  return { kind, turn, fill: '#eceff2', floor, x, y, z };
}
const things = [
  { ...HALL, colour: { name: 'grey', hex: '#8795a1' } },
  ...[30, 30.5].flatMap((floor, outside) =>
    ORDER.flatMap((kind, nth) =>
      TURNS.map((turn) => made(kind, turn, 4 + 10 * turn + 48 * outside, 4 + 10 * nth, floor)),
    ),
  ),
];
/** The place in `things` of a kind's object at a turn: in the hall, or on the ground. */
const placeOf = (kind, turn, outside = 0) =>
  1 + 4 * (ORDER.length * outside + ORDER.indexOf(kind)) + turn;
const [INSIDE, OBJECTS] = [12, 24].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects the seats'.
const alone = { blocks: [], kinds: seats };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));
const sizeOf = ({ min, max }) => max.map((most, way) => most - min[way]);

// WITHIN ITS BOX, LIFTED. Of every kind at every turn, on the slab and on the ground: each piece
// lies within the box of its object - lifted by the slab in the hall, and by nothing on the
// ground - and no two pieces of different surfaces lie in each other (holds.js): an office
// chair's column meets its seat, an armchair's legs meet what they carry. Told of no lift, the
// same question finds every object in the hall, and none on the ground.
assert.equal(OBJECTS.length, 8 * ORDER.length);
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// PIECES OF ITS OWN. An office chair is four pieces - its foot, its column, its seat and its
// back - an armchair eight - its seat, its back, two arms and four legs - and a corner sofa five -
// two backs, two seats and an arm. Each is a box or a round of a surface there is, and none of
// `plain`, the surface of a kind without a rule, nor of `wood`, which is a floor's. None is as
// large as its object: no kind is one box of its size. And each stands on its foot: its lowest
// piece begins where its box does, lifted.
const COUNT = { officechair: 4, armchair: 8, cornersofa: 5 };
const SHAPES = ['box', 'round'];
for (const at of OBJECTS) {
  const [solid, parts] = [held(scene.solids[at]), partsOf(at)];
  const { kind } = things[at];
  assert.equal(parts.length, COUNT[kind], kind);
  for (const part of parts) {
    assert.ok(part.of === 'piece' && SHAPES.includes(part.shape), `${kind}: ${part.shape}`);
    assert.ok(Object.hasOwn(SURFACES, part.surface) && part.surface !== 'plain', part.surface);
    assert.notEqual(part.surface, 'wood', `a ${kind} of a floor's wood`);
    const whole = sizeOf(part).every((far, way) => far > sizeOf(solid)[way] - 1e-9);
    assert.ok(!whole, `a ${kind} is a box of its size`);
  }
  assert.equal(Math.min(...parts.map((part) => part.min[2])), held(solid.min[2] + lift(at)), kind);
}
// Of the house's surfaces, and of those the card says: an office chair of metal and fabric, an
// armchair of fabric on joinery, a corner sofa all of fabric.
const surfacesOf = (kind) => [...new Set(partsOf(placeOf(kind, 0)).map((part) => part.surface))];
assert.deepEqual(ORDER.map(surfacesOf), [['metal', 'fabric'], ['fabric', 'joinery'], ['fabric']]);

// TURNED. A quarter on, an object lies a quarter on about the middle of its box, clockwise seen
// from above: what pointed down the plot points towards the smaller y, and what pointed towards
// the larger y points down the plot. Of every kind, the pieces at a turn are the pieces of the
// one that is not turned, each a quarter on as often; on the ground the same pieces, not lifted.
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
  let pieces = about(placeOf(kind, 0));
  for (const turn of TURNS) {
    assert.deepEqual(about(placeOf(kind, turn)), pieces, `${kind} turned by ${turn}`);
    assert.deepEqual(about(placeOf(kind, turn, 1)), pieces, `${kind} on the ground`);
    pieces = pieces.map(quarterOn);
  }
}

/** What the pad's top view draws of a thing: the places of each shape, in metres, as it draws them. */
function padDraws({ kind, turn, x, y }) {
  const drawn = [];
  const canvas = {
    beginPath: () => drawn.push([]),
    lineTo: (column, row) => drawn.at(-1).push([column, row]),
    ellipse: (column, row, wide, high) =>
      drawn.at(-1).push([column - wide, row - high], [column + wide, row + high]),
  };
  for (const other of ['closePath', 'fill', 'stroke', 'setLineDash']) canvas[other] = () => {};
  shapes.draw(canvas, { kind, turn }, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 60 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the floor. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});

// WHERE THE PAD DRAWS IT. Of each kind the piece at a place in its list - the first is 0 -
// covers the floor that the shape at a place in the pad's drawing covers, at every quarter:
// `3:1` is the fourth piece on the second shape.
const LIES_ON = {
  officechair: '0:2 2:0 3:1', // its foot on the circle, its seat, and its back
  armchair: '1:1 2:2 3:3', // its back, and its two arms
  cornersofa: '0:1 1:2 4:3', // its two backs, and its arm
};
for (const turn of TURNS) {
  for (const [kind, pairs] of Object.entries(LIES_ON)) {
    const at = placeOf(kind, turn);
    const [pieces, drawn] = [
      partsOf(at).map((part) => around([part.min, part.max])),
      padDraws(things[at]),
    ];
    for (const [piece, shape] of pairs.split(' ').map((pair) => pair.split(':'))) {
      const said = `piece ${piece} of a ${kind} turned by ${turn}`;
      assert.deepEqual(pieces[piece], around(drawn[shape]), said);
    }
  }
}

// AN ARMCHAIR, by hand. Not turned, it lies between x = 2 and 3 and between y = 52 and 53, its
// far side at 53, on the slab at 105.375 m, and is 0.8 m high. Its legs are 10 cm high, 5 cm
// across, 5 cm in at its ends and at its sides; on them, from 105.475 m, its seat of 0.7 m by
// 0.8 m up to 105.795 m, 0.42 m over the slab; its back 0.2 m deep at its far side, to its top;
// and its arms of 0.15 m by 0.8 m, 0.6 m high.
const PIECE = { of: 'piece', floor: 105 };
const piece = (shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing: 5 });
const leg = ([x, far], [y, wide]) =>
  piece('round', 'joinery', [x, y, 105.375], [far, wide, 105.475]);
assert.equal(placeOf('armchair', 0), 5);
assert.deepEqual(partsOf(5), [
  piece('box', 'fabric', [2.15, 52, 105.475], [2.85, 52.8, 105.795]),
  piece('box', 'fabric', [2, 52.8, 105.475], [3, 53, 106.175]),
  piece('box', 'fabric', [2, 52, 105.475], [2.15, 52.8, 105.975]),
  piece('box', 'fabric', [2.85, 52, 105.475], [3, 52.8, 105.975]),
  leg([2.05, 2.1], [52.9, 52.95]),
  leg([2.05, 2.1], [52.05, 52.1]),
  leg([2.9, 2.95], [52.9, 52.95]),
  leg([2.9, 2.95], [52.05, 52.1]),
]);

// A CORNER SOFA OF ONE HAND. Not turned, between x = 2 and 5 and between y = 46 and 48: its
// second seat comes forward at its uphill end - from x = 2.25, before the back along that end,
// to x = 3, and from y = 46, its front, to 47, the middle of its depth. Turned by two quarters,
// that seat lies at the other end and at the far side: turned, never mirrored.
const secondSeat = (turn) => {
  const { min, max } = partsOf(placeOf('cornersofa', turn))[3];
  return [min.slice(0, 2), max.slice(0, 2)];
};
assert.deepEqual(secondSeat(0), [
  [2.25, 46],
  [3, 47],
]);
assert.deepEqual(secondSeat(2), [
  [14, 47],
  [14.75, 48],
]);

// IN THE HOUSE. objects.js has every one of these rules. With every rule there is - the hall's
// floor, its walls and its roof too - each object is the same pieces, and what holds of every
// part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === seats[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a seat is the few pieces of its kind, within its box and on its slab, turned as the pad turns its drawing\n',
);
