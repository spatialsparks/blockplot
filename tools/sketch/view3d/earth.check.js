// The check of the shaped ground as the 3D view reads it (story ST-027): the pad's own scripts -
// the ones 3d.html names, in its order - on the made-up plot, with a sketch of this check's own
// in a made-up store: a room; a garden, open air by its name; against the garden's downhill edge
// a block that is set to ground, its top at the garden's floor; and a tree on the ground in the
// middle of that block. Against figures worked out by hand: `read` hands on every thing but the
// block of ground, and the plot with the grid that the paper holds, the very one; the tree
// stands on the block's top; the scene has no solid, no part and no level of that block, ground
// in every cell of it, and the outline where it lay; and the garden has no railing along the
// edge that the ground was brought up to. Then the sketch is kept anew, as another window keeps
// it, and read again: the block's top a metre lower; the block taken out; the block off the
// plot, where it shapes nothing and is no thing all the same; drawn as two boxes that are
// ground by their block's name; what is no sketch; and the block set to a room - a box in a
// pit, as before the story. Reading writes nothing. And of main.js, which no check loads, the
// text: it builds its scene of the plot that `read` gave. No browser, and nothing of the real
// site: site.js is never read. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { amiss } from '../scene/holds.js';
import { RAIL_M, STEP_M } from '../scene/open.js';
import { sceneOf } from '../scene/scene.js';

// The made-up plot's ground is a plane (docs/sketch/pad-gotchas.md): at column c and row r of the
// top view's paper it lies at 820 - 0.1 c - 0.02 r m. A column is x = c / 2 - 4, a row of the
// top view y = 28 - r / 2, and a row of a standing view lies at 826 - row / 2 m.
//
// The sketch, as the pad keeps one. A room of 5 m by 4 m, on a floor in row 24: at 814 m. A
// garden of 4 m by 4 m and a metre high, on a floor at 814 m too. Against its edge down the
// plot, column 58, a block of 4 m by 4 m that is set to ground, from row 28 up to row 24: its
// top lies at 814 m, where the hill lies at 813.48 m at its uphill corner up the paper -
// 820 - 5.8 - 0.72 - and at 812.52 m at the corner across from it. And a tree on the ground,
// its middle in the middle of that block: at column 62 and row 40 the hill lies at
// 820 - 6.2 - 0.8 = 813 m. The block of ground is the second thing, before the garden and the
// tree: what is handed on of the two has another place than in the sketch.
const ROOM = { x: [30, 40], y: [20, 28], z: [18, 24], colour: 2, name: 'Room' };
const GARDEN = { x: [50, 58], y: [36, 44], z: [22, 24], colour: 4, name: 'Garden' };
const LAWN = { x: [58, 66], y: [36, 44], z: [24, 28], colour: 9, name: 'Lawn', is: 'ground' };
const TREE = { kind: 'tree', x: 62, y: 40, floor: 'ground' };
const KEY = 'blockplot/sketch/space';
const asKept = (things) => JSON.stringify({ space: 6, things, floors: [], notes: [], on: {} });

// A browser's two stores, with the sketch where the pad keeps it, and what the pad's scripts
// ask of the page beside them. Whatever is written into a store is noted: reading writes none.
const kept = new Map([[KEY, asKept([ROOM, LAWN, GARDEN, TREE])]]);
const written = [];
const store = { getItem: (key) => kept.get(key) ?? null, setItem: (key) => written.push(key) };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
globalThis.location = { hash: '' };
globalThis.views = { seen: {}, keep() {} };

// The scripts the page loads before its module, read off the page, as made-up.check.js loads
// them: the site first, which is the made-up plot's here, and the switch of views last, which
// wants a page and is made up above. Among them are the paper, which holds the ground, and the
// rule that shapes it: read.js names the first alone.
const pad = path.join(import.meta.dirname, '..');
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual([scripts[0], scripts.at(-1)], ['site.js', 'views.js']);
for (const needed of ['paper.js', 'blocks.js', 'earth.js', 'sketch.js']) {
  assert.ok(scripts.includes(needed), needed);
}
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { read, site } = await import('./read.js');
const { SITE, paper } = globalThis;
// The site that the module hands out is the pad's own, and stays so: the very object.
assert.equal(site, SITE);
assert.equal(site.name, 'Made-up hillside plot');

