// The check of the furniture: of every kind that furniture.js has a rule for, an object made up
// here at each of its four turns - on the floor of a made-up hall, and on the ground beside it -
// against what holds of every part, against the pad's own top view, which draws each of them,
// and against a bed and a table that a person worked out by hand. Run by tools/sketch/check.js,
// as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { furniture } from './furniture.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { SURFACES } from './surfaces.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the scripts that draw the garden's kinds and the furniture.
for (const script of ['figures', 'shapes', 'garden', 'furniture']) await import(`../${script}.js`);
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
// thick. Every kind stands in it four times, turned by none to three quarters, each on a square
// of 5 m of its own and as large as the pad says its kind is - the first a metre clear of the
// hall's edges - and the same four again on the ground, 24 m further down the plot. A kind's
// number is its place in `ORDER`: a bed is 0, a table 2.
const ORDER = Object.keys(furniture);
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
const [INSIDE, OBJECTS] = [44, 88].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);

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
const sizeOf = ({ min, max }) => max.map((most, way) => most - min[way]);

// WITHIN ITS BOX, LIFTED. Of every kind at every turn, on the slab and on the ground: each
// piece is a part as parts.js says one is, lies within the box of its object - lifted by the
// slab in the hall, and by nothing on the ground - and no two pieces of different surfaces lie
// in each other (holds.js). Told of no lift, the same question finds every object in the hall,
// and none on the ground: of each kind a piece reaches higher than its box, by the slab.
assert.equal(OBJECTS.length, 8 * ORDER.length);
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// PIECES OF ITS OWN. A kind is as many pieces as it is said in, eight at the most, each of a
// surface there is - and none of `plain`, the surface of a kind without a rule, nor of `wood`,
// which is a floor's: the wood of what stands on one is `joinery`. None is as large as its
// object: no kind is one box of its size. And each kind stands on its foot: its lowest piece
// begins where its box does, lifted.
const COUNT = [5, 4, 5, 6, 3, 3, 2, 6, 4, 1, 1];
const SHAPES = ['box', 'round', 'ball'];
for (const at of OBJECTS) {
  const [solid, parts] = [held(scene.solids[at]), partsOf(at)];
  const { kind } = things[at];
  assert.equal(parts.length, COUNT[ORDER.indexOf(kind)], kind);
  assert.ok(parts.length <= 8, `a ${kind} is many pieces`);
  for (const part of parts) {
    assert.ok(part.of === 'piece' && SHAPES.includes(part.shape), `${kind}: ${part.shape}`);
    assert.ok(Object.hasOwn(SURFACES, part.surface) && part.surface !== 'plain', part.surface);
    assert.notEqual(part.surface, 'wood', `a ${kind} of a floor's wood`);
    const whole = sizeOf(part).every((far, way) => far > sizeOf(solid)[way] - 1e-9);
    assert.ok(!whole, `a ${kind} is a box of its size`);
  }
  assert.equal(Math.min(...parts.map((part) => part.min[2])), held(solid.min[2] + lift(at)), kind);
}

// TURNED. A quarter on, an object lies a quarter on about the middle of its box, clockwise seen
// from above: what pointed down the plot points towards the smaller y, and what pointed towards
// the larger y points down the plot. Each piece as it lies about that middle, and over the foot
// of its object: of every kind, the pieces at a turn are the pieces of the one that is not
// turned, each a quarter on as often. On the ground a kind is the same pieces, not lifted.
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
// A turn counts in quarters: five of them are one, and one back is three.
const turnedBy = (turn) => held(sceneOf(site, [{ ...things[2], turn }], figures, alone).parts);
assert.deepEqual([turnedBy(5), turnedBy(-1)], [turnedBy(1), turnedBy(3)]);

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
/** A line that the pad draws along a row or a column: the extent it lies across, and where. */
function lineOf(places) {
  const { min, max } = around(places);
  const across = min[0] === max[0] ? 0 : 1;
  return [across, min[across]];
}
/** On which side of such a line a piece lies, -1 or 1 - and 0 where the line runs through it. */
const sideOf = ({ min, max }, [across, where]) =>
  max[across] <= where ? -1 : min[across] >= where ? 1 : 0;
/** Whether two pieces lie on either side of a line, and whether a piece ends on one. */
const parted = (line, one, other) => sideOf(one, line) * sideOf(other, line) === -1;
const endsOn = ({ min, max }, [across, where]) => [min[across], max[across]].includes(where);
/** Whether a piece covers a place of the floor. */
const holds = ({ min, max }, place) =>
  [0, 1].every((way) => min[way] <= place[way] && place[way] <= max[way]);

