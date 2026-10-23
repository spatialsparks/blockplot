// The check of the wide staircase (story ST-026): flights of the kind `widestairs`, a metre and a
// half wide, made up here in a made-up hall at each of the four turns, against steps a person
// worked out by hand - sixteen of them, each as wide as its flight, the first and the last - and
// against the pad's own top view, which draws an arrow up each; the staircase of a metre in the
// place of each, with the same steps but for their width; the floor above, open over the 27
// cells of each and whole beside them; a wide flight in a stair room as wide as itself, fitted
// between the walls as clear.js fits a flight; one that runs on over a storage, whole and open
// underneath there; and nothing amiss in any of it. Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { FLIGHTS, runOf } from './flights.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { steps } from './steps.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it.
for (const script of ['figures', 'shapes', 'stairs']) await import(`../${script}.js`);
const { shapes } = globalThis;

// A made-up plot of 20 m by 12 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 12 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m, under every floor here, and its outline a triangle, a metre in.
const paper = { cellM: 0.5, xFromM: 0, xToM: 20, yFromM: 0, yToM: 12, sideM: [100, 120] };
const outline = [1, 19, 1].map((x, corner) => [x, corner < 2 ? 11 : 1]);
const ground = { baseM: 100, rowsCm: Array(25).fill(Array(41).fill('475').join(' ')) };
const site = { ...paper, outline, ground };
// Made-up figures, each a sum of halves of halves, so that every place below is exact: an outer
// wall of 0.375 m, a floor of 0.375 m and a roof of 0.3125 m.
const slabbed = { outerWallM: 0.375, innerWallM: 0.25, floorSlabM: 0.375, roofSlabM: 0.3125 };
const figures = { ...slabbed, railingHighM: 1, doorHighM: 2, windowHighM: 1.5, sillHighM: 1 };
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, name) => ({ x, y, z, colour: grey, name });

// THE KIND. The pad has it in its list, 4.5 m long, 1.5 m wide and 3 m high: nine cells by three
// on the floor, and six rows up. In the scene it is a straight flight, and so has the one rule
// of a flight - and no plain box of its size, as a kind without a rule has.
assert.deepEqual(shapes.KINDS.widestairs.size, [4.5, 1.5, 3]);
assert.deepEqual(FLIGHTS, ['stairs', 'widestairs']);
assert.ok(KINDS.widestairs === steps.widestairs && steps.widestairs === steps.stairs);

/** A flight as large as the pad says its kind is, turned, its box begun at a column and a row. */
function flight(turn, column, row, kind = 'widestairs') {
  const [long, across, high] = shapes.sizeOf({ kind, turn }).map((metres) => 2 * metres);
  const span = (first, far) => [first, first + far];
  const [x, y, z] = [span(column, long), span(row, across), span(30 - high, high)];
  return { kind, turn, fill: shapes.KINDS[kind].fill, floor: 30, x, y, z };
}

// A hall of 11 m by 9 m, a storey of 3 m high, on level 30 at 105 m, and a second storey on it,
// at 108 m: the floor slab of each is 0.375 m thick. Four wide flights stand on the hall's floor,
// 2 to 5, one at each turn, each a metre or more clear of the hall's edges and of the others.
// The first lies on columns 4 to 13 and rows 4 to 7, the second on columns 19 to 22 and rows 4
// to 13: nine cells by three, and three by nine.
const things = [
  box([2, 24], [2, 20], [24, 30], 'Hall'),
  box([2, 24], [2, 20], [18, 24], 'Upper hall'),
  flight(0, 4, 4),
  flight(1, 19, 4),
  flight(2, 4, 15),
  flight(3, 14, 8),
];
const WIDE = [2, 3, 4, 5];
assert.deepEqual([...things[2].x, ...things[2].y, ...things[2].z], [4, 13, 4, 7, 24, 30]);
assert.deepEqual([...things[3].x, ...things[3].y, ...things[3].z], [19, 22, 4, 13, 24, 30]);
// The rules of the staircases alone: no rule of blocks.
const alone = { blocks: [], kinds: steps };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => all.parts.filter((part) => part.thing === at);
const STEP = { of: 'step', shape: 'box', surface: 'concrete', floor: 105 };
const step = (thing, min, max) => ({ ...STEP, min, max, thing });
// The extent a flight runs along, and the one across it: x and y, and the other way round where
// it is turned by one quarter or by three.
const lying = (at) => [things[at].turn % 2, 1 - (things[at].turn % 2)];
// What is amiss of a scene, with every object of it moved and lifted as a person worked out.
const wrong = (all, moved) => amiss(all, () => moved);

