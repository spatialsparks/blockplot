// The check of a top that slopes, in the scene (story ST-026): what a block says of its top in
// metres, along the plot and across it, each way; where that top lies over a part of the block;
// all that lies between some bottoms and some tops, as the fewest shapes that fill it - of
// levels alone, under a slope, where two lines cross, down to an edge, where nothing is left,
// and a hair apart; a solid with its top, beside a level block as it was; a rule that builds
// under a top with these three and nothing else; and what a slant is, and each thing it is not.
// On a made-up plot and things made up on it, against figures worked out by hand. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { HAIR_M, filled, lineAt, lineOver, topOf } from './tops.js';

// A made-up plot of 20 m by 10 m in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 20 - row / 2, a level 110 - level / 2 metres above sea level. Its ground is
// level, at 103 m.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 20,
  yFromM: 10,
  yToM: 20,
  sideM: [100, 110],
  outline: [
    [1, 19],
    [19, 19],
    [1, 11],
  ],
  ground: { baseM: 100, rowsCm: Array(21).fill(Array(41).fill(300).join(' ')) },
};
// Every figure of the house a quarter of a metre: no rule of the house is asked here.
const FIGURES = 'outerWallM innerWallM floorSlabM roofSlabM railingHighM doorHighM windowHighM';
const figures = Object.fromEntries(`${FIGURES} sillHighM`.split(' ').map((name) => [name, 0.25]));

// Three made-up blocks of 4 m by 2 m, 3 m high, side by side on a floor at 103 m: columns 4 to
// 12, 12 to 20 and 20 to 28, rows 6 to 10 of the top view - y from 17 down to 15 - and levels 8
// to 14, 106 m down to 103 m. The top of the shed falls down the plot, from its own top to a
// metre over its floor: row 8 at its first column, row 12 at its last. The top of the lean-to
// falls down the paper by the same rows: row 8 at its first row, the larger y, and row 12 at
// its last. The third is level.
const grey = { name: 'grey', hex: '#8795a1' };
const box = { x: [4, 12], y: [6, 10], z: [8, 14], colour: grey };
const things = [
  { ...box, name: 'Shed', top: { axis: 'x', rows: [8, 12] } },
  { ...box, x: [12, 20], group: 4, top: { axis: 'y', rows: [8, 12] } },
  { ...box, x: [20, 28], name: 'Level' },
];
const [shed, lean, level] = things;

// A RULE OF THE CHECK'S OWN, as a rule of the house builds under a top: the block as it builds
// a level one - a floor slab, on it a wall a quarter thick along the face down the paper, and
// beside the wall a roof slab - with every part made by `filled`, the wall and the roof under
// the top of their block (`lineOver`), the floor not: it is level under a slope, as it was.
const SLAB = 0.25;
const seen = [];
const rule = (context, at) => {
  seen.push(context);
  const thing = context.things[at];
  const { min, max } = context.boxOf(thing);
  const along = topOf(context, thing)?.along ?? 0;
  const made = (of, surface, where, bottoms, tops) =>
    filled(where, along, bottoms, tops).map((shape) => ({ of, ...shape, surface }));
  const [foot, floor] = [min[2], min[2] + SLAB].map((h) => [h, h]);
  const face = { min, max: [max[0], min[1] + SLAB] };
  const rest = { min: [min[0], min[1] + SLAB], max };
  const head = lineOver(context, thing, rest);
  const soffit = head.map((h) => h - SLAB);
  return [
    ...made('floor', 'wood', { min, max }, [foot], [floor]),
    ...made('wall', 'plaster', face, [floor], [lineOver(context, thing, face)]),
    ...made('roof', 'concrete', rest, [floor, soffit], [head]),
  ];
};
const scene = sceneOf(site, things, figures, { blocks: [rule] });
// What a rule gets is a frame: it has `xOf`, `yOf` and `hOf`.
const [frame] = seen;