// Numbers that went through the ground's heights are compared to a millionth of a cell, and
// two figures of a part that were worked out in two ways to a hair.
const near = (actual, expected, what, hair = 1e-6) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < hair, `${what}: ${actual}`),
  );
};
/** How many cells of a box, seen from above, have ground drawn in a scene. */
const groundIn = ({ ground }, { x, y }) =>
  ground.drawn
    .slice(y[0], y[1])
    .flatMap((cells) => cells.slice(x[0], x[1]))
    .filter(Boolean).length;
/** How many cells of the whole paper have none. */
const cut = ({ ground }) => ground.drawn.flat().filter((there) => !there).length;
/** The parts of a scene that lie in the box of the block of ground: 25 to 29 m down the plot, 6 to 10 m across it, from 812 m up to 814 m. */
const inLawn = ({ parts }) =>
  parts.filter(
    ({ min, max }) =>
      min[0] < 29 && max[0] > 25 && min[1] < 10 && max[1] > 6 && min[2] < 814 && max[2] > 812,
  );
/** The railings along the garden's edge down the plot, x = 25 m: `RAIL_M` thick, inward of it. */
const downhill = ({ parts }) =>
  parts.filter(
    ({ of, min, max }) => of === 'rail' && Math.abs(max[0] - 25) + Math.abs(min[0] - 24.95) < 1e-9,
  );
assert.equal(RAIL_M, 0.05);
/**
 * One railing along that whole edge, by hand: from y = 28 - 44 / 2 = 6 m to 28 - 36 / 2 = 10 m,
 * on the garden's slab, 814.3 m, and up to the top of its block, 815 m - lower than a railing
 * of a metre would end.
 */
function railed(scene, what) {
  const rails = downhill(scene);
  assert.equal(rails.length, 1, what);
  near([...rails[0].min, ...rails[0].max], [24.95, 6, 814.3, 25, 10, 815], what, 1e-9);
}

// --- as the page opens ---------------------------------------------------------------------------
// Three things are handed on of the four, in their order, each as ever - its box, its colour by
// name and by hex, its name, and what it counts as: the room, a room; the garden, open air by
// its name; and the tree. None is the block of ground, and none says the word: of that block
// the scene is handed nothing.
const { things, figures, trouble, locked, land } = read();
assert.deepEqual([trouble, locked], ['', '']);
const [room, garden, tree] = things;
assert.equal(things.length, 3);
assert.deepEqual(room, { ...ROOM, colour: { name: 'orange', hex: '#f08c00' }, as: 'room' });
assert.deepEqual(garden, { ...GARDEN, colour: { name: 'green', hex: '#5a9e4b' }, as: 'open' });
assert.ok(things.every((thing) => thing.as !== 'ground' && thing.name !== 'Lawn'));
// The plot it is handed with them is the pad's own site with one thing more, the ground as
// heights: the grid that the paper holds, the very one, which has 814 m at the tree - and at
// the block's corners, where the hill has 813.48 m and 812.52 m. The pad's own site says no
// such grid, and is not changed.
const { heights: first, ...beside } = land.ground;
assert.equal(first, paper.shaped());
assert.deepEqual([first[40][62], first[36][58], first[44][66]], [814, 814, 814]);
const hillAt = [paper.realAt(62, 40), paper.realAt(58, 36), paper.realAt(66, 44)];
near(hillAt, [813, 813.48, 812.52], 'the hill under the block of ground');
assert.notEqual(land, SITE);
assert.deepEqual([{ ...land, ground: SITE.ground }, beside], [SITE, SITE.ground]);
assert.equal(Object.hasOwn(SITE.ground, 'heights'), false);
// The tree, 6 m by 6 m and 8 m high, stands on the shaped ground: its floor is row 24, the top
// of the block, where the hill alone has it in row 2 * (826 - 813) = 26. It is 16 rows high.
assert.deepEqual([tree.kind, tree.x, tree.y], ['tree', [56, 68], [34, 46]]);
near([tree.floor, ...tree.z], [24, 8, 24], 'the tree on the block of ground');

