// The check of a kitchen's and a bathroom's fittings by their size (T-035.5): a counter, an
// island, a bathtub and a shower made up here at sizes of their ranges and at each of their four
// turns, on the floor of a made-up hall and on the ground beside it - against what holds of every
// part, against the thickness in metres of each piece at its kind's own size, against the pad's
// own top view, and against a counter of 3.5 m and a shower of 2 m by 1 m that a person worked
// out by hand. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { fittings } from './fittings.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the scripts that draw a kitchen and a bathroom.
for (const script of ['figures', 'shapes', 'kitchen', 'bathroom']) await import(`../${script}.js`);
const { shapes } = globalThis;

// A made-up plot of 64 m by 104 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 104 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m: in row 30.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 64,
  yFromM: 0,
  yToM: 104,
  sideM: [100, 120],
  outline: [
    [1, 103],
    [63, 103],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(209).fill(Array(129).fill('475').join(' ')) },
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

// A hall of 30 m by 100 m, a storey of 3 m high, on level 30 at 105 m: its floor slab is 0.375 m
// thick. Each size stands in it four times, turned by none to three quarters, each on a square
// of 7 m of its own - the first a metre clear of the hall's edges - and the same again on the
// ground, 32 m further down the plot. A row of squares is a size, in the order of `SIZES`.
const SIZES = [
  ...[0.5, 2.5, 3.5, 6].flatMap((long) => [0.85, 1.1].map((high) => ['counter', long, 0.5, high])),
  ['island', 1, 1, 1.1],
  ['island', 5, 1.5, 1.1],
  ['bath', 1.5, 1, 0.6],
  ...['2 1', '1 2', '2 2'].map((pair) => ['shower', ...pair.split(' ').map(Number), 2]),
];
// The four kinds, whose own sizes are the pad's (`KINDS` of shapes.js).
const FOUR = ['counter', 'island', 'bath', 'shower'];
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 62], y: [2, 202], z: [24, 30], name: 'Hall' };
const span = (first, far) => [first, first + far];
function made([kind, long, deep, high], turn, column, row, floor) {
  const own = { long, deep, high };
  const [along, wide, tall] = shapes.sizeOf({ kind, turn, ...own }).map((m) => 2 * m);
  const [x, y, z] = [span(column, along), span(row, wide), span(floor - tall, tall)];
  return { kind, turn, ...own, fill: '#eceff2', floor, x, y, z };
}
const things = [
  { ...HALL, colour: { name: 'grey', hex: '#8795a1' } },
  ...[30, 30.5].flatMap((floor, outside) =>
    SIZES.flatMap((size, nth) =>
      TURNS.map((turn) => made(size, turn, 4 + 14 * turn + 64 * outside, 4 + 14 * nth, floor)),
    ),
  ),
];
/** The place in `things` of the size at `nth` in `SIZES` at a turn: in the hall, or outside. */
const placeOf = (nth, turn, outside = 0) => 1 + 4 * (SIZES.length * outside + nth) + turn;
const [INSIDE, OBJECTS] = [4, 8].map((n) =>
  Array.from({ length: n * SIZES.length }, (_, at) => at + 1),
);
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);
const sizeAt = (at) => SIZES[Math.floor((at - 1) / 4) % SIZES.length];

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
const alone = { blocks: [], kinds: fittings };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));

// WITHIN ITS BOX, LIFTED. At every size and turn, on the slab and on the ground: each piece lies
// within the box of its object, and no two pieces of different surfaces lie in each other
// (holds.js). Told of no lift, the same question finds every object in the hall, and none outside.
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// AS MANY PIECES AS ITS SIZE SAYS. A counter is a body, a worktop and a front about each 0.6 m:
// 1, 4, 6 and 10 fronts at 0.5, 2.5, 3.5 and 6 m, all as wide, 1.5 cm between two and at each
// end. An island is two pieces at every size, a bathtub five and a shower five.
const FRONTS = { 0.5: 1, 2.5: 4, 3.5: 6, 6: 10 };
/** Each piece's extent in metres along its object, across it and up, as it lies unturned. */
const extentsOf = (parts, turn) =>
  parts.map(({ min, max }) => {
    const [x, y, up] = max.map((most, way) => held(most - min[way]));
    return turn % 2 === 0 ? [x, y, up] : [y, x, up];
  });