// SIXTEEN STEPS of 0.1875 m, as a storey of 3 m holds at a rise of 0.19 m at the most
// (steps.js). Each stands on the foot of its flight - 105.375 m, on the hall's slab - and is a
// rise higher than the step before: the last is as high as the flight. Along the flight each is
// a tread of 4.5 m / 16 = 0.28125 m deep, and they touch: side by side they reach from one end
// of the box to the other. And across it each is as wide as the box, a metre and a half.
for (const at of WIDE) {
  const [run, across] = lying(at);
  const { min, max } = scene.solids[at];
  const all = partsOf(at);
  const along = [...all].sort((a, b) => a.min[run] - b.min[run]);
  assert.deepEqual([all.length, max[run] - min[run], max[across] - min[across]], [16, 4.5, 1.5]);
  all.forEach((part, before) => {
    assert.deepEqual([part.of, part.shape, part.surface], ['step', 'box', 'concrete']);
    assert.deepEqual([part.min[2], part.max[2]], [105.375, 105.375 + (before + 1) * 0.1875]);
    assert.deepEqual([part.min[across], part.max[across]], [min[across], max[across]]);
    assert.equal(part.max[across] - part.min[across], 1.5, `a step of flight ${at} is as wide`);
  });
  along.forEach((part, place) => {
    assert.equal(part.min[run], place > 0 ? along[place - 1].max[run] : min[run], `flight ${at}`);
    assert.equal(part.max[run] - part.min[run], 0.28125, `a tread of flight ${at}`);
  });
  assert.deepEqual([along[15].max[run], all[15].max[2]], [max[run], 108.375]);
}

// THE FIRST AND THE LAST, by hand. Not turned, the flight lies from x = 2 to 6.5 and from y = 8.5
// to 10, and climbs down the plot. Turned by a quarter, from x = 9.5 to 11 and from y = 5.5 to
// 10, it climbs towards the smaller y.
assert.deepEqual(partsOf(2)[0], step(2, [2, 8.5, 105.375], [2.28125, 10, 105.5625]));
assert.deepEqual(partsOf(2)[15], step(2, [6.21875, 8.5, 105.375], [6.5, 10, 108.375]));
assert.deepEqual(partsOf(3)[0], step(3, [9.5, 9.71875, 105.375], [11, 10, 105.5625]));
assert.deepEqual(partsOf(3)[15], step(3, [9.5, 5.5, 105.375], [11, 5.78125, 108.375]));
// Turned by two quarters, from x = 2 to 6.5 and from y = 3 to 4.5, it climbs up the plot: its
// lowest step lies at the downhill end. By three, from x = 7 to 8.5 and from y = 3.5 to 8,
// towards the larger y: its lowest step lies at the smallest y.
assert.deepEqual(partsOf(4)[0], step(4, [6.21875, 3, 105.375], [6.5, 4.5, 105.5625]));
assert.deepEqual(partsOf(4)[15], step(4, [2, 3, 105.375], [2.28125, 4.5, 108.375]));
assert.deepEqual(partsOf(5)[0], step(5, [7, 3.5, 105.375], [8.5, 3.78125, 105.5625]));
assert.deepEqual(partsOf(5)[15], step(5, [7, 7.71875, 105.375], [8.5, 8, 108.375]));

/** What the pad's top view draws of a thing, into its cells: each line as its places, in metres. */
function padDraws({ kind, turn, x, y }) {
  const lines = [];
  const canvas = {
    beginPath: () => lines.push([]),
    lineTo: (column, row) => lines.at(-1).push([column / 2, 12 - row / 2]),
  };
  for (const other of ['ellipse', 'closePath', 'fill', 'stroke', 'setLineDash']) {
    canvas[other] = () => {};
  }
  shapes.draw(canvas, { kind, turn }, 'top', [x[0], y[0], x[1], y[1]], '#000', 0.1);
  return lines;
}
const middleOf = ({ min, max }) => [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2];
const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];