// The scene of them, as the page builds it. Three solids, and one level: both floors lie at
// 814 m, and the block of ground, whose foot lies at 812 m, gives none. A place is a place of
// the scene, and none in the sketch: the garden's floor is of thing 1 and the tree - a trunk
// and a crown - of thing 2, where the sketch has them third and fourth; and no part is of a
// fourth thing. No part lies in the block's box. Ground is drawn in all 8 * 8 cells of it, and
// in none of the garden's: the hill is cut out under the room's 10 * 8 cells and the garden's
// 8 * 8, and nowhere else.
const scene = sceneOf(land, things, figures);
assert.equal(scene.ground.heights, first);
const called = scene.solids.map(({ name, kind }) => name ?? kind);
assert.deepEqual([called, scene.levels], [['Room', 'Garden', 'tree'], [814]]);
const partsOf = (at) => scene.parts.filter((part) => part.thing === at);
const shapes = (at) => partsOf(at).map((part) => part.shape);
assert.ok(partsOf(1).some((part) => part.of === 'floor'));
assert.deepEqual([shapes(2).sort(), partsOf(3)], [['ball', 'round'], []]);
assert.deepEqual(inLawn(scene), []);
assert.deepEqual([groundIn(scene, LAWN), groundIn(scene, GARDEN)], [64, 0]);
assert.equal(cut(scene), 10 * 8 + 8 * 8);
// The garden's floor is 0.3 m thick, as the figures say: one stands at 814.3 m. Along its edge
// down the plot the ground is the block's top, 814 m at all nine grid points: 0.3 m under the
// floor, less than a step - no railing along that edge. And nothing is amiss of the parts.
assert.deepEqual([figures.floorSlabM, figures.railingHighM, STEP_M], [0.3, 1, 0.5]);
assert.deepEqual(
  first.slice(36, 45).map((line) => line[58]),
  Array(9).fill(814),
);
assert.deepEqual(downhill(scene), []);
assert.deepEqual(amiss(scene), []);

// --- the block's top a metre lower ---------------------------------------------------------------
// Kept anew with its top in row 26, at 813 m, and read again: the ground is the new one, in a
// grid of its own - the grid of before is as it was. The hill is cut down to it at the block's
// uphill corner and filled up to it at the corner across; the tree stands in row 26; and the
// garden's floor now lies 1.3 m over the ground along that edge: a railing, along all of it.
kept.set(KEY, asKept([ROOM, { ...LAWN, z: [26, 28] }, GARDEN, TREE]));
const lower = read(true);
const second = lower.land.ground.heights;
assert.equal(second, paper.shaped());
assert.notEqual(second, first);
assert.deepEqual([second[40][62], second[36][58], second[44][66]], [813, 813, 813]);
assert.deepEqual([first[40][62], first[36][58], first[44][66]], [814, 814, 814]);
near([lower.things[2].floor, ...lower.things[2].z], [26, 10, 26], 'the tree, a metre lower');
railed(sceneOf(lower.land, lower.things, lower.figures), 'the railing over the lower ground');

// --- the block taken out of the sketch ------------------------------------------------------------
// Read again with no block of ground: every thing is handed on, the room and the garden as
// they were, and the plot is the pad's own site, the very object - the paper holds no grid.
kept.set(KEY, asKept([ROOM, GARDEN, TREE]));
const bare = read(true);
assert.equal(bare.land, SITE);
assert.deepEqual([bare.things.length, paper.shaped()], [3, null]);
assert.deepEqual(bare.things.slice(0, 2), [room, garden]);
// The tree stands on the hill, in row 26, and the scene is the hill's: 813 m at the tree. The
// outline lies where it lay with the block of ground, number for number, at every one of its
// points - on the outline the shaped ground is the site's own. And the same cells are cut out.
near([bare.things[2].floor, ...bare.things[2].z], [26, 10, 26], 'the tree on the hill');
const hill = sceneOf(bare.land, bare.things, bare.figures);
near([hill.ground.heights[40][62]], [813], 'the hill at the tree');
// The outline has a point at each corner and wherever a side crosses a line of the grid. Four
// of its sides run along such lines, 34, 68, 28 and 34 cells long; the two askew ones cross
// 13 columns and 11 rows, and 19 and 5, each of them once through a grid point: 24 points each.
assert.equal(hill.outline.length, 34 + 68 + 28 + 34 + 2 * 24);
assert.deepEqual(scene.outline, hill.outline);
assert.deepEqual([hill.solids.length, hill.levels, cut(hill)], [3, [814], 10 * 8 + 8 * 8]);
// Along the garden's edge down the plot the hill lies at 820 - 5.8 - 0.02 * 36.5 = 813.47 m
// at the middle of the first cell's edge, 0.83 m under the floor, and lower with every row, to
// 0.97 m under it at the last: more than a step at all eight cells, where the block of ground
// left 0.3 m. One railing along the whole edge - and nothing is amiss here either.
assert.ok(0.3 < STEP_M && STEP_M < 0.83);
railed(hill, 'the railing over the hill');
assert.deepEqual(amiss(hill), []);

