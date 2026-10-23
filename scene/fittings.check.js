// The check of the fittings: of every kind that fittings.js has a rule for - a kitchen's and a
// bathroom's - an object made up here at each of its four turns, on the floor of a made-up hall
// and on the ground beside it, against what holds of every part, against the pad's own top
// view, which draws each of them, and against a toilet that a person worked out by hand. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { fittings } from './fittings.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { SURFACES } from './surfaces.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the scripts that draw a kitchen and a bathroom.
for (const script of ['figures', 'shapes', 'kitchen', 'bathroom']) {
  await import(`../${script}.js`);
}
const { shapes } = globalThis;

// A made-up plot of 48 m by 50 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 50 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m: in row 30.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 48,
  yFromM: 0,
  yToM: 50,
  sideM: [100, 120],
  outline: [
    [1, 49],
    [47, 49],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(101).fill(Array(97).fill('475').join(' ')) },
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

// A hall of 22 m by 47 m, a storey of 3 m high, on level 30 at 105 m: its floor slab is 0.375 m
// thick. Every kind stands in it four times, turned by none to three quarters, each on a square
// of 5 m of its own and as large as the pad says its kind is - the first a metre clear of the
// hall's edges - and the same four again on the ground, 24 m further down the plot. A hob and a
// sink lie where the pad lifts them to: 0.9 m over what they stand on. A kind's number is its
// place in `ORDER`: an island is 0, a toilet 5.
const ORDER = Object.keys(fittings);
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 46], y: [2, 96], z: [24, 30], name: 'Hall' };
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
const [INSIDE, OBJECTS] = [36, 72].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects the fittings'.
const alone = { blocks: [], kinds: fittings };
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
// which is a floor's: a washbasin's unit is `joinery`. None is as large as its object: no kind
// is one box of its size. And each kind stands on its foot: its lowest piece begins where its
// box does, lifted.
const COUNT = [2, 6, 5, 7, 3, 3, 6, 5, 5];
const SHAPES = ['box', 'round'];
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
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 50 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the floor. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});
const middleOf = ({ min, max }) => held([(min[0] + max[0]) / 2, (min[1] + max[1]) / 2]);
/** A line that the pad draws along a row or a column: the extent it lies across, and where. */
function lineOf(places) {
  const { min, max } = around(places);
  const across = min[0] === max[0] ? 0 : 1;
  return [across, min[across]];
}
/** On which side of such a line a piece lies, -1 or 1 - and 0 where the line runs through it. */
const sideOf = ({ min, max }, [across, where]) =>
  max[across] <= where ? -1 : min[across] >= where ? 1 : 0;
/** Whether a piece ends on such a line, and whether it covers a place of the floor. */
const endsOn = ({ min, max }, [across, where]) => [min[across], max[across]].includes(where);
const holds = ({ min, max }, place) =>
  [0, 1].every((way) => min[way] <= place[way] && place[way] <= max[way]);
/** How much of the floor a box covers, in square metres, and whether two cover some of it both. */
const floorOf = ({ min, max }) => (max[0] - min[0]) * (max[1] - min[1]);
const both = (one, other) =>
  [0, 1].every(
    (way) => Math.min(one.max[way], other.max[way]) > Math.max(one.min[way], other.min[way]),
  );
/** Whether some pieces lie round a hollow: none in it, and with it they cover all of a floor. */
const ringed = (rim, hollow, floor) =>
  !rim.some((piece) => both(piece, hollow)) &&
  held(rim.reduce((sum, piece) => sum + floorOf(piece), floorOf(hollow))) === held(floorOf(floor));