// WHICH WAY. The pad draws an arrow up a wide flight as it does up a staircase: a line along it,
// through the middle of its width, and a head of three places, whose middle one is the tip the
// line ends in. By hand, the arrow points down the plot while the flight is not turned, and a
// quarter on with every quarter, clockwise seen from above: towards the smaller y, up the plot,
// towards the larger y. At all four turns the lowest step lies at the end where the arrow
// begins, the highest at the other, and each step a tread further the way the arrow points.
const WAYS = { 2: [1, 0], 3: [0, -1], 4: [-1, 0], 5: [0, 1] };
for (const at of WIDE) {
  const [run, across] = lying(at);
  const lines = padDraws(things[at]);
  const heads = lines.filter((line) => line.length === 3);
  assert.equal(heads.length, 1, `the head of the arrow up flight ${at}`);
  const tip = heads[0][1];
  const [begins] = lines.find((line) => line.length === 2 && String(line[1]) === String(tip));
  const way = minus(tip, begins).map((far) => Math.sign(Math.round(far * 1e9)) + 0);
  assert.deepEqual(way, WAYS[at], `the pad's arrow up flight ${at}`);
  const middles = partsOf(at).map(middleOf);
  const far = (nth) => Math.hypot(...minus(middles[nth], begins));
  assert.ok(far(0) < 1 && far(15) > 3.5, `flight ${at} begins where the arrow does`);
  assert.ok(Math.abs(begins[across] - middles[0][across]) < 1e-9, `the arrow of flight ${at}`);
  middles.slice(1).forEach((middle, before) => {
    const further = minus(middle, middles[before]);
    assert.deepEqual([further[run], further[across]], [way[run] * 0.28125, 0], `flight ${at}`);
  });
}

// THE STAIRCASE'S OWN STEPS, half as wide again. A staircase of a metre in the place of each,
// its box begun at the same column and row, has the same sixteen steps - where each begins and
// ends along the flight, and from where to where it rises - and across the flight it is 1 m
// wide where the wide one is 1.5 m.
const metre = (one) => (one.kind ? flight(one.turn, one.x[0], one.y[0], 'stairs') : one);
const narrow = sceneOf(site, things.map(metre), figures, alone);
for (const at of WIDE) {
  const [run, across] = lying(at);
  const spans = (part) => [part.min[run], part.max[run], part.min[2], part.max[2]];
  const widths = (all) => partsOf(at, all).map((part) => part.max[across] - part.min[across]);
  assert.deepEqual(partsOf(at, narrow).map(spans), partsOf(at).map(spans), `flight ${at}`);
  assert.deepEqual([widths(narrow), widths(scene)], [Array(16).fill(1), Array(16).fill(1.5)]);
}

// THE FLOOR ABOVE, with every rule there is. Each flight is the same steps, and its last is
// level with the floor of the storey above, whose slab lies from 108 m to 108.375 m. That floor
// is open over the 27 cells of each flight - nine by three, as the sketch has it - and whole
// beside them: of the 22 by 18 cells of the upper hall, the 4 * 27 over a flight have no slab
// over their middle, and every other one has. And nothing is amiss in that house, each flight
// lifted by the slab of its floor.
const house = sceneOf(site, things, figures);
const above = house.parts.filter((part) => part.thing === 1 && part.of === 'floor');
const within = ([first, last], count) => first <= count && count < last;
const overFlight = (column, row) =>
  WIDE.some((at) => within(things[at].x, column) && within(things[at].y, row));
const cells = { open: 0, whole: 0 };
for (let column = 2; column < 24; column += 1) {
  for (let row = 2; row < 20; row += 1) {
    const [x, y] = [(column + 0.5) / 2, 12 - (row + 0.5) / 2];
    const slab = above.some(({ min, max }) => min[0] < x && x < max[0] && min[1] < y && y < max[1]);
    assert.equal(slab, !overFlight(column, row), `the floor over column ${column}, row ${row}`);
    cells[slab ? 'whole' : 'open'] += 1;
  }
}
assert.deepEqual(cells, { open: 4 * 27, whole: 22 * 18 - 4 * 27 });
for (const floor of above) assert.deepEqual([floor.min[2], floor.max[2]], [108, 108.375]);
for (const at of WIDE) assert.deepEqual(partsOf(at, house), partsOf(at), `flight ${at}`);
assert.deepEqual(wrong(house, 0.375), []);