// WHAT A BLOCK SAYS OF ITS TOP, in metres: the extent it slopes along, and its height at the
// lower figure of its box along that extent and at the higher. Along the plot the first column
// is the lower x: 106 m, then 104 m. Across it the first row is the HIGHER y, and the top is
// turned over: of the same two rows, 104 m at y = 15 and 106 m at y = 17. Each the other way
// round, too; rows that are not whole; and a level block says none.
const topped = (axis, rows) => topOf(frame, { ...box, top: { axis, rows } });
assert.deepEqual(topOf(frame, shed), { along: 0, high: [106, 104] });
assert.deepEqual(topOf(frame, lean), { along: 1, high: [104, 106] });
assert.deepEqual(topped('x', [12, 8]), { along: 0, high: [104, 106] });
assert.deepEqual(topped('y', [12, 8]), { along: 1, high: [106, 104] });
assert.deepEqual(topped('y', [8.5, 13.25]), { along: 1, high: [103.375, 105.75] });
assert.equal(topOf(frame, level), null);

// WHERE THE TOP LIES OVER A PART of its block, of which the heights are not read. The shed's
// top falls half a metre with every metre down the plot: over the part from x = 3 to x = 5 it
// lies at 105.5 m and at 104.5 m. The lean-to's rises a metre with every metre across the
// plot, from 104 m at y = 15: at y = 15.5 and at y = 16.5 it lies at 104.5 m and at 105.5 m.
// Over the whole block it is the top's own two figures, and over a level block the top of its
// box, twice.
const within = (x) => ({ min: [x, 15.5, 999], max: [x + 2, 16.5, -999] });
assert.deepEqual(lineOver(frame, shed, within(3)), [105.5, 104.5]);
assert.deepEqual(lineOver(frame, lean, within(7)), [104.5, 105.5]);
assert.deepEqual(lineOver(frame, shed, frame.boxOf(shed)), [106, 104]);
assert.deepEqual(lineOver(frame, level, within(11)), [106, 106]);
// A line said anew at the ends of another rectangle is the same straight line, on past the
// ends it was said at: the shed's top, from x = 0 to x = 8, is 107 m and 103 m. And at its own
// two ends it is the figures it was handed, however far apart they lie: nothing is worked out.
const wider = { min: [0, 15], max: [8, 17] };
assert.deepEqual(lineAt([106, 104], frame.boxOf(shed), 0, wider), [107, 103]);
assert.deepEqual(lineAt([3, 1e-16], wider, 0, wider), [3, 1e-16]);

