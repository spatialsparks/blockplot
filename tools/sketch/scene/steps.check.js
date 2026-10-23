// The check of the steps: staircases made up here, in a made-up hall and on the ground beside
// it, against steps a person worked out by hand - how many a height holds, the first and the
// last of a flight, which way it climbs at each quarter, the post and the treads of a spiral
// one - and against the pad's own top view, which draws an arrow up each. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';
import { RISE_M, steps } from './steps.js';

// The pad's drawing of an object: shapes.js, a plain script that wants figures.js before it.
for (const script of ['figures', 'shapes', 'stairs']) await import(`../${script}.js`);
const { shapes } = globalThis;

// A made-up plot of 20 m by 12 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 12 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m: in row 30.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 20,
  yFromM: 0,
  yToM: 12,
  sideM: [100, 120],
  outline: [
    [1, 11],
    [19, 11],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(25).fill(Array(41).fill('475').join(' ')) },
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

// A hall of 11 m by 9 m, a storey of 3 m high, on level 30 at 105 m, and a second storey on it,
// at 108 m: the floor slab of each is 0.375 m thick. A staircase is 4.5 m by 1 m, a spiral one
// 2 m by 2 m, and each a storey high. Three stand on the hall's floor, a metre or more clear of
// its edges - 2 to 4 - and five on the ground beside the house, from row 30.5 up. The last two
// of those are lower: a flight of 1.9 m - ten rises, but for the last figure of a height that
// is worked out - and a spiral staircase of 1 m.
const grey = { name: 'grey', hex: '#8795a1' };
const on = (kind, turn, x, y, z) => ({ x, y, z, kind, turn, fill: '#eceff2', floor: z[1] });
const things = [
  { x: [2, 24], y: [2, 20], z: [24, 30], colour: grey, name: 'Hall' },
  { x: [2, 24], y: [2, 20], z: [18, 24], colour: grey, name: 'Upper hall' },
  on('stairs', 0, [4, 13], [4, 6], [24, 30]),
  on('stairs', 1, [18, 20], [4, 13], [24, 30]),
  on('spiral', 0, [6, 10], [10, 14], [24, 30]),
  on('stairs', 2, [26, 35], [2, 4], [24.5, 30.5]),
  on('stairs', 3, [26, 28], [6, 15], [24.5, 30.5]),
  on('spiral', 1, [30, 34], [6, 10], [24.5, 30.5]),
  on('stairs', 0, [30, 34], [12, 14], [26.7, 30.5]),
  on('spiral', 2, [30, 34], [16, 20], [28.5, 30.5]),
];
const [FLIGHTS, STAIRCASES] = [
  [2, 3, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9],
];
// How far each is lifted, by hand: by the hall's floor slab on its floor, by nothing on the ground.
const lift = (at) => (things[at].floor === 30 ? 0.375 : 0);

// A figure that a person works out in tenths and one that is worked out in halves of halves
// differ in their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 + 0 : one,
  );
// The rules alone: no rule of blocks, and of the objects these two.
const alone = { blocks: [], kinds: steps };
const scene = sceneOf(site, things, figures, alone);
const partsOf = (at, all = scene) => held(all.parts.filter((part) => part.thing === at));
// A step of a flight by hand, and a tread of a spiral staircase that reaches 1 m from `about`.
const [CONCRETE, METAL] = [
  { of: 'step', shape: 'box', surface: 'concrete' },
  { of: 'step', shape: 'wedge', surface: 'metal', inner: 0.1, outer: 1 },
];
const step = (thing, floor, min, max) => ({ ...CONCRETE, min, max, thing, floor });
const tread = (thing, floor, about, [from, to], min, max) =>
  held({ ...METAL, min, max, thing, floor, about, from, to });

// HOW MANY. A storey of 3 m holds sixteen steps at a rise of 0.19 m at the most - fifteen would
// rise 0.2 m each - and each rises 0.1875 m. Every step stands on the foot of its staircase:
// at 105.375 m on the hall's slab, at 104.75 m on the ground. The first is a rise high, each
// is a rise higher than the one before, and the last is as high as the staircase.
assert.equal(RISE_M, 0.19);
for (const at of FLIGHTS) {
  const flight = partsOf(at);
  const foot = scene.solids[at].min[2] + lift(at);
  assert.deepEqual([flight.length, foot], [16, at < 5 ? 105.375 : 104.75]);
  flight.forEach((part, before) => {
    assert.deepEqual([part.of, part.shape, part.surface], ['step', 'box', 'concrete']);
    assert.deepEqual([part.min[2], part.max[2]], [foot, foot + (before + 1) * 0.1875]);
  });
  assert.equal(flight[15].max[2], foot + 3);
}