for (const at of OBJECTS) {
  const [[kind, long], parts] = [sizeAt(at), partsOf(at)];
  const said = `a ${kind} of ${long} m`;
  const count = kind === 'counter' ? 2 + FRONTS[long] : kind === 'island' ? 2 : 5;
  assert.equal(parts.length, count, said);
  if (kind !== 'counter') continue;
  // Each is worked out from where it begins and ends, so two differ in their last held place.
  const wide = extentsOf(parts.slice(2), things[at].turn).map(([along]) => along);
  const near = (one, other) => Math.abs(one - other) < 1e-8;
  assert.ok(
    wide.every((one) => near(one, wide[0])),
    said,
  );
  assert.ok(near(FRONTS[long] * wide[0] + (FRONTS[long] + 1) * 0.015, long), said);
}

// AS THICK AS AT ITS OWN SIZE. Of each kind, by hand, what of a piece is the same in metres at any
// size, each in four figures: its first piece, the piece after its last, which way - 0 along,
// 1 across, 2 up - and the metres. A counter's body is 0.46 m deep, its worktop 4.5 cm thick,
// each front 2 cm; an island's worktop 4.5 cm; a bathtub's bottom 0.15 m, its walls 6 cm at its
// ends and 8 cm at its sides; a shower's tray 6 cm, its glass 2 cm, its pipe 4 cm across and its
// head 16 cm across and 6 cm high. And by how much a worktop reaches over its body: 4 cm along a
// counter, 5 cm along an island and 4 cm across it. Each is so at every size, and so in the
// kind's own pieces at its own size.
const THIN = {
  counter: '0 1 1 0.46, 1 2 2 0.045, 2 12 1 0.02',
  island: '1 2 2 0.045',
  bath: '0 1 2 0.15, 1 3 0 0.06, 3 5 1 0.08',
  shower:
    '0 1 2 0.06, 1 2 0 0.02, 2 3 1 0.02, 3 4 0 0.04, 3 4 1 0.04, 4 5 0 0.16, 4 5 1 0.16, 4 5 2 0.06',
};
const OVER = { counter: [0.04], island: [0.05, 0.04] };
/** The rule of a kind told a box of this size at nought, not turned. */
const built = (kind, max) =>
  fittings[kind]({ things: [{ turn: 0 }], boxOf: () => ({ min: [0, 0, 0], max }) }, 0);
function holdsThin(kind, extents, said) {
  for (const row of THIN[kind].split(', ')) {
    const [first, after, way, metres] = row.split(' ').map(Number);
    for (const piece of extents.slice(first, after)) assert.equal(piece[way], metres, said);
  }
  (OVER[kind] ?? []).forEach((metres, way) => {
    assert.equal(held(extents[1][way] - extents[0][way]), metres, `${said}: over its body`);
  });
}
for (const kind of FOUR) holdsThin(kind, extentsOf(built(kind, shapes.KINDS[kind].size), 0), kind);
for (const at of OBJECTS) {
  const [kind, long, deep] = sizeAt(at);
  holdsThin(kind, extentsOf(partsOf(at), things[at].turn), `a ${kind} of ${long} by ${deep} m`);
}

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
SIZES.forEach((size, nth) => {
  let pieces = about(placeOf(nth, 0));
  for (const turn of TURNS) {
    assert.deepEqual(about(placeOf(nth, turn)), pieces, `${size} turned by ${turn}`);
    assert.deepEqual(about(placeOf(nth, turn, 1)), pieces, `${size} on the ground`);
    pieces = pieces.map(quarterOn);
  }
});

/** What the pad's top view draws of a thing: the places of each shape, in metres, as it draws them. */
function padDraws({ kind, turn, long, deep, high, x, y }) {
  const drawn = [];
  const canvas = {
    beginPath: () => drawn.push([]),
    lineTo: (...at) => drawn.at(-1).push(at),
    ellipse: (column, row, wide, tall) =>
      drawn.at(-1).push([column - wide, row - tall], [column + wide, row + tall]),
  };
  for (const other of ['closePath', 'fill', 'stroke', 'setLineDash']) canvas[other] = () => {};
  const thing = { kind, turn, long, deep, high };
  shapes.draw(canvas, thing, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 104 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the floor. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});
const floorOf = ({ min, max }) => (max[0] - min[0]) * (max[1] - min[1]);
const both = (one, other) =>
  [0, 1].every(
    (way) => Math.min(one.max[way], other.max[way]) > Math.max(one.min[way], other.min[way]),
  );
/** Whether some pieces lie round a hollow: none in it, and with it they cover all of a floor. */
const ringed = (rim, hollow, floor) =>
  !rim.some((piece) => both(piece, hollow)) &&
  held(rim.reduce((sum, piece) => sum + floorOf(piece), floorOf(hollow))) === held(floorOf(floor));

