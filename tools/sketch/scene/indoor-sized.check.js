// The check of a home's objects by their size (T-037.3): a wardrobe, a fountain, an armchair, a
// towel rail, a sink, a washbasin, a fridge and a bathtub at sizes of their ranges, each at its
// four turns, in a made-up hall - against what holds of every part, the thickness in metres of
// each piece at its kind's own size, today's pieces at that size, the pad's own top view, and a
// wardrobe of 3 m and a sink of 2 m worked out by hand. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { fittings } from './fittings.js';
import { furniture, ruleOf } from './furniture.js';
import { amiss } from './holds.js';
import { lamps } from './lamps.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { seats } from './seats.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the scripts that draw these kinds.
for (const script of ['figures', 'shapes', 'garden', 'furniture', 'kitchen', 'bathroom']) {
  await import(`../${script}.js`);
}
const { shapes } = globalThis;

// A made-up plot of 32 m by 170 m, in cells of half a metre: a column is x = column / 2, a row
// y = 170 - row / 2, a level 120 - level / 2 metres above sea level. Its ground is flat.
const plot = { cellM: 0.5, xFromM: 0, xToM: 32, yFromM: 0, yToM: 170, sideM: [100, 120] };
const ground = { baseM: 100, rowsCm: Array(341).fill(Array(65).fill('475').join(' ')) };
const outline = [
  [1, 169],
  [31, 169],
  [1, 1],
];
const site = { ...plot, outline, ground };
const walls = { outerWallM: 0.375, innerWallM: 0.25, floorSlabM: 0.375, roofSlabM: 0.3125 };
const figures = { ...walls, railingHighM: 1, doorHighM: 2, windowHighM: 1.5, sillHighM: 1 };

// A hall 3 m high on level 30, at 105 m, its floor slab 0.375 m thick: each object is lifted by
// it. Each size stands in it four times, turned by none to three quarters, on squares of 7 m, a
// row a size in the order of `SIZES`; a sink where the pad lifts it to, 0.9 m over its floor.
const SIZES = [
  ...[0.5, 1.5, 3, 6].flatMap((long) => [1, 2.5].map((high) => ['wardrobe', long, 0.5, high])),
  ...['1 1', '2 2', '6 3'].map((pair) => ['fountain', ...pair.split(' ').map(Number), 1]),
  ...[1, 1.5].map((long) => ['armchair', long, long, 0.8]),
  ...[0.5, 1.5].map((long) => ['towelrail', long, 0.5, 1.2]),
  ...[0.5, 1, 2].map((long) => ['sink', long, 0.5, 0.3]),
  ...[0.5, 2].map((long) => ['basin', long, 0.5, 0.85]),
  ...[0.5, 1].map((long) => ['fridge', long, 0.5, 2]),
  ['bath', 2, 1.5, 0.6],
];
const RULES = { ...furniture, ...fittings, ...seats, ...lamps };
const EIGHT = ['wardrobe', 'fountain', 'armchair', 'towelrail', 'sink', 'basin', 'fridge', 'bath'];
const [TURNS, HALL] = [[0, 1, 2, 3], { x: [2, 62], y: [2, 338], z: [24, 30], name: 'Hall' }];
const span = (first, far) => [first, first + far];
function made([kind, long, deep, high], turn, nth) {
  const [own, column, row] = [{ long, deep, high }, 4 + 14 * turn, 4 + 14 * nth];
  const [along, wide, tall] = shapes.sizeOf({ kind, turn, ...own }).map((m) => 2 * m);
  const top = 30 - 2 * (shapes.KINDS[kind].lift ?? 0) - tall;
  const [x, y, z] = [span(column, along), span(row, wide), span(top, tall)];
  return { kind, turn, ...own, fill: '#eceff2', floor: 30, x, y, z };
}
const things = [
  { ...HALL, colour: { name: 'grey', hex: '#8795a1' } },
  ...SIZES.flatMap((size, nth) => TURNS.map((turn) => made(size, turn, nth))),
];
const OBJECTS = Array.from({ length: 4 * SIZES.length }, (_, at) => at + 1);
const sizeAt = (at) => SIZES[Math.floor((at - 1) / 4)];
const slab = () => 0.375;

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
const scene = sceneOf(site, things, figures, { blocks: [], kinds: RULES });
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));
/** The rule of a kind told a box of this size at nought, not turned. */
const built = (rule, max) =>
  held(rule({ things: [{ turn: 0 }], boxOf: () => ({ min: [0, 0, 0], max }) }, 0));
