// The check of a cut and of a picked category as the 3D view reads them (story ST-028): the
// pad's own scripts - the ones 3d.html names, in its order - on the made-up plot, with a sketch
// of this check's own in a made-up store: a room; against its side a cut, by what its box says;
// a second cut by the category that was picked for it; a third, of two boxes, by its name; and
// a block with no name whose category is `balcony`. Against figures worked out by hand: `read`
// hands on the room and that block - the block as open air and under the name of its category,
// for a pick reaches the scene as that and no more - and no box of a cut. So the scene has no
// solid, no part and no level of a cut, and ground in every cell of each. Then the sketch is
// kept anew, as another window keeps it, and read again: a cut that is set to a room, and one
// that is set to open air against its category, are handed on as those. And the ground under a
// cut (T-028.4), on the room and the garden of earth.check.js: a cut against the room's side,
// down to the room's floor, one against the garden's uphill edge, a metre under its floor, and
// a tree in the first. The plot that `read` hands on is the paper's very grid, with both floors
// in it: against the room the ground is its floor, where the hill stood up its wall; the tree
// stands on it; no part of a house is where a cut is; and the garden has a railing where the
// ground was cut away beside it, and none without the cuts. Reading writes nothing. No browser,
// and nothing of the real site: site.js is never read. Run by tools/sketch/check.js, as every
// *.check.js is.
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
// The sketch, as the pad keeps one. A room of 5 m by 4 m, on a floor in row 24: at 814 m.
// Against its side across the plot, row 28 of the top view, a cut of 5 m by 3 m that says so
// itself: its floor lies in row 26, at 813 m, where the hill lies at 820 - 3 - 0.56 = 816.44 m
// at the room's uphill corner - a block drawn over the earth beside the house, down to the
// floor that is wanted. Two more of that height and that floor, further down the plot: one that
// says `ground-cut` for its category, and one of two boxes, a `group`, of which the first is
// named "Ground cut" and the second says nothing. And 4 m across the plot from the room a block
// of 5 m by 4 m and a metre high, on a floor at 814 m, with no name: its category is `balcony`.
// The cuts stand between the other two in the sketch: what is handed on has other places.
const ROOM = { x: [30, 40], y: [20, 28], z: [18, 24], colour: 2, name: 'Room' };
const SAID = { x: [30, 40], y: [28, 34], z: [20, 26], colour: 8, is: 'cut' };
const PICKED = { x: [44, 50], y: [20, 28], z: [20, 26], colour: 8, category: 'ground-cut' };
const NAMED = [
  { x: [54, 58], y: [20, 28], z: [20, 26], colour: 8, group: 3, name: 'Ground cut' },
  { x: [58, 62], y: [20, 28], z: [20, 26], colour: 8, group: 3 },
];
const BALCONY = { x: [30, 40], y: [36, 44], z: [22, 24], colour: 4, category: 'balcony' };
const CUTS = [SAID, PICKED, ...NAMED];
const KEY = 'blockplot/sketch/space';
const asKept = (things) => JSON.stringify({ space: 6, things, floors: [], notes: [], on: {} });

// A browser's two stores, with the sketch where the pad keeps it, and what the pad's scripts
// ask of the page beside them. Whatever is written into a store is noted: reading writes none.
const kept = new Map([[KEY, asKept([ROOM, SAID, PICKED, BALCONY, ...NAMED])]]);
const written = [];
const store = { getItem: (key) => kept.get(key) ?? null, setItem: (key) => written.push(key) };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
globalThis.location = { hash: '' };
globalThis.views = { seen: {}, keep() {} };

// The scripts the page loads before its module, read off the page, as earth.check.js loads
// them: the site first, which is the made-up plot's here, and the switch of views last, which
// wants a page and is made up above. Among them is the list of the categories, in the line
// before the script that asks it what a block counts as.
const pad = path.join(import.meta.dirname, '..');
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual([scripts[0], scripts.at(-1)], ['site.js', 'views.js']);
assert.equal(scripts[scripts.indexOf('blocks.js') - 1], 'categories.js');
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { read, site } = await import('./read.js');
assert.equal(site.name, 'Made-up hillside plot');
const { blocks, paper, sketch } = globalThis;