// ALL THAT LIES BETWEEN some bottoms and some tops, over the shed's rectangle: 4 m along the
// plot from x = 2, and 2 m across it from y = 15. Four lines to begin with: the ground, at
// 103 m; a lid, at 106 m; a top that falls from the lid by 2 m, and one that rises to it.
const boxed = (min, max) => ({ shape: 'box', min, max });
const slanted = (min, max, along, low, high) => ({ shape: 'slant', min, max, along, low, high });
const over = { min: [2, 15, 999], max: [6, 17, -999] };
const fill = (bottoms, tops, along = 0) => filled(over, along, bottoms, tops);
const ground = [103, 103];
const lid = [106, 106];
const falls = [106, 104];
const rises = [104, 106];
// Of levels alone it is the one box, from the highest bottom to the lowest top, along either
// extent - with the figures it was handed, and nothing worked out of them.
const odd = { min: [0.1 + 0.2, 0.7, 999], max: [1.1, 2.3, -999] };
const shelves = [103.1, 103.3, 105.9, 105.7].map((h) => [h, h]);
for (const along of [0, 1]) {
  const one = filled(odd, along, shelves.slice(0, 2), shelves.slice(2));
  assert.deepEqual(one, [boxed([0.1 + 0.2, 0.7, 103.3], [1.1, 2.3, 105.7])]);
}
// Under a slope it is a slant, in the box around it. Under a slope and a level - the plane of a
// top that leaves its box halfway, at x = 4 - it is cut there: a box, and after it a slant.
assert.deepEqual(fill([ground], [falls]), [slanted([2, 15, 103], [6, 17, 106], 0, ground, falls)]);
assert.deepEqual(fill([ground], [[108, 104], lid]), [
  boxed([2, 15, 103], [4, 17, 106]),
  slanted([4, 15, 103], [6, 17, 106], 0, ground, falls),
]);
// Where two tops cross - at x = 4, both 105 m - a piece on either side, each under the lower.
assert.deepEqual(fill([ground], [falls, rises]), [
  slanted([2, 15, 103], [4, 17, 105], 0, ground, [104, 105]),
  slanted([4, 15, 103], [6, 17, 105], 0, ground, [105, 104]),
]);
// Where a bottom rises to meet the top - at x = 5, both 104.5 m - it comes down to an edge
// there, and nothing lies beyond. A top that comes down to the bottom at the end, too; and a
// bottom that rises to a level top is a slant as well, not a box.
assert.deepEqual(fill([[103, 105]], [falls]), [
  slanted([2, 15, 103], [5, 17, 106], 0, [103, 104.5], [106, 104.5]),
]);
assert.deepEqual(fill([ground], [[106, 103]]), [
  slanted([2, 15, 103], [6, 17, 106], 0, ground, [106, 103]),
]);
assert.deepEqual(fill([rises], [lid]), [slanted([2, 15, 104], [6, 17, 106], 0, rises, lid)]);
// A roof a quarter thick under a top that falls from 105 m to the floor of its block, over a
// floor slab of a quarter: its soffit meets the slab at x = 5, at 103.25 m, and from there the
// roof lies on the slab, until the top meets the slab too, at x = 5.5. Beyond that, nothing.
const slab = [103.25, 103.25];
assert.deepEqual(fill([[104.75, 102.75], slab], [[105, 103]]), [
  slanted([2, 15, 103.25], [5, 17, 105], 0, [104.75, 103.25], [105, 103.5]),
  slanted([5, 15, 103.25], [5.5, 17, 103.5], 0, slab, [103.5, 103.25]),
]);
// Across the plot the rectangle is cut along y: a top that rises from the ground, 2 m with
// every metre, leaves its box at y = 16.5.
assert.deepEqual(fill([ground], [[103, 107], lid], 1), [
  slanted([2, 15, 103], [6, 16.5, 106], 1, ground, [103, 106]),
  boxed([2, 16.5, 103], [6, 17, 106]),
]);
// The fewest: lines that cross under the highest bottom cut nothing, and a line said twice
// is one. And nothing is left where no bottom lies under a top.
const crossed = [[100, 102], [102, 100], ground];
assert.deepEqual(fill(crossed, [lid]), [boxed([2, 15, 103], [6, 17, 106])]);
assert.equal(fill([ground, ground], [falls, falls]).length, 1);
assert.deepEqual(fill([lid], [[104, 105]]), []);
// A hair apart is nothing: a top half a hair over its bottom, a rectangle half a hair long.
// Four hairs are something. And a top that dips half a hair under its bottom at its very end,
// or at its very beginning, is one piece from end to end: no sliver is cut off it.
const [half, four] = [HAIR_M / 2, 4 * HAIR_M];
assert.deepEqual(fill([ground], [[103 + half, 103 + half]]), []);
assert.deepEqual(filled({ min: [2, 15], max: [2 + half, 17] }, 0, [ground], [lid]), []);
assert.equal(fill([ground], [[103 + four, 103 + four]]).length, 1);
for (const dips of [
  [106, 103 - half],
  [103 - half, 106],
]) {
  assert.deepEqual(fill([ground], [dips]), [slanted([2, 15, 103], [6, 17, 106], 0, ground, dips)]);
}

// A SOLID says the top of its block, as `topOf` gives it, and its box is its box still: the
// outer size. A level block is the solid it was, and says none.
const SOLID = { colour: '#8795a1', floor: 103, see: 'solid' };
const [first, second, third] = scene.solids;
const sloping = { min: [2, 15, 103], max: [6, 17, 106], top: { along: 0, high: [106, 104] } };
assert.deepEqual(first, { ...SOLID, ...sloping, name: 'Shed', block: 1 });
const leaning = { min: [6, 15, 103], max: [10, 17, 106], top: { along: 1, high: [104, 106] } };
assert.deepEqual(second, { ...SOLID, ...leaning, block: 4 });
assert.deepEqual(third, {
  ...SOLID,
  min: [10, 15, 103],
  max: [14, 17, 106],
  name: 'Level',
  block: 2,
});
assert.equal(scene.solids.length, 3);
// And with no top anywhere, the scene is the scene but for that one word of two solids.
const untopped = (thing) =>
  Object.fromEntries(Object.entries(thing).filter(([key]) => key !== 'top'));