// THE FIRST AND THE LAST, by hand: a tread is 4.5 m / 16 = 0.28125 m deep. The flight that is not
// turned lies from x = 2 to 6.5 and from y = 9 to 10, and climbs down the plot. The one turned
// by a quarter lies from x = 9 to 10 and from y = 5.5 to 10, and climbs towards the smaller y.
assert.deepEqual(partsOf(2)[0], step(2, 105, [2, 9, 105.375], [2.28125, 10, 105.5625]));
assert.deepEqual(partsOf(2)[15], step(2, 105, [6.21875, 9, 105.375], [6.5, 10, 108.375]));
assert.deepEqual(partsOf(3)[0], step(3, 105, [9, 9.71875, 105.375], [10, 10, 105.5625]));
assert.deepEqual(partsOf(3)[15], step(3, 105, [9, 5.5, 105.375], [10, 5.78125, 108.375]));
// Turned by two quarters, from x = 13 to 17.5 and from y = 10 to 11, the lowest step lies at
// the downhill end; by three, from x = 13 to 14 and from y = 4.5 to 9, at the smallest y. On
// the ground, neither is lifted.
assert.deepEqual(partsOf(5)[0], step(5, 104.75, [17.21875, 10, 104.75], [17.5, 11, 104.9375]));
assert.deepEqual(partsOf(6)[0], step(6, 104.75, [13, 4.5, 104.75], [14, 4.78125, 104.9375]));

// SIDE BY SIDE. Along its run - x, and y where it is turned by one quarter or by three - a
// flight's steps touch: each begins where another ends, so none lies in another, and with no
// gap between them they reach from one end of the staircase's box to the other. Each is as
// wide as the box. So they fill all of its footprint.
for (const at of FLIGHTS) {
  const [run, across] = [things[at].turn % 2, 1 - (things[at].turn % 2)];
  const box = held(scene.solids[at]);
  const along = partsOf(at).sort((a, b) => a.min[run] - b.min[run]);
  assert.deepEqual([along[0].min[run], along[15].max[run]], [box.min[run], box.max[run]]);
  along.forEach((part, place) => {
    if (place > 0) assert.equal(part.min[run], along[place - 1].max[run], `flight ${at}`);
    assert.equal(part.max[run] - part.min[run], 0.28125, `flight ${at}`);
    assert.deepEqual([part.min[across], part.max[across]], [box.min[across], box.max[across]]);
  });
}

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

// WHICH WAY. The pad draws an arrow up a flight: a line along it, and a head of three places,
// whose middle one is the tip the line ends in. By hand, the arrow points down the plot while
// the flight is not turned - towards the larger x - and a quarter on with every quarter,
// clockwise seen from above: towards the smaller y, up the plot, towards the larger y. In all
// four turns the lowest step lies at the end where the arrow begins, the highest at the other,
// and each step a tread further the way the arrow points than the step before.
const WAYS = { 2: [1, 0], 3: [0, -1], 5: [-1, 0], 6: [0, 1] };
for (const at of FLIGHTS) {
  const lines = padDraws(things[at]);
  const heads = lines.filter((line) => line.length === 3);
  assert.equal(heads.length, 1, `the head of the arrow up flight ${at}`);
  const tip = heads[0][1];
  const [begins] = lines.find((line) => line.length === 2 && String(line[1]) === String(tip));
  const way = held(minus(tip, begins).map((far) => Math.sign(Math.round(far * 1e9))));
  assert.deepEqual(way, WAYS[at], `the pad's arrow up flight ${at}`);
  const middles = partsOf(at).map(middleOf);
  const far = (step) => Math.hypot(...minus(middles[step], begins));
  assert.ok(far(0) < 1 && far(15) > 3.5, `flight ${at} begins where the arrow does`);
  middles.slice(1).forEach((middle, before) => {
    const further = held(minus(middle, middles[before]));
    assert.deepEqual(further, held(way.map((one) => one * 0.28125)), `flight ${at}`);
  });
}
// A turn counts in quarters: five of them are one, and one back is three.
const turnedBy = (turn) => held(sceneOf(site, [{ ...things[3], turn }], figures, alone).parts);
assert.deepEqual([turnedBy(5), turnedBy(-1)], [turnedBy(1), turnedBy(3)]);