/** Each piece's extent in metres along its object, across it and up, as it lies unturned. */
const extentsOf = (parts, turn) =>
  parts.map(({ min, max }) => {
    const [x, y, up] = max.map((most, way) => held(most - min[way]));
    return turn % 2 === 0 ? [x, y, up] : [y, x, up];
  });

// WITHIN ITS BOX, LIFTED. At every size and turn each piece lies within the box of its object,
// lifted by the slab, and no two pieces of different surfaces lie in each other (holds.js).
assert.deepEqual(amiss(scene, slab), []);

// AS MANY PIECES AS ITS SIZE SAYS, AS THICK AS AT ITS OWN. A wardrobe is a body and a door each
// 0.75 m or so - 1, 2, 4, 8 at 0.5, 1.5, 3, 6 m - all as wide, 1.5 cm between two and at each end;
// the others as many pieces as at their own size. And by hand what of a piece is the same in
// metres at every size: its first piece, the piece after its last, which way - 0 along, 1 across,
// 2 up - and the metres; with a minus, that much short of its object: a wardrobe's plinth, 8 cm.
const DOORS = { 0.5: 1, 1.5: 2, 3: 4, 6: 8 };
const COUNT = { fountain: 4, armchair: 8, towelrail: 6, sink: 7, basin: 6, fridge: 3, bath: 5 };
const THIN = {
  wardrobe: '0 1 0 -0, 0 1 1 0.425, 0 1 2 -0, 1 9 1 0.075, 1 9 2 -0.08',
  fountain: '0 1 2 0.42, 1 2 2 0.03, 1 2 0 -0.24, 1 2 1 -0.24, 2 3 0 0.2, 2 3 1 0.2, 3 4 2 0.16',
  armchair: '0 1 0 -0.3, 0 1 1 -0.2, 1 2 1 0.2, 2 4 0 0.15, 4 8 0 0.05, 4 8 1 0.05, 4 8 2 0.1',
  towelrail: '0 2 0 0.03, 0 2 1 0.03, 2 5 0 -0.06, 2 5 1 0.02, 2 5 2 0.02, 5 6 0 0.35, 5 6 1 0.02',
  sink: '0 3 0 -0.04, 0 1 1 0.46, 1 2 1 0.09, 2 3 1 0.03, 3 4 0 0.04, 5 6 0 0.06, 6 7 0 0.04',
  basin: '0 4 0 -0, 2 3 1 0.11, 3 4 1 0.05, 4 6 0 0.05, 4 6 1 0.34',
  fridge: '0 3 0 -0, 0 1 1 0.45, 1 3 1 0.05',
  bath: '0 1 2 0.15, 1 3 0 0.06, 3 5 1 0.08',
};
const near = (one, other) => Math.abs(one - other) < 1e-8;
function holdsThin(kind, extents, size, said) {
  for (const row of THIN[kind].split(', ')) {
    const [first, after, way, metres] = row.split(' ').map(Number);
    const want = held(row.includes('-') ? size[way] + metres : metres);
    for (const piece of extents.slice(first, after)) assert.equal(piece[way], want, said);
  }
  const doors = extents.slice(1).map(([wide]) => wide);
  const count = kind === 'wardrobe' ? 1 + DOORS[size[0]] : COUNT[kind];
  assert.ok(kind !== 'wardrobe' || doors.every((wide) => near(wide, doors[0])), said);
  assert.ok(kind !== 'wardrobe' || near(doors.length * doors[0] + count * 0.015, size[0]), said);
  assert.equal(extents.length, count, said);
}
for (const kind of EIGHT) {
  const own = shapes.KINDS[kind].size;
  holdsThin(kind, extentsOf(built(RULES[kind], own), 0), own, kind);
}
for (const at of OBJECTS) {
  const [kind, long, deep, high] = sizeAt(at);
  const said = `a ${kind} of ${long} by ${deep} by ${high} m`;
  holdsThin(kind, extentsOf(partsOf(at), things[at].turn), [long, deep, high], said);
}

