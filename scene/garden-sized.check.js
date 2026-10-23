// The check of the garden by its size (T-037.4): a bench, a garden table, a sun lounger, a
// parasol, a tree and a bush at sizes of their ranges, each at its four turns, on the ground of a
// made-up plot - against what holds of every part, the thickness in metres of each made piece at
// its kind's own size, the shares of a tree and a bush, today's pieces at a kind's own size, the
// pad's own top view, and a garden table of 4 m by 2 m worked out by hand. Run by
// tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { ruleOf } from './furniture.js';
import { garden } from './garden.js';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';

// The pad's own sizes and drawings: shapes.js, a plain script that wants figures.js before it,
// and after it the script that draws what stands in a garden.
for (const script of ['figures', 'shapes', 'garden']) await import(`../${script}.js`);
const { shapes } = globalThis;

// A made-up plot of 56 m by 190 m, in cells of half a metre: a column is x = column / 2, a row
// y = 190 - row / 2, a level 140 - level / 2 metres above sea level. Its ground is flat, at
// 104.75 m: level 70.5.
const plot = { cellM: 0.5, xFromM: 0, xToM: 56, yFromM: 0, yToM: 190, sideM: [100, 140] };
const ground = { baseM: 100, rowsCm: Array(381).fill(Array(113).fill('475').join(' ')) };
const outline = [
  [1, 189],
  [55, 189],
  [1, 1],
];
const site = { ...plot, outline, ground };
const walls = { outerWallM: 0.375, innerWallM: 0.25, floorSlabM: 0.375, roofSlabM: 0.3125 };
const figures = { ...walls, railingHighM: 1, doorHighM: 2, windowHighM: 1.5, sillHighM: 1 };

// Each size stands on the ground four times, turned by none to three quarters, on squares of
// 13 m - a tree of 12 m fits one - a row a size in the order of `SIZES`. An object says the
// sizes its kind takes (`TAKES`), and no other.
const SIZES = [
  ...[1, 1.5, 4].map((long) => ['bench', long, 0.5, 0.8]),
  ...['1 1 .7', '2 1.5 .75', '4 2 1.1'].map((size) => [
    'gardentable',
    ...size.split(' ').map(Number),
  ]),
  ...[1.5, 2.5].map((long) => ['lounger', long, 0.5, 0.8]),
  ...['1.5 1.5', '4 3'].map((pair) => ['parasol', ...pair.split(' ').map(Number), 2.5]),
  ...['2 2 3', '12 12 25'].map((size) => ['tree', ...size.split(' ').map(Number)]),
  ...['.5 .5 .5', '4 4 3'].map((size) => ['bush', ...size.split(' ').map(Number)]),
];
const RULES = { ...garden, tree: KINDS.tree, bush: KINDS.bush };
const SIX = ['bench', 'gardentable', 'lounger', 'parasol', 'tree', 'bush'];
const TURNS = [0, 1, 2, 3];
const span = (first, far) => [first, first + far];
function made([kind, long, deep, high], turn, nth) {
  const asked = { long, deep, high };
  const own = Object.fromEntries(Object.keys(shapes.TAKES[kind]).map((way) => [way, asked[way]]));
  const [along, wide, tall] = shapes.sizeOf({ kind, turn, ...own }).map((m) => 2 * m);
  const [x, y, z] = [span(2 + 26 * turn, along), span(2 + 26 * nth, wide), span(70.5 - tall, tall)];
  return { kind, turn, ...own, fill: '#eceff2', floor: 70.5, x, y, z };
}
const things = SIZES.flatMap((size, nth) => TURNS.map((turn) => made(size, turn, nth)));
const OBJECTS = things.map((_, at) => at);
const sizeAt = (at) => SIZES[Math.floor(at / 4)];
for (const thing of things) assert.ok(shapes.known(thing), `${thing.kind} of a size it takes`);

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

// WITHIN ITS BOX, ON THE GROUND. At every size and turn each piece lies within the box of its
// object, lifted by nothing, and no two pieces of different surfaces lie in each other.
assert.deepEqual(
  amiss(scene, () => 0),
  [],
);

// AS LARGE AS IT SAYS. All its pieces together fill the box of the size it says, turned as it is:
// a tree of 12 m by 12 m by 25 m is so wide and so high, a bush of 0.5 m so small.
for (const at of OBJECTS) {
  const [kind, long, deep, high] = sizeAt(at);
  const parts = partsOf(at);
  const ends = (end, most) => [0, 1, 2].map((way) => most(...parts.map((part) => part[end][way])));
  const [low, top] = [ends('min', Math.min), ends('max', Math.max)];
  const whole = top.map((most, way) => held(most - low[way]));
  const size = things[at].turn % 2 === 0 ? [long, deep, high] : [deep, long, high];
  assert.deepEqual(whole, held(size), `a ${kind} of ${long} by ${deep} by ${high} m, as large`);
  assert.equal(low[2], 104.75, `a ${kind} on the ground`);
}