// WHERE THE PAD DRAWS IT, at every size and quarter. Of each kind the piece at a place in its list
// covers the floor that the shape at a place in the pad's drawing covers: a counter's and an
// island's worktop its box, a bathtub's bottom its box, a shower's tray its box and its head the
// head the pad draws. A bathtub's walls stand round the hollow that the pad draws, on its bottom.
const LIES_ON = { counter: '1:0', island: '1:0', bath: '0:0', shower: '0:0 4:4' };
for (const at of INSIDE) {
  const [kind, long, deep] = sizeAt(at);
  const [pieces, drawn] = [partsOf(at), padDraws(things[at])];
  const said = `a ${kind} of ${long} by ${deep} m turned by ${things[at].turn}`;
  const floor = (piece) => ({ min: piece.min.slice(0, 2), max: piece.max.slice(0, 2) });
  for (const [piece, shape] of LIES_ON[kind].split(' ').map((pair) => pair.split(':'))) {
    assert.deepEqual(floor(pieces[piece]), around(drawn[shape]), `piece ${piece} of ${said}`);
  }
  if (kind === 'bath') assert.ok(ringed(pieces.slice(1), around(drawn[1]), pieces[0]), said);
}

// A COUNTER OF 3.5 M, 0.85 m high, by hand. Not turned, in the hall, it lies between x = 2 and
// 5.5 and between y = 73.5 and 74, its back at 74, on the slab at 105.375 m. Its body of joinery,
// 2 cm in at each end, reaches 0.46 m from its back, up to its worktop at 106.18 m; the worktop,
// of stone, is its whole length and depth, 4.5 cm thick. Before the body, from y = 73.54 to 73.52,
// stand six fronts from 105.475 m up to the worktop, each (3.5 - 7 x 0.015) / 6 = 0.5658333 m
// wide: the first from x = 2.015, the next 1.5 cm on, the last up to 5.485.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, shape, surface, min, max) => ({ ...PIECE, shape, min, max, surface, thing });
assert.equal(placeOf(4, 0), 17);
const front = ([from, to]) =>
  piece(17, 'box', 'paint', [from, 73.52, 105.475], [to, 73.54, 106.18]);
assert.deepEqual(partsOf(17), [
  piece(17, 'box', 'joinery', [2.02, 73.54, 105.375], [5.48, 74, 106.18]),
  piece(17, 'box', 'stone', [2, 73.5, 106.18], [5.5, 74, 106.225]),
  ...[
    [2.015, 2.580833333],
    [2.595833333, 3.161666667],
    [3.176666667, 3.7425],
    [3.7575, 4.323333333],
    [4.338333333, 4.904166667],
    [4.919166667, 5.485],
  ].map(front),
]);

// A SHOWER OF 2 M BY 1 M, by hand. Not turned, in the hall, it lies between x = 2 and 4 and
// between y = 24 and 25, its back at 25, on the slab at 105.375 m, and is 2 m high. Its tray, 6 cm,
// is its whole size. Glass of 2 cm stands at its downhill end, its whole depth, and along its
// front up to that pane. In the corner at its back and uphill, its pipe of 4 cm stands from
// 0.13 m to 0.17 m out each way, up to 1.84 m, and bears its head, 16 cm across, up to 1.9 m.
assert.equal(placeOf(11, 0), 45);
assert.deepEqual(partsOf(45), [
  piece(45, 'box', 'ceramic', [2, 24, 105.375], [4, 25, 105.435]),
  piece(45, 'box', 'glass', [3.98, 24, 105.435], [4, 25, 107.375]),
  piece(45, 'box', 'glass', [2, 24, 105.435], [3.98, 24.02, 107.375]),
  piece(45, 'round', 'metal', [2.13, 24.83, 105.435], [2.17, 24.87, 107.215]),
  piece(45, 'round', 'metal', [2.07, 24.77, 107.215], [2.23, 24.93, 107.275]),
]);

// CUT BY ITS ROOM (clear.js): a counter left 0.25 m long and 0.3 m deep - shallower than the
// 0.48 m its fronts reach in metres - keeps its body, its worktop and one front within its box.
const cut = built('counter', [0.25, 0.3, 0.9]);
assert.equal(cut.length, 3);
for (const { min, max } of cut) {
  const within = [0, 1, 2].every((way) => min[way] >= 0 && min[way] < max[way]);
  assert.ok(within && max[0] <= 0.25 && max[1] <= 0.3 && max[2] <= 0.9, 'a counter cut short');
}

// IN THE HOUSE. objects.js has these rules; with every rule there is - the hall's floor, its
// walls and its roof too - each object is the same pieces, and what holds of every part holds.
for (const kind of FOUR) assert.ok(KINDS[kind] === fittings[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), `object ${at}`);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a counter, an island, a bathtub and a shower are built for their size - a counter a front about each 0.6 m, every piece as thick as at its own size - within its box, turned as the pad turns its drawing\n',
);