/** How many cells of a box, seen from above, have ground drawn in a scene. */
const groundIn = ({ ground }, { x, y }) =>
  ground.drawn
    .slice(y[0], y[1])
    .flatMap((cells) => cells.slice(x[0], x[1]))
    .filter(Boolean).length;
/** The parts of a scene that lie in a box of the sketch, with any of themselves: a column is x = c / 2 - 4 m, a row y = 28 - r / 2 m, a row of a standing view 826 - row / 2 m. */
const partsIn = ({ parts }, { x, y, z }) =>
  parts.filter(
    ({ min, max }) =>
      min[0] < x[1] / 2 - 4 &&
      max[0] > x[0] / 2 - 4 &&
      min[1] < 28 - y[0] / 2 &&
      max[1] > 28 - y[1] / 2 &&
      min[2] < 826 - z[0] / 2 &&
      max[2] > 826 - z[1] / 2,
  );

// --- as the page opens ---------------------------------------------------------------------------
// The pad reads each of the three as a cut - by `is`, by its category, by its name, the second
// box of the third with its block - and the block with no name as open air, by its category.
const counted = (thing) => Object.values(blocks.countsAs(sketch.blockOf(thing))).join(' by ');
assert.deepEqual(sketch.doc.things.map(counted), [
  'room by name',
  'cut by is',
  'cut by category',
  'open by category',
  'cut by name',
  'cut by name',
]);
// Two things are handed on of the six, in their order: the room, a room, and the block with no
// name - its box, its colour by name and by hex, what it counts as, open air, and for its name
// that of its category, "Balcony" (T-028.6). The key of its category is not handed on: the scene
// learns of none. No box of a cut is among them, and none says the word.
const { things, figures, trouble, locked, land } = read();
assert.deepEqual([trouble, locked, things.length], ['', '', 2]);
const [room, balcony] = things;
assert.deepEqual(room, { ...ROOM, colour: { name: 'orange', hex: '#f08c00' }, as: 'room' });
const { category, ...box } = BALCONY;
assert.deepEqual(balcony, {
  ...box,
  colour: { name: 'green', hex: '#5a9e4b' },
  name: 'Balcony',
  as: 'open',
});
assert.deepEqual([category, things.filter((thing) => thing.as === 'cut')], ['balcony', []]);

// The scene of them, as the page builds it. Two solids - the room, and the green block with no
// name - and one level: both floors lie at 814 m, and the cuts, whose floors lie at 813 m, give
// none. A place is a place of the scene, and none in the sketch: the block with no name is
// thing 1, where the sketch has it fourth, and no part is of a third thing. The room has
// floors, walls and a roof; that block is open air, a floor with neither. No part lies in the
// box of a cut - the room's wall stands against the first one, inside the room's own box.
// Ground is drawn in every cell of each cut - 10 * 6, 6 * 8 and twice 4 * 8 - and in none
// of the room's or of the open floor's.
const scene = sceneOf(land, things, figures);
const called = scene.solids.map(({ name, colour }) => name ?? colour);
assert.deepEqual([called, scene.levels], [['Room', 'Balcony'], [814]]);
const partsOf = (at) => scene.parts.filter((part) => part.thing === at);
const built = (at) => [...new Set(partsOf(at).map((part) => part.of))].sort();
assert.deepEqual(built(0), ['floor', 'roof', 'wall']);
assert.ok(built(1).includes('floor') && !built(1).includes('wall') && !built(1).includes('roof'));
assert.deepEqual([partsOf(2), scene.parts.length], [[], partsOf(0).length + partsOf(1).length]);
for (const cut of CUTS) assert.deepEqual(partsIn(scene, cut), [], JSON.stringify(cut));
assert.ok(partsIn(scene, ROOM).length > 0 && partsIn(scene, BALCONY).length > 0);
assert.deepEqual(
  CUTS.map((cut) => groundIn(scene, cut)),
  [60, 48, 32, 32],
);
assert.deepEqual([groundIn(scene, ROOM), groundIn(scene, BALCONY)], [0, 0]);
assert.deepEqual(amiss(scene), []);