const flat = sceneOf(site, things.map(untopped));
assert.deepEqual(scene.solids.map(untopped), flat.solids);
for (const key of ['levels', 'ground', 'outline', 'box']) assert.deepEqual(scene[key], flat[key]);
assert.deepEqual([scene.levels, scene.box.max], [[103], [20, 20, 106]]);

// THE RULE'S PARTS, by hand. The shed: its floor; a wall from the floor's slab up to the top,
// 106 m down to 104 m; a roof whose soffit lies a quarter under the top. The lean-to: its top
// lies at 104 m over the face at y = 15 and at 104.25 m a quarter of a metre in - a wall up to
// there, and a roof from there up to 106 m. The level block: three boxes, as it ever was.
const [floor, wall, roof] = ['floor wood', 'wall plaster', 'roof concrete'];
const part = (thing, said, shape) => {
  const [of, surface] = said.split(' ');
  return { of, ...shape, surface, thing, floor: 103 };
};
assert.deepEqual(scene.parts, [
  part(0, floor, boxed([2, 15, 103], [6, 17, 103.25])),
  part(0, wall, slanted([2, 15, 103.25], [6, 15.25, 106], 0, slab, falls)),
  part(0, roof, slanted([2, 15.25, 103.75], [6, 17, 106], 0, [105.75, 103.75], falls)),
  part(1, floor, boxed([6, 15, 103], [10, 17, 103.25])),
  part(1, wall, slanted([6, 15, 103.25], [10, 15.25, 104.25], 1, slab, [104, 104.25])),
  part(1, roof, slanted([6, 15.25, 104], [10, 17, 106], 1, [104, 105.75], [104.25, 106])),
  part(2, floor, boxed([10, 15, 103], [14, 17, 103.25])),
  part(2, wall, boxed([10, 15, 103.25], [14, 15.25, 106])),
  part(2, roof, boxed([10, 15.25, 105.75], [14, 17, 106])),
]);
// What `filled` gives is what parts.js says a part is, and holds what holds of every part.
assert.deepEqual(amiss(scene), []);

// AND A SLANT IS what parts.js says one is: each thing it is not, in a sentence of its own.
// The shed's wall with one thing wrong at a time, and its floor, a box that says a bottom.
const SAYS = 'says of a slant what it should not, or not what it should:';
for (const [at, change, words] of [
  [1, { along: 2 }, `${SAYS} along, low, high`],
  [1, { low: [103.25] }, `${SAYS} along, low, high`],
  [1, { high: undefined }, `${SAYS} along, low, high`],
  [0, { low: [103, 103] }, `${SAYS} low`],
  [1, { low: [103.25, 104.5] }, 'has its bottom over its top'],
  [1, { low: [106, 104], min: [2, 15, 104] }, 'is nowhere higher than a hair'],
  [1, { high: [106, 106] }, 'is level above and below, and says no box'],
  [1, { max: [6, 15.25, 105.5] }, 'has not the box around it'],
]) {
  const parts = scene.parts.map((one, place) => (place === at ? { ...one, ...change } : one));
  const named = `part ${at}, a ${parts[at].of} of thing 0,`;
  assert.deepEqual(amiss({ ...scene, parts }), [`${named} ${words}`]);
}
// A slant that slopes along another extent than the top of its block, or than another slant,
// is asked by its box, as what is round is. A beam in the shed that slopes across the plot,
// a quarter of a metre under the roof's soffit at the least: it lies in the roof's box, and
// is found. Raised until its high end lies at 105.875 m - over the top, which is 105.5 m where
// the beam ends - it is found there too, though read along the plot its two figures would
// lie under the top's own.
const beam = (high) => {
  const shape = slanted([2, 16, 104], [3, 17, Math.max(...high)], 1, [104, 104.5], high);
  return amiss({ ...scene, parts: [...scene.parts, part(0, 'frame metal', shape)] });
};
const INTO =
  'part 2, a roof of thing 0, of concrete, and part 9, a frame of thing 0, of metal, lie in each other';
assert.deepEqual(beam([104.5, 105]), [INTO]);
const RISES = 'part 9, a frame of thing 0, rises over the top of its block';
assert.deepEqual(beam([105.875, 105.375]), [RISES, INTO]);

process.stdout.write(
  'tools/sketch/scene: a top that slopes is said in metres, turned over across the plot, and what lies under it is the fewest boxes and slants that fill it\n',
);
