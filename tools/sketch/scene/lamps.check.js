// The check of the lamps, the plant and the towel rail: of each kind that lamps.js has a rule
// for, an object made up here at each of its four turns, on the floor of a made-up hall and on
// the ground beside it, lifted as the pad lifts its kind: against what holds of every part,
// against the pad's own top view, which draws each of them, and against a floor lamp and a towel
// rail that a person worked out by hand. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { lamps } from './lamps.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { SURFACES } from './surfaces.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the scripts that draw the furniture - the lamps and the plant - and the bathroom.
for (const script of ['figures', 'shapes', 'furniture', 'bathroom'])
  await import(`../${script}.js`);
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
// the ground, 24 m further down the plot. A table lamp and a pendant lamp lie where the pad lifts
// them to, over what they stand on. A kind's number is its place in `ORDER`: a floor lamp is 0,
// a towel rail 4.
const ORDER = Object.keys(lamps);
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 46], y: [2, 116], z: [24, 30], name: 'Hall' };
const span = (first, far) => [first, first + far];
function made(kind, turn, column, row, floor) {
  const [long, wide, high] = shapes.sizeOf({ kind, turn }).map((metres) => 2 * metres);
  const top = floor - 2 * (shapes.KINDS[kind].lift ?? 0) - high;
  const [x, y, z] = [span(column, long), span(row, wide), span(top, high)];
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
const alone = { blocks: [], kinds: lamps };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));
const sizeOf = ({ min, max }) => max.map((most, way) => most - min[way]);

// WITHIN ITS BOX, LIFTED. Of every kind at every turn, on the slab and on the ground: each piece
// lies within the box of its object - lifted by the slab in the hall, and by nothing on the
// ground - and no two pieces of different surfaces lie in each other (holds.js): a lamp's stem
// meets its shade, a plant's pot its leaves, a towel its rails. Told of no lift, the same
// question finds every object in the hall, and none on the ground.
assert.equal(OBJECTS.length, 8 * ORDER.length);
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// PIECES OF ITS OWN. A floor lamp is three pieces - its foot, its stem and its shade - a table
// lamp three, a pendant lamp two - its bowl and its cord - a plant two - its pot and its leaves -
// and a towel rail six - two posts, three rails and its towel. Each is a shape the scene has, of
// a surface there is, and none of `plain`, the surface of a kind without a rule, nor of `wood`,
// which is a floor's. None is as large as its object: no kind is one box of its size.
const COUNT = { floorlamp: 3, tablelamp: 3, pendant: 2, plant: 2, towelrail: 6 };
const SHAPES = ['box', 'round', 'ball', 'dome'];
// AND LIFTED AS ITS KIND SAYS, by hand: its lowest piece begins on what it stands on - the slab of
// the hall at 105.375 m, the ground at 104.75 m - and a table lamp 0.75 m over it, on a table's
// height, a pendant lamp 1.6 m. The pendant's cord reaches 2.7 m over it, to its box's top.
const OVER = { tablelamp: 0.75, pendant: 1.6 };
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
  assert.equal(lowest, held(standsOn(at) + (OVER[kind] ?? 0)), `${kind} lifted`);
  const highest = Math.max(...parts.map((part) => part.max[2]));
  if (kind === 'pendant') assert.equal(highest, held(standsOn(at) + 2.7), 'a pendant lamp');
}
// Of the house's surfaces, and of those the card says: a floor lamp of metal and fabric, a table
// lamp of ceramic, metal and fabric, a pendant lamp all of metal, a plant of ceramic and leaf,
// a towel rail of metal and fabric.
const surfacesOf = (kind) => [...new Set(partsOf(placeOf(kind, 0)).map((part) => part.surface))];
assert.deepEqual(ORDER.map(surfacesOf), [
  ['metal', 'fabric'],
  ['ceramic', 'metal', 'fabric'],
  ['metal'],
  ['ceramic', 'leaf'],
  ['metal', 'fabric'],
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
// `2:0` is the third piece on the first shape.
const LIES_ON = {
  floorlamp: '1:1 2:0', // its stem on the dot, its shade on the circle
  tablelamp: '1:1 2:0',
  pendant: '0:0 1:1', // its bowl on the circle, its cord on the dot
  plant: '1:0', // its leaves on the circle
  towelrail: '0:0 1:1 2:2 3:2 4:2 5:3', // its posts, its three rails on the bar, its towel
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

// A FLOOR LAMP AND A TOWEL RAIL, by hand. Not turned, each lies over x = 2 to 2.5, its far side
// at the larger y, on the slab at 105.375 m. The floor lamp, between y = 57.5 and 58, 1.6 m high:
// its foot of 0.3 m and 3 cm, its stem of 3 cm up to 106.675 m, 1.3 m over the slab, and its
// shade of 0.4 m on it to 106.975 m. The towel rail, between y = 37.5 and 38, 1.2 m high: its
// posts of 3 cm at its far side, to 106.575 m; its rails of 2 cm, between the posts, 0.5 cm in
// from its far side, about 105.875 m, 106.175 m and 106.475 m; its towel of 0.35 m, 2 cm thick,
// before them, from 106.185 m down to 105.825 m.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing });
assert.deepEqual([placeOf('floorlamp', 0), placeOf('towelrail', 0)], [1, 17]);
assert.deepEqual(partsOf(1), [
  piece(1, 'round', 'metal', [2.1, 57.6, 105.375], [2.4, 57.9, 105.405]),
  piece(1, 'round', 'metal', [2.235, 57.735, 105.405], [2.265, 57.765, 106.675]),
  piece(1, 'round', 'fabric', [2.05, 57.55, 106.675], [2.45, 57.95, 106.975]),
]);
const rail = (h) => piece(17, 'box', 'metal', [2.03, 37.975, h - 0.01], [2.47, 37.995, h + 0.01]);
assert.deepEqual(partsOf(17), [
  piece(17, 'round', 'metal', [2, 37.97, 105.375], [2.03, 38, 106.575]),
  piece(17, 'round', 'metal', [2.47, 37.97, 105.375], [2.5, 38, 106.575]),
  held(rail(105.875)),
  held(rail(106.175)),
  held(rail(106.475)),
  piece(17, 'box', 'fabric', [2.075, 37.955, 105.825], [2.425, 37.975, 106.185]),
]);

// IN THE HOUSE. objects.js has every one of these rules. With every rule there is - the hall's
// floor, its walls and its roof too - each object is the same pieces, and what holds of every
// part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === lamps[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a lamp, a plant and a towel rail are the few pieces of each kind, within its box and lifted as its kind is, turned as the pad turns its drawing\n',
);