// --- set by hand ---------------------------------------------------------------------------------
// Kept anew with the first cut set to a room, and the second set to open air against its
// category, as the key C sets them: both are handed on, in the order of the sketch, as what
// they are set to - a box in the hill, and a floor at 813 m. The scene has four solids, and a
// second level; the cut of two boxes is no thing of it still.
kept.set(
  KEY,
  asKept([ROOM, { ...SAID, is: 'room' }, { ...PICKED, is: 'open' }, BALCONY, ...NAMED]),
);
const set = read(true);
assert.deepEqual(
  set.things.map((thing) => thing.as),
  ['room', 'room', 'open', 'open'],
);
assert.deepEqual([set.things[1].z, set.things[2].x], [SAID.z, PICKED.x]);
const anew = sceneOf(set.land, set.things, set.figures);
assert.deepEqual([anew.solids.length, anew.levels], [4, [814, 813]]);
assert.ok(partsIn(anew, SAID).length > 0 && partsIn(anew, PICKED).length > 0);
for (const cut of NAMED) assert.deepEqual(partsIn(anew, cut), []);
assert.deepEqual(
  [groundIn(anew, SAID), groundIn(anew, PICKED), groundIn(anew, NAMED[0])],
  [0, 0, 32],
);

// --- the ground under a cut ----------------------------------------------------------------------
// Kept anew: the room, and the garden of earth.check.js - open air by its name, 4 m by 4 m and a
// metre high, on a floor at 814 m as the room's is. Against the room's side up the paper, row
// 20, a cut that says so itself: its floor lies in row 24, at 814 m, the room's own, under a
// hill of 820 - 3 - 0.28 = 816.72 m at its uphill corner and of 820 - 4 - 0.4 = 815.6 m at the
// one across. Against the garden's uphill edge, column 50, a cut by its category: its floor
// lies in row 26, at 813 m, a metre under the garden's, where the hill meets that edge at
// 820 - 5 - 0.72 = 814.28 m to 814.12 m. And a tree on the ground in the first cut, at column
// 35 and row 17, where the hill lies at 820 - 3.5 - 0.34 = 816.16 m: row 19.68.
const GARDEN = { x: [50, 58], y: [36, 44], z: [22, 24], colour: 4, name: 'Garden' };
const BESIDE = { x: [30, 40], y: [14, 20], z: [16, 24], colour: 1, is: 'cut' };
const UPHILL = { x: [44, 50], y: [36, 44], z: [20, 26], colour: 1, category: 'ground-cut' };
const TREE = { kind: 'tree', x: 35, y: 17, floor: 'ground' };
/** What `read` hands on of some things kept anew, with the scene of it as the page builds it. */
function readAgain(things) {
  kept.set(KEY, asKept(things));
  const again = read(true);
  return { ...again, scene: sceneOf(again.land, again.things, again.figures) };
}
const titled = ({ name, kind }) => name ?? kind;
/** The heights of a grid at the grid points that a box reaches, its edges included. */
const reach = (heights, { x, y }) =>
  heights.slice(y[0], y[1] + 1).flatMap((line) => line.slice(x[0], x[1] + 1));
/** The railings along the garden's edge up the plot, x = 50 / 2 - 4 = 21 m, `RAIL_M` thick and inward of it: each from corner to corner. */
const uphill = ({ parts }) =>
  parts
    .filter(({ of, min, max }) => of === 'rail' && Math.hypot(min[0] - 21, max[0] - 21.05) < 1e-9)
    .map(({ min, max }) => [...min, ...max].map((value) => Number(value.toFixed(9))));