// Pieces said in rows, a few to a line: a shape - `b` a box, `r` a round - a surface, six figures.
const SHAPE = { b: 'box', r: 'round' };
const rowsOf = (lines) =>
  lines
    .flatMap((line) => line.split('; '))
    .map((row) => row.split(' '))
    .map(([shape, surface, ...figures]) => [SHAPE[shape], surface, figures.map(Number)]);

// TODAY'S PIECES. At its own size each kind is the pieces it was before it took a size, to the
// number and to the place: each in shares of its box along and across, and up in metres.
const legs = ['.05 .1 .05 .1', '.05 .1 .9 .95', '.9 .95 .05 .1', '.9 .95 .9 .95'];
const rails = [0.5, 0.8, 1.1].map((m) => `b metal .06 .94 .01 .05 ${m - 0.01} ${m + 0.01}`);
const TODAY = {
  wardrobe: ['b joinery 0 1 0 .85 0 2; b paint .01 .495 .85 1 .08 2; b paint .505 .99 .85 1 .08 2'],
  fountain: [
    'r stone 0 1 0 1 0 .42; r water .06 .94 .06 .94 .42 .45',
    'r stone .45 .55 .45 .55 .45 .72; r stone .25 .75 .25 .75 .72 .88',
  ],
  armchair: [
    'b fabric .15 .85 .2 1 .1 .42; b fabric 0 1 0 .2 .1 .8; b fabric 0 .15 .2 1 .1 .6',
    'b fabric .85 1 .2 1 .1 .6',
    ...legs.map((leg) => `r joinery ${leg} 0 .1`),
  ],
  towelrail: ['r metal 0 .06 0 .06 0 1.2; r metal .94 1 0 .06 0 1.2', ...rails],
  sink: [
    'b metal .02 .98 .04 .96 0 .006; b metal .02 .98 .04 .22 .006 .03',
    'b metal .02 .98 .9 .96 .006 .03; b metal .02 .06 .22 .9 .006 .03',
    'b metal .56 .98 .22 .9 .006 .03; r metal .28 .34 .05 .17 .03 .27',
    'b metal .29 .33 .05 .4 .27 .3',
  ],
  basin: [
    'b joinery 0 1 0 1 0 .697; b ceramic 0 1 0 1 .697 .7395; b ceramic 0 1 0 .22 .7395 .85',
    'b ceramic 0 1 .9 1 .7395 .85; b ceramic 0 .1 .22 .9 .7395 .85',
    'b ceramic .9 1 .22 .9 .7395 .85',
  ],
};
TODAY.towelrail.push('b fabric .15 .85 .05 .09 .45 .81');
for (const [kind, lines] of Object.entries(TODAY)) {
  const own = shapes.KINDS[kind].size;
  const today = rowsOf(lines).map(([shape, surface, [a, b, c, d, e, f]]) => {
    return { shape, surface, along: [a, b], across: [c, d], up: [e / own[2], f / own[2]] };
  });
  assert.deepEqual(built(RULES[kind], own), built(ruleOf(today), own), `a ${kind} as it was`);
}
/** What the pad's top view draws of a thing: the places of each shape, in metres, as it draws them. */
function padDraws(thing) {
  const drawn = [];
  const canvas = {
    beginPath: () => drawn.push([]),
    lineTo: (...at) => drawn.at(-1).push(at),
    ellipse: (column, row, wide, tall) =>
      drawn.at(-1).push([column - wide, row - tall], [column + wide, row + tall]),
  };
  for (const other of ['closePath', 'fill', 'stroke', 'setLineDash']) canvas[other] = () => {};
  const [x, y] = [thing.x, thing.y];
  shapes.draw(canvas, thing, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 170 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the floor. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});
