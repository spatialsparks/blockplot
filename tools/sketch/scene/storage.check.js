// The check of storage: of each kind that storage.js has a rule for - a cupboard, a sideboard, a
// shelf - an object made up here at 0.5, 1.5 and 6 m and at each of its four turns, on the floor
// of a made-up hall and on the ground beside it: against what holds of every part, against the
// pad's own top view, which draws each of them, and against a cupboard of 1.5 m and a shelf of
// 2 m that a person worked out by hand. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { storage } from './storage.js';
import { SURFACES } from './surfaces.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the script that draws the furniture, storage among it.
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
// thick. Each kind stands in it at each length four times, turned by none to three quarters,
// each on a square of 7 m of its own - the first a metre clear of the hall's edges - and the
// same again on the ground, 32 m further down the plot. A row of squares is a kind at a length:
// the cupboards first, the shortest of each first.
const ORDER = Object.keys(storage);
const LENGTHS = [0.5, 1.5, 6];
const ROWS = ORDER.flatMap((kind) => LENGTHS.map((long) => [kind, long]));
const TURNS = [0, 1, 2, 3];
const HALL = { x: [2, 62], y: [2, 130], z: [24, 30], name: 'Hall' };
const span = (first, far) => [first, first + far];
function made(kind, long, turn, column, row, floor) {
  const [along, wide, high] = shapes.sizeOf({ kind, turn, long }).map((metres) => 2 * metres);
  const [x, y, z] = [span(column, along), span(row, wide), span(floor - high, high)];
  return { kind, turn, fill: '#efe6d8', floor, x, y, z };
}
const things = [
  { ...HALL, colour: { name: 'grey', hex: '#8795a1' } },
  ...[30, 30.5].flatMap((floor, outside) =>
    ROWS.flatMap(([kind, long], nth) =>
      TURNS.map((turn) =>
        made(kind, long, turn, 4 + 14 * turn + 64 * outside, 4 + 14 * nth, floor),
      ),
    ),
  ),
];
/** The place in `things` of a kind's object of a length at a turn: in the hall, or on the ground. */
const placeOf = (kind, long, turn, outside = 0) =>
  1 + 4 * (ROWS.length * outside + 3 * ORDER.indexOf(kind) + LENGTHS.indexOf(long)) + turn;
const [INSIDE, OBJECTS] = [36, 72].map((count) => Array.from({ length: count }, (_, at) => at + 1));
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);

// A figure that a person works out in tenths and one that is worked out in shares differ in
// their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects storage's.
const alone = { blocks: [], kinds: storage };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));
const sizeOf = ({ min, max }) => max.map((most, way) => most - min[way]);

// WITHIN ITS BOX, LIFTED. Of every kind at every length and turn, on the slab and on the ground:
// each piece lies within the box of its object - lifted by the slab in the hall, by nothing on
// the ground - and no two pieces of different surfaces lie in each other (holds.js). Told of no
// lift, the same question finds every object in the hall, and none on the ground.
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const unlifted = new Set(amiss(scene).map((words) => Number(found.exec(words)?.[1])));
assert.deepEqual([...unlifted], INSIDE);

// AS MANY PIECES AS ITS LENGTH SAYS. A cupboard and a sideboard are a body and a door each half
// metre: two, four and thirteen pieces at 0.5, 1.5 and 6 m. A shelf is two sides, an upright at
// each whole metre between them and five boards: seven, eight and twelve. Each piece is a box of
// a surface there is - of `joinery` or of `paint`, never `plain` nor a floor's `wood` - and none
// is as large as its object. Each kind stands on its foot: its lowest piece begins where its box
// does, lifted.
const COUNT = { cupboard: [2, 4, 13], sideboard: [2, 4, 13], shelf: [7, 8, 12] };
for (const at of OBJECTS) {
  const [solid, parts] = [held(scene.solids[at]), partsOf(at)];
  const { kind } = things[at];
  const long = LENGTHS[Math.floor((at - 1) / 4) % 3];
  assert.equal(parts.length, COUNT[kind][LENGTHS.indexOf(long)], `a ${kind} of ${long} m`);
  for (const part of parts) {
    assert.ok(part.of === 'piece' && part.shape === 'box', `${kind}: ${part.shape}`);
    assert.ok(['joinery', 'paint'].includes(part.surface) && Object.hasOwn(SURFACES, part.surface));
    const whole = sizeOf(part).every((far, way) => far > sizeOf(solid)[way] - 1e-9);
    assert.ok(!whole, `a ${kind} is a box of its size`);
  }
  assert.equal(Math.min(...parts.map((part) => part.min[2])), held(solid.min[2] + lift(at)), kind);
}

// TURNED. A quarter on, an object lies a quarter on about the middle of its box, clockwise seen
// from above: of every kind at every length, the pieces at a turn are the pieces of the one that
// is not turned, each a quarter on as often - for a length is worked out along the object,
// whichever way it lies. On the ground a kind is the same pieces, not lifted.
function about(at) {
  const { min, max } = scene.solids[at];
  const middle = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2] + lift(at)];
  return partsOf(at).map(({ shape, surface, ...box }) => {
    const [x, y, h] = middle.map((here, way) => held([box.min[way] - here, box.max[way] - here]));
    return { shape, surface, x, y, h };
  });
}
const quarterOn = ({ x, y, ...rest }) => ({ ...rest, x: y, y: held([-x[1], -x[0]]) });
for (const [kind, long] of ROWS) {
  let pieces = about(placeOf(kind, long, 0));
  for (const turn of TURNS) {
    assert.deepEqual(about(placeOf(kind, long, turn)), pieces, `${kind} turned by ${turn}`);
    assert.deepEqual(about(placeOf(kind, long, turn, 1)), pieces, `${kind} on the ground`);
    pieces = pieces.map(quarterOn);
  }
}