// AS MANY PIECES AS AT ITS OWN SIZE, AS THICK. A garden table is its top and a column on a foot,
// two of each where it is longer than 2 m; the others as many pieces as at their own size. And
// by hand what of a piece is the same at every size: the pieces, joined by `+` - the first is 0 -
// which way - 0 along, 1 across, 2 up - and the metres; with a minus, that much short of its
// object, a bench's seat 8 cm short of its length; with a star, that share of it, as a tree's
// trunk and crown and a bush grow with their box.
const COUNT = { bench: 6, lounger: 7, parasol: 3, tree: 2, bush: 1 };
const THICK = {
  bench: '0+1+2+3 0 .04, 1+3 1 .04, 0+2 2 .45, 1+3 2 .35, 4+5 0 -.08, 4 2 .04, 5 1 .03, 5 2 .25',
  gardentable: [
    '0 0 -0, 0 1 -0, 0 2 .04, 1+3 0 .06, 1+3 1 .06, 1+3 2 -.07',
    '2+4 0 .5, 2+4 1 .5, 2+4 2 .03',
  ].join(', '),
  lounger: '0+1+2+3 0 .05, 0+1+2+3 1 .05, 0+1+2+3 2 .25, 4+5 0 -0, 4+5 2 .05, 6 0 .3, 6 2 .45',
  parasol: '0 0 .5, 0 1 .5, 0 2 .1, 1 0 .04, 1 1 .04, 1 2 2, 2 0 -0, 2 1 -0, 2 2 .4',
  tree: '0 0 *.08, 0 1 *.08, 0 2 *.32, 1 0 *1, 1 1 *1, 1 2 *.68',
  bush: '0 0 *1, 0 1 *1, 0 2 *1',
};
function holdsThick(kind, extents, size, said) {
  for (const row of THICK[kind].split(', ')) {
    const [pieces, way, figure] = row.split(' ');
    const metres = Number(figure.replace('*', ''));
    const [share, short] = [figure.startsWith('*'), figure.startsWith('-')];
    const want = held(share ? size[way] * metres : short ? size[way] + metres : metres);
    for (const nth of pieces
      .split('+')
      .map(Number)
      .filter((one) => one < extents.length)) {
      assert.equal(extents[nth][way], want, `${said}: piece ${nth}, way ${way}`);
    }
  }
  const count = kind === 'gardentable' ? (size[0] > 2 ? 5 : 3) : COUNT[kind];
  assert.equal(extents.length, count, said);
}
for (const kind of SIX) {
  const own = shapes.KINDS[kind].size;
  holdsThick(kind, extentsOf(built(RULES[kind], own), 0), own, `a ${kind} of its own size`);
}
for (const at of OBJECTS) {
  const [kind, long, deep, high] = sizeAt(at);
  const said = `a ${kind} of ${long} by ${deep} by ${high} m turned by ${things[at].turn}`;
  holdsThick(kind, extentsOf(partsOf(at), things[at].turn), [long, deep, high], said);
}

// A GARDEN TABLE'S COLUMNS. Up to 2 m long one, in its middle; longer two, each a quarter of its
// length in from its end, and each foot under its column.
for (const long of [1, 1.5, 2, 2.5, 3, 4]) {
  const [, ...standing] = built(garden.gardentable, [long, 1, 0.75]);
  const middles = standing.map(({ min, max }) => held((min[0] + max[0]) / 2));
  const want =
    long > 2 ? [long / 4, long / 4, (3 * long) / 4, (3 * long) / 4] : [long / 2, long / 2];
  assert.deepEqual(middles, held(want), `the columns of a garden table of ${long} m`);
}

// Pieces said in rows, a few to a line: a shape - `b` a box, `r` a round, `d` a dome - a surface,
// six figures.
const SHAPE = { b: 'box', r: 'round', d: 'dome' };
const rowsOf = (lines) =>
  lines
    .flatMap((line) => line.split('; '))
    .map((row) => row.split(' '))
    .map(([shape, surface, ...figures]) => [SHAPE[shape], surface, figures.map(Number)]);