const flat = ({ min, max }) => ({ min: min.slice(0, 2), max: max.slice(0, 2) });
const area = ({ min, max }) => (max[0] - min[0]) * (max[1] - min[1]);
const apart = (one, two) =>
  [0, 1].some((w) => Math.min(one.max[w], two.max[w]) <= Math.max(one.min[w], two.min[w]));
/** Whether some pieces lie round a hollow: none in it, and with it they cover all of a floor. */
const ringed = (rim, hollow, floor) =>
  rim.every((piece) => apart(piece, hollow)) &&
  held(rim.reduce((sum, piece) => sum + area(piece), area(hollow))) === held(area(floor));
/** A line that the pad draws along a row or a column: which way it lies across, and where. */
const lineOf = (places) => {
  const { min, max } = around(places);
  return min[0] === max[0] ? [0, min[0]] : [1, min[1]];
};
/** On which side of such a line a piece lies, -1 or 1 - and 0 where the line runs through it. */
const sideOf = ({ min, max }, [across, where]) =>
  max[across] <= where ? -1 : min[across] >= where ? 1 : 0;
const parted = (line, one, other) => sideOf(one, line) * sideOf(other, line) === -1;
const endsOn = ({ min, max }, [across, where]) => [min[across], max[across]].includes(where);
/** Whether the doors after a body end on a line that the pad draws, and the body lies behind it. */
const before = ([body, ...doors], line) =>
  doors.every((door) => endsOn(door, line)) && parted(line, body, doors[0]);

// WHERE THE PAD DRAWS IT, at every size and quarter. A piece at a place in its list covers the
// floor of the shape at a place in the pad's drawing: a fountain's basin and bowl, an armchair's
// back and arms, a towel rail's posts, rails and towel, a sink's tap. Rims stand round the hollow
// drawn, on their bottom; a sink's grooves lie on its drainer, as many as its length says. Doors
// end on the line drawn across them, the body behind; a joint drawn between two of a wardrobe's
// lies in the middle of the gap between them, one door either side.
const LIES_ON = { fountain: '0:0 3:1', armchair: '1:1 2:2 3:3', basin: '0:0 1:0', bath: '0:0' };
LIES_ON.towelrail = '0:0 1:1 2:2 3:2 4:2 5:3';
const GROOVES = { 0.5: 0, 1: 4, 2: 16 };
const HOLLOW = { sink: [1, 5], basin: [2, 6], bath: [1, 5] };
function doorsLie(pieces, drawn, said) {
  const [front, ...joints] = drawn.slice(3).map(lineOf);
  assert.ok(before(pieces, front) && joints.length === pieces.length - 2, said);
  joints.forEach(([across, where], nth) => {
    const pair = [pieces[nth + 1], pieces[nth + 2]].sort((a, b) => a.min[across] - b.min[across]);
    assert.ok(parted([across, where], ...pair), `${said}: joint ${nth}`);
    assert.equal(held((pair[0].max[across] + pair[1].min[across]) / 2), where, said);
  });
}
for (const at of OBJECTS) {
  const [kind, long, deep] = sizeAt(at);
  const [pieces, drawn] = [partsOf(at), padDraws(things[at])];
  const said = `a ${kind} of ${long} by ${deep} m turned by ${things[at].turn}`;
  for (const pair of (LIES_ON[kind] ?? '').split(' ').filter(Boolean)) {
    const [piece, shape] = pair.split(':');
    assert.deepEqual(flat(pieces[piece]), around(drawn[shape]), `piece ${piece} of ${said}`);
  }
  const [first, end] = HOLLOW[kind] ?? [1, 1];
  const hollow = [pieces.slice(first, end), around(drawn[1]), pieces[first - 1]];
  assert.ok(!HOLLOW[kind] || ringed(...hollow), `the hollow of ${said}`);
  if (kind === 'wardrobe') doorsLie(pieces, drawn, said);
  if (kind === 'fridge') assert.ok(before(pieces, lineOf(drawn[3])), said);
  if (kind !== 'sink') continue;
  const [grooves, drainer] = [drawn.slice(3, -2).flat(), pieces[4]];
  assert.deepEqual(flat(pieces[5]), around(drawn.at(-1)), `the tap of ${said}`);
  assert.equal(grooves.length, 2 * GROOVES[long], said);
  const on = (place) => place.every((m, w) => drainer.min[w] <= m && m <= drainer.max[w]);
  assert.ok(grooves.every(on), `the grooves of ${said}`);
}

