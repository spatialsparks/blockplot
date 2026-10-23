// The check of the garden's: of each kind that garden.js has a rule for - a bench, a garden
// table, a sun lounger, a parasol, a grill - an object made up here at each of its four turns, on
// the floor of a made-up hall and on the ground beside it: against what holds of every part,
// against the pad's own top view, which draws each of them, and against a parasol and a grill
// that a person worked out by hand. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { garden } from './garden.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { SURFACES } from './surfaces.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the script that draws what stands in a garden.
for (const script of ['figures', 'shapes', 'garden']) await import(`../${script}.js`);
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

// A hall of 22 m by 57 m, a storey of 4 m high - under its roof slab a parasol of 2.5 m stands
// whole - on level 30 at 105 m: its floor slab is 0.375 m thick. Each kind stands in it four
// times, turned by none to three quarters, each on a square of 5 m of its own - the first a
// metre clear of the hall's edges - and the same four again on the ground, 24 m further down the
// plot. A kind's number is its place in `ORDER`: a bench is 0, a grill 4.
const ORDER = Object.keys(garden);
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 46], y: [2, 116], z: [22, 30], name: 'Hall' };
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
const [INSIDE, OBJECTS] = [20, 40].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects these.
const scene = sceneOf(site, things, figures, { blocks: [], kinds: garden });
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));
const sizeOf = ({ min, max }) => max.map((most, way) => most - min[way]);

// WITHIN ITS BOX, LIFTED. Of every kind at every turn, on the slab and on the ground: each piece
// lies within the box of its object - lifted by the slab in the hall, and by nothing on the
// ground - and no two pieces of different surfaces lie in each other (holds.js): a bench's seat
// meets its ends, a parasol's pole its canopy, a grill's handle its lid. Told of no lift, the
// same question finds every object in the hall, and none on the ground.
assert.equal(OBJECTS.length, 8 * ORDER.length);
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// PIECES OF ITS OWN. A bench is six pieces - at each end a frame and a post, a seat and a back -
// a garden table three - its top, its column and its foot - a sun lounger seven - four legs, a
// frame, a cushion and a back - a parasol three - its foot, its pole and its canopy - and a grill
// six - four legs, a kettle and a handle. Each is a shape the scene has, of a surface there is,
// and none of `plain`, the surface of a kind without a rule, nor of `wood`, which is a floor's.
// None is as large as its object: no kind is one box of its size. And each stands on what it
// stands on, by hand: the slab of the hall at 105.375 m, the ground at 104.75 m.
const COUNT = { bench: 6, gardentable: 3, lounger: 7, parasol: 3, grill: 6 };
const SHAPES = ['box', 'round', 'ball', 'dome'];
const standsOn = (at) => (things[at].floor === 30 ? 105.375 : 104.75);
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
  const lowest = Math.min(...parts.map((part) => part.min[2]));
  assert.equal(lowest, held(solid.min[2] + lift(at)), kind);
  assert.equal(lowest, standsOn(at), `${kind} on its floor`);
}
// Of the house's surfaces, and of those the card says: a bench of metal and joinery, a garden
// table of joinery and metal, a sun lounger of joinery and fabric, a parasol of stone, metal and
// fabric, a grill of metal and joinery.
const surfacesOf = (kind) => [...new Set(partsOf(placeOf(kind, 0)).map((part) => part.surface))];
assert.deepEqual(ORDER.map(surfacesOf), [
  ['metal', 'joinery'],
  ['joinery', 'metal'],
  ['joinery', 'fabric'],
  ['stone', 'metal', 'fabric'],
  ['metal', 'joinery'],
]);

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
// `4:1` is the fifth piece on the second shape.
const LIES_ON = {
  bench: '4:1 5:2', // its seat between its ends, its back along its far side
  gardentable: '0:0', // its top on the circle
  lounger: '4:0 5:0 6:1', // its frame and its cushion on its outline, its back at its head
  parasol: '2:0 1:1', // its canopy on the circle, its pole on the dot
  grill: '4:0 5:1', // its kettle on the circle, its handle on the bar
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

// A PARASOL AND A GRILL, by hand. Not turned, each on the slab at 105.375 m. The parasol over
// x = 2 to 4.5 and y = 40.5 to 43, its middle at 3.25 and 41.75: its foot of stone, 0.5 m across
// and 0.1 m high; its pole of 4 cm up to 107.475 m, 2.1 m over the slab; its canopy, as wide as
// it is, from there to 107.875 m. The grill over x = 2 to 2.5 and y = 37.5 to 38: its four legs
// of 3 cm, 7 cm in from its sides, up to 105.925 m, 0.55 m over the slab; its kettle on them to
// 106.345 m; and its handle on the lid, 12 cm along it and 3 cm across, to 106.375 m.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing });
assert.deepEqual([placeOf('parasol', 0), placeOf('grill', 0)], [13, 17]);
assert.deepEqual(partsOf(13), [
  piece(13, 'round', 'stone', [3, 41.5, 105.375], [3.5, 42, 105.475]),
  piece(13, 'round', 'metal', [3.23, 41.73, 105.475], [3.27, 41.77, 107.475]),
  piece(13, 'dome', 'fabric', [2, 40.5, 107.475], [4.5, 43, 107.875]),
]);
const leg = (x, y) => piece(17, 'round', 'metal', [x, y, 105.375], [x + 0.03, y + 0.03, 105.925]);
assert.deepEqual(partsOf(17), [
  held(leg(2.07, 37.9)),
  held(leg(2.07, 37.57)),
  held(leg(2.4, 37.9)),
  held(leg(2.4, 37.57)),
  piece(17, 'ball', 'metal', [2, 37.5, 105.925], [2.5, 38, 106.345]),
  piece(17, 'box', 'joinery', [2.19, 37.735, 106.345], [2.31, 37.765, 106.375]),
]);

// IN THE HOUSE. objects.js has every one of these rules. With every rule there is - the hall's
// floor, its walls and its roof too - each object is the same pieces, and what holds of every
// part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === garden[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a bench, a garden table, a sun lounger, a parasol and a grill are the few pieces of each kind, within its box, turned as the pad turns its drawing\n',
);