// TODAY'S PIECES. At its own size each kind is the pieces it was before it took a size, to the
// number and to the place: each along, across and up in metres of its own box, as it lies unturned
// - across counted from its far side, its back, as the pad's rows are.
const TODAY = {
  bench: [
    'b metal 0 .04 0 .5 0 .45; b metal 0 .04 0 .04 .45 .8',
    'b metal 1.46 1.5 0 .5 0 .45; b metal 1.46 1.5 0 .04 .45 .8',
    'b joinery .04 1.46 0 .5 .41 .45; b joinery .04 1.46 0 .03 .55 .8',
  ],
  gardentable: [
    'r joinery 0 1 0 1 .71 .75; r metal .47 .53 .47 .53 .03 .71; r metal .25 .75 .25 .75 0 .03',
  ],
  lounger: [
    'b joinery 0 .05 0 .05 0 .25; b joinery 0 .05 .45 .5 0 .25',
    'b joinery 1.95 2 0 .05 0 .25; b joinery 1.95 2 .45 .5 0 .25',
    'b joinery 0 2 0 .5 .25 .3; b fabric 0 2 0 .5 .3 .35; b fabric 0 .3 0 .5 .35 .8',
  ],
  parasol: [
    'r stone 1 1.5 1 1.5 0 .1; r metal 1.23 1.27 1.23 1.27 .1 2.1; d fabric 0 2.5 0 2.5 2.1 2.5',
  ],
};
for (const [kind, lines] of Object.entries(TODAY)) {
  const own = shapes.KINDS[kind].size;
  const today = rowsOf(lines).map(([shape, surface, [a, b, c, d, e, f]]) => {
    const [along, across, up] = [
      [a, b],
      [c, d],
      [e, f],
    ].map((pair, way) => pair.map((metres) => metres / own[way]));
    return { shape, surface, along, across, up };
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
  return held(drawn.map((places) => places.map(([column, row]) => [column / 2, 190 - row / 2])));
}
/** The box around some places, seen from above - and so what a part covers of the ground. */
const around = (places) => ({
  min: [0, 1].map((way) => Math.min(...places.map((place) => place[way]))),
  max: [0, 1].map((way) => Math.max(...places.map((place) => place[way]))),
});
const flat = ({ min, max }) => ({ min: min.slice(0, 2), max: max.slice(0, 2) });

// WHERE THE PAD DRAWS IT, at every size and quarter. A piece at a place in its list covers the
// ground of the shape at a place in the pad's drawing: a bench's seat between its ends and its
// back along its far side; a garden table's top on its oval; a lounger's frame and cushion on its
// outline and its back at its head; a parasol's canopy on its circle and its pole on the dot; a
// tree's crown on its circle and its trunk on the dot; a bush on its circle.
const LIES_ON = {
  bench: '4:1 5:2',
  gardentable: '0:0',
  lounger: '4:0 5:0 6:1',
  parasol: '2:0 1:1',
  tree: '1:0 0:1',
  bush: '0:0',
};
for (const at of OBJECTS) {
  const [kind, long, deep] = sizeAt(at);
  const [pieces, drawn] = [partsOf(at), padDraws(things[at])];
  const said = `a ${kind} of ${long} by ${deep} m turned by ${things[at].turn}`;
  for (const [piece, shape] of LIES_ON[kind].split(' ').map((pair) => pair.split(':'))) {
    assert.deepEqual(flat(pieces[piece]), around(drawn[shape]), `piece ${piece} of ${said}`);
  }
}

// CUT BY ITS ROOM (clear.js): each of the four left 0.4 m each way keeps its pieces in its box.
const CUT = [0.4, 0.4, 0.4];
const within = ({ min, max }) => min.every((m, w) => m >= 0 && m < max[w] && max[w] <= CUT[w]);
for (const kind of ['bench', 'gardentable', 'lounger', 'parasol']) {
  const cut = built(RULES[kind], CUT);
  assert.ok(cut.length === built(RULES[kind], shapes.KINDS[kind].size).length, `${kind} cut`);
  assert.ok(cut.every(within), `a ${kind} cut small`);
}

// BY HAND, from nought, not turned: x along it, y across - its far side at y = 2 - and z up. A
// GARDEN TABLE OF 4 M by 2 m, 1.1 m high: its top of joinery round over all of it, from 1.06 m
// to 1.1 m; a quarter of its length in from each end, at x = 1 and x = 3, and in the middle of
// its depth, y = 1, a column of metal 6 cm across from 3 cm up to the top, on a foot of metal
// 0.5 m across and 3 cm high.
const standingAt = (x) => [
  `r metal ${x - 0.03} .97 .03 ${x + 0.03} 1.03 1.06`,
  `r metal ${x - 0.25} .75 0 ${x + 0.25} 1.25 .03`,
];
const table = ['r joinery 0 0 1.06 4 2 1.1', ...standingAt(1), ...standingAt(3)];
const byHand = rowsOf(table).map(([shape, surface, figures]) => {
  return { of: 'piece', shape, min: figures.slice(0, 3), max: figures.slice(3), surface };
});
assert.deepEqual(built(garden.gardentable, [4, 2, 1.1]), held(byHand), 'a garden table of 4 m');

// IN THE HOUSE. objects.js has these rules; with every rule there is, each object is the same
// pieces, and what holds of every part holds.
for (const kind of SIX) assert.ok(KINDS[kind] === RULES[kind], kind);
const house = sceneOf(site, things, figures);
for (const at of OBJECTS) assert.deepEqual(partsOf(at, house), partsOf(at), `object ${at}`);
assert.deepEqual(
  amiss(house, () => 0),
  [],
);
process.stdout.write(
  "tools/sketch/scene: a bench, a garden table, a sun lounger, a parasol, a tree and a bush are built for their size - a garden table longer than 2 m on two columns - every made piece as thick as at its own size and today's pieces there, within its box, turned as the pad turns its drawing\n",
);