// WHERE THE PAD DRAWS IT. The pad's top view draws each kind into the box of its object: a shape
// for a bed's pillow, for a sofa's back and each of its arms, for a table's leg, for a car's
// cabin. Of each kind the piece at a place in its list - the first is 0 - covers the floor that
// the shape at a place in the pad's drawing covers, at every quarter: `3:1` is the fourth piece
// on the second shape.
const LIES_ON = {
  bed: '3:1 4:2', // its two pillows
  sofa: '1:1 2:2 3:3', // its back, and its two arms
  table: '0:0 1:1 2:2 3:3 4:4', // its top, and its four legs
  chair: '0:0 1:1', // its seat, and its back
  desk: '0:0', // its top
  person: '0:0 1:1', // its body, and its head
  car: '1:1', // its cabin
  fountain: '0:0 3:1', // its basin, and the bowl over it
};
for (const turn of TURNS) {
  const seen = (kind) => {
    const at = placeOf(kind, turn);
    return [partsOf(at).map((part) => around([part.min, part.max])), padDraws(things[at])];
  };
  for (const [kind, pairs] of Object.entries(LIES_ON)) {
    const [pieces, drawn] = seen(kind);
    for (const [piece, shape] of pairs.split(' ').map((pair) => pair.split(':'))) {
      const said = `piece ${piece} of a ${kind} turned by ${turn}`;
      assert.deepEqual(pieces[piece], around(drawn[shape]), said);
    }
  }
  // A desk's drawers begin on the line that the pad draws under its top, and its board stands on
  // the other side of that line. A wardrobe's doors hang before the line that the pad draws
  // across it, its body behind, one door on either side of the line the pad draws between them.
  const [[, board, drawers], [, under]] = seen('desk');
  const [[body, ...doors], [, , , front, split]] = seen('wardrobe');
  const [below, before, between] = [under, front, split].map(lineOf);
  assert.ok(endsOn(drawers, below), `a desk's drawers, turned by ${turn}`);
  assert.ok(parted(below, board, drawers), `a desk's board, turned by ${turn}`);
  assert.ok(endsOn(doors[0], before) && endsOn(doors[1], before), `doors, turned by ${turn}`);
  assert.ok(parted(before, body, doors[0]), `a wardrobe's body, turned by ${turn}`);
  assert.ok(parted(between, ...doors), `a wardrobe's two doors, turned by ${turn}`);
  // A door's leaf lies shut: along the edge of its square from the hinge, where the pad's leaf
  // begins, to where the pad's swing ends - and not where the pad's leaf stands open. A window's
  // pane lies along the line that the pad draws through it, from end to end, half on either side.
  const [[leaf], [open, swing]] = seen('door');
  const lies = [open[0], swing.at(-1), open[1]].map((place) => holds(leaf, place));
  assert.deepEqual(lies, [true, true, false], `a door's leaf, turned by ${turn}`);
  const [[pane], [, through]] = seen('window');
  const [across, where] = lineOf(through);
  const middle = held((pane.min[across] + pane.max[across]) / 2);
  assert.deepEqual([...through.map((end) => holds(pane, end)), middle], [true, true, where]);
}

// A BED, by hand. Not turned, it lies between x = 2 and 4 and between y = 56 and 58, its far side
// at 58, on the slab at 105.375 m, and is 1 m high. Its head, 8 cm thick, stands at the uphill
// end; its base is 0.3 m high; its mattress, 0.2 m, lies 4 cm in on three sides; and its two
// pillows, 0.36 m by 0.8 m and 12 cm high, lie at the head, 12 cm from either side.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing });
assert.deepEqual(partsOf(1), [
  piece(1, 'box', 'joinery', [2, 56, 105.375], [2.08, 58, 106.375]),
  piece(1, 'box', 'joinery', [2.08, 56, 105.375], [4, 58, 105.675]),
  piece(1, 'box', 'fabric', [2.08, 56.04, 105.675], [3.96, 57.96, 105.875]),
  piece(1, 'box', 'fabric', [2.08, 57.08, 105.875], [2.44, 57.88, 105.995]),
  piece(1, 'box', 'fabric', [2.08, 56.12, 105.875], [2.44, 56.92, 105.995]),
]);
// Turned by a quarter, between x = 7 and 9, its head stands at the largest y, up the paper of
// the top view, and its pillows lie before it, side by side along x.
assert.deepEqual(partsOf(2), [
  piece(2, 'box', 'joinery', [7, 57.92, 105.375], [9, 58, 106.375]),
  piece(2, 'box', 'joinery', [7, 56, 105.375], [9, 57.92, 105.675]),
  piece(2, 'box', 'fabric', [7.04, 56.04, 105.675], [8.96, 57.92, 105.875]),
  piece(2, 'box', 'fabric', [8.08, 57.56, 105.875], [8.88, 57.92, 105.995]),
  piece(2, 'box', 'fabric', [7.12, 57.56, 105.875], [7.92, 57.92, 105.995]),
]);
// A TABLE, by hand: 2 m by 1 m, between x = 2 and 4 and between y = 47 and 48, 0.75 m high. Its
// top is 0.0525 m thick; its four legs are round, 8 cm across, and stand at its corners: each
// 8 cm in at its end and 8 cm in at its side.
const leg = (x, y) => piece(9, 'round', 'joinery', [x, y, 105.375], [x + 0.08, y + 0.08, 106.0725]);
assert.deepEqual(partsOf(9), [
  piece(9, 'box', 'joinery', [2, 47, 106.0725], [4, 48, 106.125]),
  ...[leg(2.08, 47.84), leg(2.08, 47.08), leg(3.84, 47.84), leg(3.84, 47.08)],
]);

// IN THE HOUSE. objects.js has every one of these rules, and a rule for every kind the pad has:
// none is left the plain box of a kind without one. With every rule there is - the hall's
// floor, its walls and its roof too - each object is the same pieces: none of them stands at a
// wall, so no door and no window here opens one, and what holds of every part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === furniture[kind], kind);
for (const kind of Object.keys(shapes.KINDS)) assert.ok(Object.hasOwn(KINDS, kind), kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a piece of furniture is the few pieces of its kind, within its box and on its slab, turned as the pad turns its drawing\n',
);