// Three things are handed on of the five, in their order - the room, as it was, the garden, open
// air, and the tree - and no box of a cut. The plot that is handed on with them says `heights`,
// the paper's very grid: 814 m at the 11 * 7 grid points that the first cut reaches, its edges
// included, and 813 m at the 7 * 9 of the second - the hill lies over both floors everywhere.
const dug = readAgain([ROOM, BESIDE, GARDEN, UPHILL, TREE]);
const { heights } = dug.land.ground;
assert.deepEqual(dug.things.map(titled), ['Room', 'Garden', 'tree']);
assert.deepEqual([dug.things[0], dug.things[1].as, dug.things[2].kind], [room, 'open', 'tree']);
assert.equal(heights, paper.shaped());
assert.deepEqual(reach(heights, BESIDE), Array(77).fill(814));
assert.deepEqual(reach(heights, UPHILL), Array(63).fill(813));
// THE WALL SHOWS DOWN TO THERE: along the room's side, row 20 from column 30 to column 40, the
// ground is 814 m, the room's floor - where the hill stood 2.6 m to 1.6 m up that wall. And the
// tree stands at it: its floor is row 24, and it is 16 rows high.
assert.deepEqual(heights[20].slice(30, 41), Array(11).fill(814));
assert.deepEqual([paper.realAt(30, 20), paper.realAt(40, 20)], [816.6, 815.6]);
assert.deepEqual([dug.things[2].floor, dug.things[2].z], [24, [8, 24]]);
// The scene has no solid, no part and no level of either cut: three solids, one level - the
// second cut's floor, at 813 m, gives none - and no part of a fourth thing. In the box of the
// second cut lies no part; in the first's the tree alone, its trunk and its crown. Ground is
// drawn in every cell of both, 10 * 6 and 6 * 8, and nothing is amiss.
assert.deepEqual(
  [dug.scene.solids.map(titled), dug.scene.levels],
  [['Room', 'Garden', 'tree'], [814]],
);
assert.deepEqual(
  dug.scene.parts.filter((part) => part.thing > 2),
  [],
);
const treeAlone = partsIn(dug.scene, BESIDE).map((part) => part.thing);
assert.deepEqual([treeAlone, partsIn(dug.scene, UPHILL)], [[2, 2], []]);
assert.deepEqual([groundIn(dug.scene, BESIDE), groundIn(dug.scene, UPHILL)], [60, 48]);
assert.deepEqual(amiss(dug.scene), []);
// The garden's floor is 0.3 m thick: one stands at 814.3 m, 1.3 m over the ground that was cut
// away along its uphill edge - more than a step. One railing along that whole edge, by hand:
// from y = 28 - 44 / 2 = 6 m to 28 - 36 / 2 = 10 m, on the slab, up to the top of its block.
assert.deepEqual([dug.figures.floorSlabM, STEP_M, RAIL_M], [0.3, 0.5, 0.05]);
assert.deepEqual(uphill(dug.scene), [[21, 6, 814.3, 21.05, 10, 815]]);

// The first cut's floor a metre up, in row 22: 815 m along the room's side, and under the tree.
// It gives no level, as it gave none at the room's own.
const higher = readAgain([ROOM, { ...BESIDE, z: [16, 22] }, GARDEN, UPHILL, TREE]);
assert.deepEqual(higher.land.ground.heights[20].slice(30, 41), Array(11).fill(815));
assert.deepEqual([higher.things[2].floor, higher.scene.levels], [22, [814]]);
// Both cuts taken out: the plot is the pad's own site, the very object, and the tree stands on
// the hill. Along the garden's uphill edge the hill meets its floor - 814.27 m at the middle of
// the first cell's edge and 814.13 m at the last, 0.03 m to 0.17 m under the slab's top, less
// than a step: no railing there.
const bare = readAgain([ROOM, GARDEN, TREE]);
assert.equal(bare.land, site);
assert.deepEqual([paper.shaped(), bare.things[2].floor.toFixed(6)], [null, '19.680000']);
assert.deepEqual([uphill(bare.scene), amiss(bare.scene)], [[], []]);
// The first cut set to a room: a solid again, the second of four, with a floor, walls and a
// roof, and no ground drawn in its 60 cells - a box in the hill, the tree on the hill inside it.
const walled = readAgain([ROOM, { ...BESIDE, is: 'room' }, GARDEN, UPHILL, TREE]);
const builtOf = new Set(walled.scene.parts.filter((part) => part.thing === 1).map(({ of }) => of));
assert.deepEqual([walled.things.map(titled)[1], walled.things[1].as], [undefined, 'room']);
assert.deepEqual([walled.scene.solids.length, [...builtOf].sort()], [4, ['floor', 'roof', 'wall']]);
assert.deepEqual(
  [groundIn(walled.scene, BESIDE), walled.things[3].floor.toFixed(6)],
  [0, '19.680000'],
);

// Reading wrote nothing, into neither store.
assert.deepEqual(written, []);

process.stdout.write(
  'tools/sketch/view3d: a cut is handed on no more than a block of ground - no solid, no part and no level, by what a box says, by its category or by its name - but as the ground that it takes away: the wall beside it shows down to its floor, and an open floor beside it has a railing; and a block whose category was picked is handed on as what it counts as, under the name of its category\n',
);