// IN A STAIR ROOM AS WIDE AS ITSELF it is fitted as clear.js fits every flight. The room is
// 5.5 m by 1.5 m, from x = 2 to 7.5 and from y = 6.5 to 8, alone on the plot: an outer wall of
// 0.375 m on every side leaves 4.75 m along it, from x = 2.375, and 0.75 m across it, from
// y = 6.875. The flight was drawn against the uphill wall, from x = 2: it keeps its 4.5 m, and
// is moved 0.375 m down the plot. Across it is longer than what is clear, and is cut to it:
// to 0.75 m, half its width - the least it keeps - between the two walls.
const well = [box([4, 15], [8, 11], [24, 30], 'Staircase'), flight(0, 4, 8)];
const stout = { ...figures, outerWallM: 0.5 };
const [snug, tight] = [figures, stout].map((by) => sceneOf(site, well, by, alone).parts);
assert.deepEqual([snug.length, tight.length], [16, 16]);
assert.deepEqual(snug[0], step(1, [2.375, 6.875, 105.375], [2.65625, 7.625, 105.5625]));
assert.deepEqual(snug[15], step(1, [6.59375, 6.875, 105.375], [6.875, 7.625, 108.375]));
// Between outer walls of 0.5 m there are 4.5 m along it, from x = 2.5 - it is moved there, and
// fills them - and half a metre across: less than the least it keeps. It stays 0.75 m wide,
// about the middle of what is clear, y = 7.25, and so stands 0.125 m in either wall.
assert.deepEqual(tight[0], step(1, [2.5, 6.875, 105.375], [2.78125, 7.625, 105.5625]));
assert.deepEqual(tight[15], step(1, [6.71875, 6.875, 105.375], [7, 7.625, 108.375]));
// Nothing is amiss with every rule there is, told how far the flight was moved, and lifted: its
// middle went down the plot and stayed where it was across it, for it was cut about its middle.
assert.deepEqual(wrong(sceneOf(site, well, figures), [0.375, 0, 0.375]), []);
assert.deepEqual(wrong(sceneOf(site, well, stout), [0.5, 0, 0.375]), []);

// OVER A STORAGE it is whole, as a staircase of a metre is (flights.js). A stair room of 3 m,
// from x = 1 to 4, and a storage of 2.5 m after it, to x = 6.5, both 1.5 m wide, from y = 4.5 to
// 6, with the flight drawn over both, from x = 2 to 6.5. Its own room is the stair room, under
// its foot, and the storage lies under it: the two meet at x = 4, under three lines of nine cells.
const flat = [
  box([2, 8], [12, 15], [24, 30], 'Staircase'),
  box([8, 13], [12, 15], [24, 30], 'Storage'),
  flight(0, 4, 12),
];
const asked = [];
const built = sceneOf(site, flat, figures, { blocks: [(context) => asked.push(context) && []] });
const run = runOf(asked[0], flat[2]);
const told = ({ at, is, from, to }) => [asked[0].space.nameOf(at), is, from, to].join(' ');
assert.deepEqual(run.over.map(told), ['Staircase own -Infinity 4', 'Storage under 4 Infinity']);
assert.deepEqual([run.axis, run.lines.length, run.lines[0].length], [0, 3, 9]);
// Between the outer wall behind its foot and the one beyond its last step 4.75 m are clear,
// from x = 1.375 to 6.125: the flight is moved 0.375 m up the plot. Across it is cut to the
// 0.75 m between the side walls, from y = 4.875. Its ninth step, from x = 3.875 to 4.15625, is
// parted at x = 4: over the storage it is its rise and 0.125 m thick, from 107.0625 - 0.3125 =
// 106.75 m, and so is every step after it - seventeen parts, with sixteen tops.
const over = partsOf(2, built);
assert.equal(over.length, 17);
assert.deepEqual(over[0], step(2, [1.625, 4.875, 105.375], [1.90625, 5.625, 105.5625]));
assert.deepEqual(over[8], step(2, [3.875, 4.875, 105.375], [4, 5.625, 107.0625]));
assert.deepEqual(over[9], step(2, [4, 4.875, 106.75], [4.15625, 5.625, 107.0625]));
assert.deepEqual(over[16], step(2, [5.84375, 4.875, 108.0625], [6.125, 5.625, 108.375]));
assert.equal(new Set(over.map((part) => part.max[2])).size, 16);
// With every rule there is, the storage, all of it under the flight, has no roof - the flight is
// its ceiling - where the stair room has its own; and nothing is amiss.
const whole = sceneOf(site, flat, figures);
const roofs = (thing) => whole.parts.filter((one) => one.thing === thing && one.of === 'roof');
assert.deepEqual([roofs(0).length > 0, roofs(1).length], [true, 0]);
assert.deepEqual(partsOf(2, whole), over);
assert.deepEqual(wrong(whole, [-0.375, 0, 0.375]), []);

process.stdout.write(
  'tools/sketch/scene: a wide staircase is sixteen steps a metre and a half wide, climbing the way the pad draws its arrow, under a floor that is open over its 27 cells\n',
);