// TEN RISES. A flight of 1.9 m, from x = 15 to 17 and from y = 5 to 6 on the ground, has ten
// steps of 0.19 m, each 0.2 m deep: a step may rise as much as the most there is.
const low = partsOf(8);
assert.equal(low.length, 10);
assert.deepEqual(low[0], step(8, 104.75, [15, 5, 104.75], [15.2, 6, 104.94]));
assert.deepEqual(low[9], step(8, 104.75, [16.8, 5, 104.75], [17, 6, 106.65]));

// A SPIRAL STAIRCASE, by hand. In the hall it stands about x = 4, y = 6, and reaches 1 m from
// there: a post of 0.2 m across, as high as the staircase, and sixteen treads of 22.5 degrees
// from the post's rim out, each 0.1875 m thick. The first begins at the uphill side, at 180
// degrees, and ends 22.5 degrees on, clockwise; the last ends where the first began, a whole
// turn on. The cosine and the sine of 22.5 degrees, half of 45: 0.9238795325 and 0.3826834324.
const [C, S] = [Math.sqrt(2 + Math.SQRT2) / 2, Math.sqrt(2 - Math.SQRT2) / 2];
const [post, ...treads] = partsOf(4);
const POST = { of: 'piece', shape: 'round', surface: 'metal', thing: 4, floor: 105 };
assert.deepEqual(post, { ...POST, min: [3.9, 5.9, 105.375], max: [4.1, 6.1, 108.375] });
assert.equal(treads.length, 16);
assert.deepEqual(
  treads[0],
  tread(4, 105, [4, 6], [180, 157.5], [3, 6, 105.375], [4 - 0.1 * C, 6 + S, 105.5625]),
);
assert.deepEqual(
  treads[15],
  tread(4, 105, [4, 6], [-157.5, -180], [3, 6 - S, 108.1875], [4 - 0.1 * C, 6, 108.375]),
);
// Turned by a quarter, on the ground about x = 16, y = 8, the first tread lies a quarter on: it
// begins at 90 degrees, up the top view's paper, and is not lifted.
assert.deepEqual(
  partsOf(7)[1],
  tread(7, 104.75, [16, 8], [90, 67.5], [16, 8 + 0.1 * C, 104.75], [16 + S, 9, 104.9375]),
);
// The one of 1 m, about x = 16, y = 3, has six treads of 60 degrees, each a sixth of a metre
// thick: five would rise 0.2 m each, more than the most there is. Turned by two quarters, its
// first begins at the downhill side, at 0 degrees, and its second reaches from -60 to -120
// degrees: across the way down the paper, where its box reaches the rim. The cosine of 60
// degrees is 0.5, and a tenth of its sine 0.0866025404.
assert.deepEqual([partsOf(9).length, partsOf(9)[1].from], [7, 0]);
const [low60, high60] = [
  [15.5, 2, 104.75 + 1 / 6],
  [16.5, 3 - 0.05 * Math.sqrt(3), 104.75 + 2 / 6],
];
assert.deepEqual(partsOf(9)[2], tread(9, 104.75, [16, 3], [-60, -120], low60, high60));
// Of every spiral staircase: a post and treads. Each tread begins at the post's rim, where the
// one before it ends and on top of it, and ends further clockwise; the first lies on the foot
// of the staircase, the top of the last is the post's top, and together they wind once.
for (const at of [4, 7, 9]) {
  const [pole, ...ring] = partsOf(at);
  assert.deepEqual([pole.of, pole.shape], ['piece', 'round']);
  ring.forEach((part, before) => {
    const last = before === 0 ? { to: part.from, max: pole.min } : ring[before - 1];
    assert.deepEqual(
      [part.of, part.shape, part.from, part.min[2]],
      ['step', 'wedge', last.to, last.max[2]],
    );
    assert.ok(part.to < part.from, `spiral ${at} winds clockwise`);
    assert.equal(part.inner, held((pole.max[0] - pole.min[0]) / 2), `spiral ${at}`);
  });
  assert.deepEqual([ring.at(-1).to, ring.at(-1).max[2]], [ring[0].from - 360, pole.max[2]]);
}
// And as the pad draws it, at every quarter: out of the post it draws a line where each of the
// treads it draws begins. The first tread here begins on the first of them, and the pad's next
// lies to the right of it for one who looks out of the post: clockwise, seen from above.
for (const turn of [0, 1, 2, 3]) {
  const spun = { ...things[4], turn };
  const [first, next] = padDraws(spun)
    .filter((line) => line.length === 2)
    .map(([middle, rim]) => minus(rim, middle));
  const begins = (sceneOf(site, [spun], figures, alone).parts[1].from * Math.PI) / 180;
  assert.deepEqual(held([Math.cos(begins), Math.sin(begins)]), held(first), `turned by ${turn}`);
  assert.ok(first[0] * next[1] - first[1] * next[0] < 0, `the pad winds, turned by ${turn}`);
}
// In a box that is not square - no kind has one, but a rule is given a box - the treads reach
// as far as its nearer sides, and no further: 1 m, in one of 3 m by 2 m and in one of 2 m by 3 m.
const oblong = (x, y) => sceneOf(site, [on('spiral', 0, x, y, [24.5, 30.5])], figures, alone);
for (const one of [oblong([30, 36], [6, 10]), oblong([30, 34], [6, 12])]) {
  assert.deepEqual([one.parts[1].outer, amiss(one, () => 0)], [1, []]);
}