// CUT BY ITS ROOM (clear.js): a wardrobe left 0.4 m long keeps its body and a door in its box.
const [cut, box] = [built(RULES.wardrobe, [0.4, 0.5, 2]), [0.4, 0.5, 2]];
const within = ({ min, max }) => min.every((m, w) => m >= 0 && m < max[w] && max[w] <= box[w]);
assert.ok(cut.length === 2 && cut.every(within), 'a wardrobe cut short');

// BY HAND, from nought, not turned: x along it, y across - its far side at y = 0.5 - and z up.
// A WARDROBE OF 3 M, 0.5 m deep and 2.5 m high: its body of joinery its whole length and height,
// from y = 0.075 to 0.5; before it four doors of paint from y = 0 to 0.075 and from 0.08 m up to
// 2.5 m, each (3 - 5 x 0.015) / 4 = 0.73125 m wide: the first from 0.015, each next 1.5 cm on,
// the last up to 2.985. A SINK OF 2 M, 0.5 m deep and 0.3 m high, all of metal: its bottom, 6 mm,
// and its rims, from 6 mm up to 3 cm, run from x = 0.02 to 1.98 - the bottom from y = 0.02 to
// 0.48, the rim behind from 0.39 to 0.48, the rim before from 0.02 to 0.05. Between those two its
// uphill rim, from x = 0.02 to 0.06, and its drainer, from 0.56 to 1.98; its hollow from 0.06 to
// 0.56, and over its middle, x = 0.31, its tap, 6 cm, up to 0.27 m, and its spout, 4 cm.
const doors = [0.015, 0.76125, 1.5075, 2.25375].map((from) => [from, from + 0.73125]);
const BY_HAND = {
  wardrobe: [
    [3, 0.5, 2.5],
    'b joinery 0 .075 0 3 .5 2.5',
    ...doors.map(([from, to]) => `b paint ${from} 0 .08 ${to} .075 2.5`),
  ],
  sink: [
    [2, 0.5, 0.3],
    'b metal .02 .02 0 1.98 .48 .006; b metal .02 .39 .006 1.98 .48 .03',
    'b metal .02 .02 .006 1.98 .05 .03; b metal .02 .05 .006 .06 .39 .03',
    'b metal .56 .05 .006 1.98 .39 .03; r metal .28 .415 .03 .34 .475 .27',
    'b metal .29 .3 .27 .33 .475 .3',
  ],
};
for (const [kind, [size, ...lines]] of Object.entries(BY_HAND)) {
  const pieces = rowsOf(lines).map(([shape, surface, figures]) => {
    return { of: 'piece', shape, min: figures.slice(0, 3), max: figures.slice(3), surface };
  });
  assert.deepEqual(built(RULES[kind], size), held(pieces), `a ${kind} of ${size[0]} m`);
}

// IN THE HOUSE. objects.js has these rules; with every rule there is - the hall's floor, its
// walls and its roof too - each object is the same pieces, and what holds of every part holds.
for (const kind of EIGHT) assert.ok(KINDS[kind] === RULES[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), `object ${at}`);
assert.deepEqual(amiss(house, slab), []);
process.stdout.write(
  "tools/sketch/scene: a wardrobe, a fountain, an armchair, a towel rail, a sink and a washbasin are built for their size - a wardrobe a door about each 0.75 m, every piece as thick as at its own size and today's pieces there - within its box, turned as the pad turns its drawing\n",
);