// WHERE THE PAD DRAWS IT. The pad's top view draws each kind into the box of its object: a shape
// for a hob's ring, for a toilet's bowl and for its cistern, for a tap, for the head of a
// shower. Of each kind the piece at a place in its list - the first is 0 - covers the floor that
// the shape at a place in the pad's drawing covers, at every quarter: `5:8` is the sixth piece
// on the ninth shape.
const LIES_ON = {
  island: '1:0', // its worktop
  counter: '1:0', // its worktop
  hob: '1:1 2:2 3:3 4:4', // its four rings
  sink: '5:8', // its tap
  toilet: '0:0 1:2', // its bowl, and its cistern
  basin: '0:0 1:0', // its unit, and the bottom of its bowl
  bath: '0:0', // its bottom
  shower: '0:0 4:4', // its tray, and its head
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
  // A sink's rim lies round the basin that the pad draws, on its bottom; and its spout reaches
  // out of the tap along the line that the pad draws of it, as far as that line. A bathtub's
  // walls stand round the hollow that the pad draws, on its bottom, and so does the rim of a
  // washbasin's bowl, on the unit.
  const [[under, ...sink], [, basin, , , , , , reach]] = seen('sink');
  const [spout, rim] = [sink.pop(), sink.slice(0, 4)];
  assert.ok(ringed(rim, around(basin), under), `a sink's rim, turned by ${turn}`);
  const [across, where] = lineOf(reach);
  const reaches = [...reach.map((end) => holds(spout, end)), middleOf(spout)[across]];
  assert.deepEqual(reaches, [true, true, where], `a sink's spout, turned by ${turn}`);
  assert.ok(endsOn(spout, [1 - across, reach[1][1 - across]]), `a spout, turned by ${turn}`);
  const [[foot, ...walls], [, tub]] = seen('bath');
  const [[, plate, ...edge], [, bowl]] = seen('basin');
  assert.ok(ringed(walls, around(tub), foot), `a bathtub's walls, turned by ${turn}`);
  assert.ok(ringed(edge, around(bowl), plate), `a washbasin's rim, turned by ${turn}`);
  // A fridge's two doors hang before the line that the pad draws across it, its body behind. A
  // shower's glass stands along the two sides of its tray away from the head that the pad draws,
  // and none along the two sides at it: of each side, what covers its middle. In the corner at
  // the head stands the pipe, under the middle of the head.
  const [[body, ...doors], [, , , front]] = seen('fridge');
  const before = lineOf(front);
  assert.ok(endsOn(doors[0], before) && endsOn(doors[1], before), `doors, turned by ${turn}`);
  assert.equal(sideOf(body, before) * sideOf(doors[0], before), -1, `a fridge, turned by ${turn}`);
  const [[tray, ...rest], [, , , , head]] = seen('shower');
  const [glass, [pipe], headAt] = [rest.slice(0, 2), rest.slice(2), middleOf(around(head))];
  assert.deepEqual(middleOf(pipe), headAt, `a shower's pipe, turned by ${turn}`);
  for (const way of [0, 1]) {
    const sides = headAt[way] - tray.min[way] < 0.5 ? ['min', 'max'] : ['max', 'min'];
    const onSide = (side) =>
      middleOf(tray).map((mid, one) => (one === way ? tray[side][way] : mid));
    const glazed = sides.map((side) => glass.some((pane) => holds(pane, onSide(side))));
    assert.deepEqual(glazed, [false, true], `a shower's glass, turned by ${turn}`);
  }
}

// A TOILET, by hand. Not turned, it stands between x = 2 and 2.5 and between y = 22.5 and 23, its
// far side at 23, on the slab at 105.375 m, and is 0.4 m high. Its cistern, 0.4 m wide and
// 0.135 m deep, stands at the far side. Before it stands the foot, 0.2 m wide and 0.18 m high,
// and on the foot the bowl: round, 0.38 m across, at the front, up to 0.36 m.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing });
assert.deepEqual(partsOf(21), [
  piece(21, 'round', 'ceramic', [2.06, 22.5, 105.555], [2.44, 22.88, 105.735]),
  piece(21, 'box', 'ceramic', [2.05, 22.865, 105.375], [2.45, 23, 105.775]),
  piece(21, 'box', 'ceramic', [2.15, 22.725, 105.375], [2.35, 22.865, 105.555]),
]);
// Turned by a quarter, between x = 7 and 7.5, its cistern stands at the downhill side, where the
// far side of what is not turned comes to lie, and its foot and its bowl uphill of it.
assert.deepEqual(partsOf(22), [
  piece(22, 'round', 'ceramic', [7, 22.56, 105.555], [7.38, 22.94, 105.735]),
  piece(22, 'box', 'ceramic', [7.365, 22.55, 105.375], [7.5, 22.95, 105.775]),
  piece(22, 'box', 'ceramic', [7.225, 22.65, 105.375], [7.365, 22.85, 105.555]),
]);
// ON A WORKTOP, by hand. A counter of 2.5 m by 0.5 m, 0.9 m high, between x = 2 and 4.5 and
// y = 42.5 and 43, has its back at its far side: a body of joinery 4 cm in at its front and 2 cm
// at its ends, before it the door of its first front, 2 cm, 1.5 cm in, 0.60625 m long, 0.1 m up.
// Its worktop ends at 106.275 m, on the slab at 105.375 m: there begin the hob's plate of 2 cm
// and the sink's bottom, lifted 0.9 m. A freezer's door ends 0.69 m up; 2 cm over, a fridge's.
const [[body, worktop, door], [plate], [sunk]] = ['counter', 'hob', 'sink'].map((kind) =>
  partsOf(placeOf(kind, 0)),
);
assert.deepEqual(body, piece(5, 'box', 'joinery', [2.02, 42.54, 105.375], [4.48, 43, 106.23]));
assert.deepEqual(door, piece(5, 'box', 'paint', [2.015, 42.52, 105.475], [2.62125, 42.54, 106.23]));
assert.deepEqual([worktop.max[2], plate.min[2], plate.max[2]], [106.275, 106.275, 106.295]);
assert.equal(sunk.min[2], 106.275);
const [, freezer, fridge] = partsOf(placeOf('fridge', 0));
assert.deepEqual([freezer.max[2], fridge.min[2]], [106.065, 106.085]);

// IN THE HOUSE. objects.js has every one of these rules. With every rule there is - the hall's
// floor, its walls and its roof too - each object is the same pieces, and what holds of every
// part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === fittings[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a fitting of a kitchen or a bathroom is the few pieces of its kind, within its box and on its slab, turned as the pad turns its drawing\n',
);