// WITHIN ITS BOX, LIFTED. Every step and every tread lies within the box of its staircase,
// lifted as the hand says, and is a part as parts.js says one is (holds.js). Told of no lift,
// the same question finds the staircases in the hall, by what rises over the top of their
// boxes: the slab is two rises thick, so the last two steps, and of the spiral one the post
// and the last two treads. The last step is level with the top of its box, lifted.
assert.deepEqual(amiss(scene, lift), []);
const found = /^part \d+, a (\w+) of thing (\d+), does not lie within the box of its object/;
const outside = amiss(scene).map((words) => found.exec(words)?.slice(1).join(' '));
assert.deepEqual(outside, ['step 2', 'step 2', 'step 3', 'step 3', 'piece 4', 'step 4', 'step 4']);
// A staircase gives steps, and no box of its size: none of its parts is as large as its solid.
for (const at of STAIRCASES) {
  const { min, max } = scene.solids[at];
  const whole = (part) =>
    [0, 1, 2].every((axis) => part.max[axis] - part.min[axis] > max[axis] - min[axis] - 1e-9);
  assert.ok(!scene.parts.some((part) => part.thing === at && whole(part)), `staircase ${at}`);
}

// IN THE HOUSE. objects.js has the two rules. With every rule there is, each staircase is the
// same steps - and the last step of each staircase in the hall is level with the floor of the
// storey above, whose top lies at 108.375 m: from its floor to the next. That floor is open
// over each of the three, the spiral one too (slabs.js): none of it lies over their middles.
assert.ok(KINDS.stairs === steps.stairs && KINDS.spiral === steps.spiral);
const house = sceneOf(site, things, figures);
for (const at of STAIRCASES) assert.deepEqual(partsOf(at, house), partsOf(at), `staircase ${at}`);
const above = house.parts.filter((part) => part.thing === 1 && part.of === 'floor');
assert.ok(above.length > 0, 'the storey above has no floor');
for (const floor of above) assert.equal(floor.max[2], 108.375);
for (const at of [2, 3, 4]) {
  assert.equal(partsOf(at, house).at(-1).max[2], 108.375);
  const [x, y] = middleOf(house.solids[at]);
  const over = ({ min, max }) => min[0] < x && x < max[0] && min[1] < y && y < max[1];
  assert.ok(!above.some(over), `the floor above is closed over staircase ${at}`);
}

process.stdout.write(
  'tools/sketch/scene: a staircase is steps one can count, climbing the way the pad draws its arrow, and a spiral one winds once round its post\n',
);