/** What the pad's top view draws of a thing: the places of each shape, in metres, as it draws them. */
function padDraws({ kind, turn, x, y }) {
  const drawn = [];
  const canvas = { beginPath: () => drawn.push([]), lineTo: (...at) => drawn.at(-1).push(at) };
  for (const other of ['closePath', 'fill', 'stroke', 'setLineDash']) canvas[other] = () => {};
  shapes.draw(canvas, { kind, turn }, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 66 - row / 2])));
}
/** A line that the pad draws along a row or a column: the extent it lies across, and where. */
function lineOf(places) {
  const across = places[0][0] === places[1][0] ? 0 : 1;
  return [across, places[0][across]];
}
/** On which side of such a line a piece lies, -1 or 1 - and 0 where the line runs through it. */
const sideOf = ({ min, max }, [across, where]) =>
  max[across] <= where ? -1 : min[across] >= where ? 1 : 0;
const endsOn = ({ min, max }, [across, where]) => [min[across], max[across]].includes(where);

// WHERE THE PAD DRAWS IT. From above, the pad draws a cupboard and a sideboard as their box and a
// line along the front, where their doors begin; a shelf as its box and the line where its
// boards end. At every length and every quarter: the body ends on the line and every door
// begins on it, on its other side; every piece of a shelf ends on its line, on the side of its
// back - the side the pad's box lies on beyond the line, its far side, as the body's.
for (const [kind, long] of ROWS) {
  for (const turn of TURNS) {
    const at = placeOf(kind, long, turn);
    const [[body, ...rest], [, front]] = [partsOf(at), padDraws(things[at])];
    const line = lineOf(front);
    const said = `a ${kind} of ${long} m turned by ${turn}`;
    assert.ok(endsOn(body, line) && sideOf(body, line) !== 0, said);
    const back = sideOf(body, line);
    const sides = rest.map((piece) => (endsOn(piece, line) ? sideOf(piece, line) : 0));
    assert.deepEqual(sides, Array(rest.length).fill(kind === 'shelf' ? back : -back), said);
  }
}

// A CUPBOARD OF 1.5 M, by hand. Not turned, in the hall, it lies between x = 2 and 3.5 and
// between y = 56.5 and 57, its back at 57, on the slab at 105.375 m, and is 2 m high. Its body
// is 0.425 m deep, all its height; before it three doors of 0.48 m, with 1.5 cm between two and
// at either end, each from a plinth of 8 cm to its top.
const PIECE = { of: 'piece', floor: 105 };
const piece = (thing, surface, min, max) => ({ ...PIECE, shape: 'box', min, max, surface, thing });
const door = (from) =>
  piece(5, 'paint', [from, 56.5, 105.455], [held(from + 0.48), 56.575, 107.375]);
assert.equal(placeOf('cupboard', 1.5, 0), 5);
assert.deepEqual(partsOf(5), [
  piece(5, 'joinery', [2, 56.575, 105.375], [3.5, 57, 107.375]),
  ...[door(2.015), door(2.51), door(3.005)],
]);

// A SHELF OF 2 M, by hand, in a hall of its own: not turned, between x = 2 and 4 and between
// y = 63.5 and 64, on the slab at 105.375 m, 2 m high. Against its back, 0.35 m deep: a side
// 2 cm thick at either end, an upright of 2 cm about its middle, a metre on, and five boards of
// 2 cm, 0.475 m apart - at its foot, at 0.495 m, 0.99 m, 1.485 m, and at its top.
const SHELF = made('shelf', 2, 0, 4, 4, 30);
const shelf = sceneOf(site, [things[0], SHELF], figures, alone);
const upright = (from, to) => piece(1, 'joinery', [from, 63.65, 105.375], [to, 64, 107.375]);
const board = (up) => piece(1, 'joinery', [2, 63.65, up], [4, 64, held(up + 0.02)]);
assert.deepEqual(partsOf(1, shelf), [
  ...[upright(2, 2.02), upright(3.98, 4), upright(2.99, 3.01)],
  ...[105.375, 105.87, 106.365, 106.86, 107.355].map(board),
]);
assert.deepEqual(
  amiss(shelf, (at) => (at === 1 ? 0.375 : 0)),
  [],
);

// CUT WHERE ITS ROOM ENDS (clear.js): a box of 1.3 m, as a cupboard of 3 m may be left in a room
// too small for it, is a body and a door each whole half metre of it - two - and a box shorter
// than half a metre one door still. The rule reads the box it is given, not the sketch's length.
const cut = (far) => ({
  things: [{ turn: 0 }],
  boxOf: () => ({ min: [0, 0, 0], max: [far, 0.5, 2] }),
});
assert.deepEqual(
  [1.3, 0.3].map((far) => storage.cupboard(cut(far), 0).length),
  [3, 2],
);

// IN THE HOUSE. objects.js has every one of these rules; with every rule there is - the hall's
// floor, its walls and its roof too - each object is the same pieces, and what holds of every
// part holds.
for (const kind of ORDER) assert.ok(KINDS[kind] === storage[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), things[at].kind);
assert.deepEqual(amiss(house, lift), []);

process.stdout.write(
  'tools/sketch/scene: a cupboard, a sideboard and a shelf are built by their length - a door each half metre, an upright each metre - within their box, turned as the pad turns its drawing\n',
);