// --- a block of ground off the plot ---------------------------------------------------------------
// Drawn outside the outline - its nearest corner lies at column 12 and row 10 - the block
// shapes nothing, and the plot is the pad's own site. It is no thing of the scene all the
// same: the things are those of the sketch without it, and ground is drawn in all its cells.
const far = { ...LAWN, x: [0, 8], y: [0, 8] };
kept.set(KEY, asKept([ROOM, far, GARDEN, TREE]));
const outside = read(true);
assert.equal(outside.land, SITE);
assert.deepEqual(outside.things, bare.things);
assert.equal(groundIn(sceneOf(outside.land, outside.things, outside.figures), far), 64);

// --- two boxes, ground by their block's name ------------------------------------------------------
// The same ground from a block of two boxes side by side, one `group`: the first is named
// "Ground fill", and neither says what it counts as. The pad reads the block as ground by its
// name, and the second box with it: none of the two is handed on. The ground is the first
// one's, number for number, in a grid of its own.
const filled = (x, more) => ({ x, y: [36, 44], z: [24, 28], colour: 9, group: 5, ...more });
const halves = [filled([58, 62], { name: 'Ground fill' }), filled([62, 66])];
kept.set(KEY, asKept([ROOM, halves[0], GARDEN, TREE, halves[1]]));
const named = read(true);
assert.deepEqual(named.things, things);
assert.equal(named.land.ground.heights, paper.shaped());
assert.notEqual(named.land.ground.heights, first);
assert.deepEqual(named.land.ground.heights, first);

// --- what is no sketch ----------------------------------------------------------------------------
// Then the other window keeps what cannot be read. Nothing of it is drawn, and the ground is
// the site's own: the plot is the pad's own site again, though the pad's scripts hold the
// sketch they held, with its block of ground.
const held = globalThis.sketch.doc;
kept.set(KEY, 'no sketch');
const none = read(true);
assert.equal(none.land, SITE);
assert.deepEqual([none.things, paper.shaped()], [[], null]);
assert.match(none.trouble, /cannot be read/);
assert.equal(globalThis.sketch.doc, held);

// --- the block set to a room ----------------------------------------------------------------------
// With the block set to a room, all four things are handed on, in the order of the sketch,
// and the plot is the pad's own site: a box in a pit, as before the story. Its solid stands
// from 812 m up to 814 m, 25 to 29 m down the plot and 6 to 10 m across it; it gives a level
// of its own and has parts; no ground is drawn in its 64 cells; and the tree stands on the
// hill, in row 26.
kept.set(KEY, asKept([ROOM, { ...LAWN, is: 'room' }, GARDEN, TREE]));
const boxed = read(true);
const handed = boxed.things.map(({ name, kind }) => name ?? kind);
assert.deepEqual([handed, boxed.things[1].as], [['Room', 'Lawn', 'Garden', 'tree'], 'room']);
assert.equal(boxed.land, SITE);
near([boxed.things[3].floor], [26], 'the tree, on the hill again');
const pit = sceneOf(boxed.land, boxed.things, boxed.figures);
assert.deepEqual([pit.solids.length, pit.levels], [4, [814, 812]]);
const { min, max } = pit.solids[1];
near([...min, ...max], [25, 6, 812, 29, 10, 814], 'the box in its pit', 1e-9);
assert.deepEqual([groundIn(pit, LAWN), cut(pit)], [0, 10 * 8 + 8 * 8 + 8 * 8]);
assert.ok(inLawn(pit).some((part) => part.thing === 1 && part.of === 'floor'));

// Reading wrote nothing, into neither store.
assert.deepEqual(written, []);

// main.js wants a page and three.js, and no check loads it: of it the text alone is held. It
// builds a scene in one place, of what `read` gave as `land` - and not of the site.
const main = readFileSync(path.join(pad, 'view3d', 'main.js'), 'utf8');
const builtOf = [...main.matchAll(/\bsceneOf\s*\(\s*(\w+)/g)].map(([, plot]) => plot);
assert.deepEqual(builtOf, ['land']);
assert.match(main, /\bconst \{[^}]*\bland\b[^}]*\} = read\(again\);/);

process.stdout.write(
  'tools/sketch/view3d: a block of ground is handed on as the ground it shapes, the very grid of the paper, and as no thing: no solid, no part, no level and no pit, with what stands on the ground on it and no railing where it meets a floor\n',
);
