// The check of the made-up sketch as the 3D page reads it: tests/__fixtures__/sketch/made-up.json
// in a made-up store, read by the pad's own scripts - the ones 3d.html names, in its order - on
// the made-up plot, and handed to the scene as the page hands it. The file is its file of
// version 3 with two tops that slope, a wide staircase, a lawn and a cut, by hand. The lawn is
// ground (story ST-027) and the cut a cut (ST-028): no thing of the scene, which is handed the
// plot with the ground that the two shape - the cut's is made-up-cut.check.js's. Of its parts the
// three things hold that hold of every part (scene/holds.js), with every rule of the scene there
// is: a rule that is added later is tried on this house too. Its blocks count as what the file
// says, its figures are the defaults by hand, and it becomes as many meshes as its parts have
// surfaces; by hand, its porch is glass under a sloping roof of glass, its bath a room under a
// sloping roof, the door into the bath ends under the bath's wall, and its wide staircase is
// sixteen steps under an open floor. Then the sketch is changed as another window changes it - a
// figure, and what a block counts as - and read again: the scene is built by what the sketch
// says now. No browser, nothing of the real site: site.js is never read. Run by check.js.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { asNow, golden } from '../check-golden.js';
import { partsShown } from '../scene/cut.js';
import { amiss } from '../scene/holds.js';
import { sceneOf } from '../scene/scene.js';
import { frameOf } from './frame.js';
import { meshesOf, stands } from './meshes.js';

const pad = path.join(import.meta.dirname, '..');
const SKETCH = golden('made-up');
const KEY = 'blockplot/sketch/space';
// A browser's two stores, with the sketch where the pad keeps it, and what the pad's scripts
// ask of the page beside them. Whatever is written into a store is noted: reading writes none.
const kept = new Map([[KEY, SKETCH]]);
const written = [];
const store = { getItem: (key) => kept.get(key) ?? null, setItem: (key) => written.push(key) };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
Object.assign(globalThis, { location: { hash: '' }, views: { seen: {}, keep() {} } });

// The scripts the page loads before its module, read off the page: the site first, which is the
// made-up plot's here - as the pad's server gives it on that plot - and the switch of views
// last, which wants a page and is made up above. Among them are the two that say what a block
// counts as and what the figures are, and earth.js: without it the paper shapes no ground.
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual([scripts[0], scripts.at(-1)], ['site.js', 'views.js']);
assert.ok(['figures.js', 'blocks.js', 'earth.js', 'sketch.js'].every((js) => scripts.includes(js)));
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { read, site } = await import('./read.js');
assert.equal(site.name, 'Made-up hillside plot');

// As the page opens: every thing of the file but the last two of its 37 - the lawn, which is
// ground, and the cut: neither is of the scene - `drawn`, in its order - and nothing gone wrong.
const sketched = JSON.parse(SKETCH).things;
const drawn = sketched.slice(0, -2);
const { things, figures, trouble, land } = read();
const called = (list) => list.map(({ name, kind }) => name ?? kind);
assert.deepEqual([called(things), trouble, sketched.length], [called(drawn), '', 37]);
// What the file gained over its file of version 3, by hand, each once in its text: on the porch
// a top that falls down the plot, from row 18 at column 50 to row 22 at column 58; on the bath
// one that falls across it, from row 12 at row 30 of the top view to row 14 at row 38; a wide
// staircase (ST-026); a lawn, ground (ST-027); and a cut, by its category (ST-028) - the last
// three of its things, in that order. With the five taken out it is that file but for its version.
const GAINED = [
  ',"slope":{"x":[50,58],"z":[18,22]}',
  ',"slope":{"y":[30,38],"z":[12,14]}',
  ',{"kind":"widestairs","x":37.5,"y":27.5,"floor":24}',
  ',{"x":[58,72],"y":[24,36],"z":[24,28],"colour":9,"name":"Lawn","is":"ground"}',
  ',{"x":[30,50],"y":[10,22],"z":[18,24],"colour":1,"category":"ground-cut"}',
];
for (const text of GAINED) assert.equal(SKETCH.split(text).length, 2, text);
assert.equal(JSON.stringify(sketched.slice(-3)), `[${GAINED.slice(2).join('').slice(1)}]`);
const level = GAINED.reduce((text, gained) => text.replace(gained, ''), SKETCH);
assert.equal(level, asNow('made-up', 3));
// As the pad reads them (`topOf`, blocks.js) the two tops lie on the second thing and on the
// tenth, and on no other; and the page hands the scene a `top` there and nowhere else.
const TOPS = { 1: { axis: 'x', rows: [18, 22] }, 9: { axis: 'y', rows: [12, 14] } };
assert.deepEqual([drawn[1].name, drawn[9].name], ['Glass porch', 'Bath']);
sketched.forEach((thing, at) => {
  assert.deepEqual(globalThis.blocks.topOf(thing), TOPS[at] ?? null, `the top of thing ${at}`);
  assert.deepEqual(things[at]?.top, TOPS[at], `the top of thing ${at}, as the page reads it`);
});
// The file says nothing of the figures: they are the eight defaults, by hand (story ST-024,
// rule 2), in metres.
const THICK = { outerWallM: 0.4, innerWallM: 0.2, floorSlabM: 0.3, roofSlabM: 0.3 };
const DEFAULTS = { ...THICK, railingHighM: 1, doorHighM: 2.1, windowHighM: 1.5, sillHighM: 0.9 };
assert.deepEqual(figures, DEFAULTS);
// What each block that is handed on counts as, by hand (tests/__fixtures__/CLAUDE.md): the
// porch is glass, for it says so - by its name it would be a room; the roof terrace and the
// garden are open air by their names; all else is a room. Both boxes of the night rooms say the
// same, and no object says any of it. None is ground or a cut: of those two nothing is handed on.
const AS = { 'Glass porch': 'glass', 'Roof terrace': 'open', Garden: 'open' };
const asOf = (all) => all.map((thing, at) => (drawn[at].kind ? '-' : thing.as));
const counted = drawn.map(({ kind, name }) => (kind ? '-' : (AS[name] ?? 'room')));
assert.deepEqual([asOf(things), counted.filter((as) => as !== '-').length], [counted, 8]);
assert.ok(things.every((thing, at) => 'as' in thing === (drawn[at].kind === undefined)));

// How far each object is lifted, by hand: what stands on the floor of a block stands on its
// slab, as thick as the figure says - every object of this house that the file puts on a level
// stands on the floor of a block there, a window in a face of its room too - and what stands
// on the ground, the car and the tree, is not lifted.
const liftBy = (slabM) => (at) => (drawn[at].floor === 'ground' ? 0 : slabM);
const grounded = drawn.filter(({ floor }) => floor === 'ground');
assert.deepEqual(called(grounded), ['car', 'tree']);

// The scene of them, as the page builds it, of the plot that was handed on: the three things hold
// of every part, and every part is a part. It has 35 solids, a thing each: the lawn is none, nor
// the cut. Every box of a block has a floor, and the tree, the ninth thing, a trunk and a crown.
const scene = sceneOf(land, things, figures);
assert.deepEqual(amiss(scene, liftBy(0.3)), []);
assert.deepEqual([scene.solids.length, called(scene.solids)], [35, called(drawn)]);
const partsOf = (at) => scene.parts.filter((part) => part.thing === at);
const floored = (at) => partsOf(at).some((part) => part.of === 'floor');
assert.ok(drawn.every(({ kind }, at) => kind !== undefined || floored(at)));
const shapes = (parts) => parts.map((part) => part.shape).sort();
assert.deepEqual([drawn[8].kind, shapes(partsOf(8))], ['tree', ['ball', 'round']]);

// THE LAWN, by hand: columns 58 to 72 and rows 24 to 36 of the top view, 7 m by 6 m before the
// porch, its top in row 24 of a standing view, 826 - 12 = 814 m: the floor of the day rooms.
// The hill is a plane, 820 - 0.1 c - 0.02 r m at column c and row r: 813.72 m at the lawn's
// uphill corner, 812.08 m at the one opposite. The plot that is handed on says its ground as
// heights: 814 m at all 15 * 13 grid points of the lawn, and the site's very number at every
// grid point inside a box of the house - 19 * 15 in the day rooms, 252 in the four boxes on
// their roof, 7 * 11 in the porch, 7 * 7 each in the store and the garden. The lawn cuts no
// hole: ground is drawn in all 14 * 12 cells of it. And the tree, 8 m high, stands on it: its
// floor is row 24, where the hill alone lies at 812.48 m, in row 27.04.
const { heights = [] } = land.ground;
const onLawn = heights.slice(24, 37).flatMap((line) => line.slice(58, 73));
assert.deepEqual(onLawn, Array(195).fill(814), 'the lawn is not 814 m at every grid point');
const span = ([from, to]) => Array.from({ length: to - from - 1 }, (_, at) => from + 1 + at);
const off = (c, r) => heights[r][c] - globalThis.paper.realAt(c, r);
const inBox = ({ x, y }) => span(y).flatMap((r) => span(x).map((c) => off(c, r)));
const housed = drawn.filter(({ kind }) => kind === undefined).flatMap(inBox);
assert.deepEqual([housed.length, new Set(housed)], [285 + 252 + 77 + 49 + 49, new Set([0])]);
const turf = scene.ground.drawn.slice(24, 36).flatMap((cells) => cells.slice(58, 72));
assert.deepEqual([turf.length, turf.filter(Boolean).length], [168, 168]);
assert.deepEqual([things[8].floor, things[8].z], [24, [8, 24]], 'the tree on the lawn');
// It raises the ground beside the garden too, by what the rule works out and no hand. Along
// its edge down the plot, x = 25 m from y = 6 to 10 m, the garden's slab, 814.3 m, lay 0.82 to
// 0.98 m over the hill: a railing along all 4 m. It has one still, and no longer along all of it.
const edge = partsOf(11).filter(({ of, min }) => of === 'rail' && Math.abs(min[0] - 24.95) < 1e-9);
const railed = edge.reduce((sum, { min, max }) => sum + max[1] - min[1], 0);
assert.ok(drawn[11].name === 'Garden' && railed > 0.4 && railed < 3.6, `${railed} m of railing`);

// --- by hand: the two tops that slope, the door under one, and the wide staircase -------------
const near = (actual, expected, what) =>
  actual.forEach((value, at) => assert.ok(Math.abs(value - expected[at]) < 1e-9, what));
/** How many parts of a thing are of each kind - what it is, and of which surface - of one shape, and `over` or not. */
const count = (at, shape, over = false) =>
  partsOf(at)
    .filter((one) => one.shape === shape && Boolean(one.over) === over)
    .map((one) => `${one.of} of ${one.surface}`)
    .reduce((all, kind) => ({ ...all, [kind]: (all[kind] ?? 0) + 1 }), {});
/** Every slant of a thing against a top worked out by hand, `topAt(place)`: its own top lies `far` under it at its two ends along the slope, and its bottom `thick` under that - or level, at `foot` - as `under` says of the part. */
function sloping(at, along, topAt, under) {
  for (const part of partsOf(at).filter((one) => one.shape === 'slant')) {
    const { far, thick, foot } = under(part);
    const top = [part.min[along], part.max[along]].map((place) => topAt(place) - far);
    assert.equal(part.along, along);
    near(part.high, top, `the top of a ${part.of} of thing ${at}`);
    near(part.low, foot ? [foot, foot] : top.map((h) => h - thick), `the bottom of a ${part.of}`);
  }
}
// THE PORCH, glass: from x = 21 m, at the day rooms, down the plot to 25 m, from y = 10 to
// 16 m, from 814 m up to 817 m. Its top falls half a metre a metre down the plot, to 815 m at
// its downhill end, a metre over its floor. Its roof is glass in its frames, on the slope and
// `over`: a member across the plot at either end, seven bars down it - 6 m in bays of a metre -
// and a pane a bay. Its three faces end under it, for the day rooms' wall is the fourth: a
// foot, a box on the slab, and a head, posts and panes that are slants. A member that follows
// the slope lies in the top, 0.05 m deep; a pane of the roof 0.005 m under it, 0.04 m thick;
// what stands on a foot, from 814.35 m up, ends 0.05 m under the top, under the head.
assert.deepEqual([partsOf(1).length, scene.solids[1].top], [53, { along: 0, high: [817, 815] }]);
assert.deepEqual(count(1, 'slant', true), { 'frame of metal': 9, 'pane of glass': 6 });
assert.deepEqual(count(1, 'slant'), { 'frame of metal': 20, 'pane of glass': 14 });
assert.deepEqual(count(1, 'box'), { 'floor of stone': 1, 'frame of metal': 3 });
const ofPorch = (part) => {
  if (part.low[0] === part.low[1]) return { far: 0.05, foot: 814.35 };
  return part.of === 'pane' ? { far: 0.005, thick: 0.04 } : { far: 0, thick: 0.05 };
};
sloping(1, 0, (x) => 817 - (x - 21) / 2, ofPorch);
// THE BATH, a room: from x = 16 to 18 m, from y = 9 m, its outer wall, to 13 m, at the night
// rooms, from 817 m up to 820 m. Its top falls a quarter of a metre a metre across the plot,
// away from the night rooms, to 819 m. Its roof slopes: a field of concrete and a strip of
// plaster over each of its two outer walls, `over`, with their tops in the top of the block and
// 0.3 m thick, upright. Its walls end under it: six slants on the floor's slab, 817.3 m, their
// heads 0.3 m under the top - but for the one over the door, which begins where the door ends.
assert.deepEqual([partsOf(9).length, scene.solids[9].top], [12, { along: 1, high: [819, 820] }]);
assert.deepEqual(count(9, 'slant', true), { 'roof of concrete': 1, 'roof of plaster': 2 });
assert.deepEqual(count(9, 'slant'), { 'wall of plaster': 6 });
assert.deepEqual(count(9, 'box'), { 'floor of stone': 1, 'floor of plaster': 2 });
const overDoor = ({ min, max }) => Math.abs(min[1] - 10.5) + Math.abs(max[1] - 11.5) < 1e-9;
const ofBath = (part) =>
  part.over ? { far: 0, thick: 0.3 } : { far: 0.3, foot: overDoor(part) ? 819.075 : 817.3 };
sloping(9, 1, (y) => 819 + (y - 9) / 4, ofBath);
// THE DOOR INTO THE BATH, the 18th thing, a metre wide - y from 10.5 to 11.5 m - has no part:
// it opens both halves of the wall of two rooms at x = 16 m, each 0.1 m thick, from the slab
// up. In the night rooms' half, under a level roof, as high as the figure says, 2.1 m, under a
// lintel that is a box. In the bath's the head of the wall lies lower all across the door, from
// 819.325 m down to 819.075 m: the opening ends 1.775 m over the slab, under a wedge of wall.
assert.deepEqual([drawn[17].kind, partsOf(17)], ['door', []]);
const across = (at) => partsOf(at).filter((one) => one.of === 'wall' && overDoor(one));
const [[lintel, ...more], [wedge, ...others]] = [across(4), across(9)];
assert.deepEqual([more, others, lintel.shape, wedge.shape], [[], [], 'box', 'slant']);
near([...lintel.min, ...lintel.max], [15.9, 10.5, 819.4, 16, 11.5, 819.7], 'the lintel');
near([...wedge.min, ...wedge.max], [16, 10.5, 819.075, 16.1, 11.5, 819.325], 'the wedge');
near([lintel.min[2] - 817.3, wedge.min[2] - 817.3], [figures.doorHighM, 1.775], 'the openings');
// THE WIDE STAIRCASE, the 35th thing, and the staircase beside it, the seventh: each sixteen
// steps of concrete from the day rooms' slab, 814.3 m, up to the night rooms', 817.3 m - a step
// 4.5 m / 16 long, its top 3 m / 16 over the one before - the one a metre wide, the other a
// metre and a half. Over both the night rooms' floor is open: 10 m by 4 m less 4.5 m by 1 m and
// 4.5 m by 1.5 m, field and rim, and none of it over the wide one's 12.5 to 17 m by 13.5 to 15 m.
function flight(at, foot, from, to) {
  assert.deepEqual([partsOf(at).length, count(at, 'box')], [16, { 'step of concrete': 16 }]);
  partsOf(at).forEach(({ min, max }, step) => {
    const [x, h] = [foot + step * 0.28125, 814.3 + (step + 1) * 0.1875];
    near([...min, ...max], [x, from, 814.3, x + 0.28125, to, h], `step ${step} of thing ${at}`);
  });
}
flight(6, 12, 15.5, 16.5);
flight(34, 12.5, 13.5, 15);
const floor = partsOf(3).filter((part) => part.of === 'floor');
const covered = floor.map(({ min, max }) => (max[0] - min[0]) * (max[1] - min[1]));
near([covered.reduce((sum, area) => sum + area)], [40 - 4.5 - 6.75], 'the floor over the rooms');
const beside = ({ min, max }) => max[0] <= 12.5 || min[0] >= 17 || max[1] <= 13.5 || min[1] >= 15;
assert.ok(floor.every(beside), 'a floor lies over the wide staircase');
// And at every cut of it, what shows is a few meshes, which together are every part that shows.
// In White, one for each surface that a part there is of. In its surfaces, one more for each
// surface that something standing in the house is made of: a mesh for the house's own parts of
// a surface, and one for what stands in it. A level down, fewer show: the levels are the two that
// the house stands on - the lawn, whose box reaches down to 812 m, gives none, nor does the cut.
const place = frameOf(scene);
const counts = ['all', ...scene.levels].map((cut) => {
  const showing = partsShown(scene, cut);
  const few = (way, apart) => {
    const { all } = meshesOf(showing, place, { sun: true, ...way });
    assert.equal(all.children.length, new Set(showing.map(apart)).size, cut);
    const held = all.children.reduce((sum, mesh) => sum + mesh.userData.parts, 0);
    assert.equal(held, showing.length, cut);
    return all.children.length;
  };
  const inWhite = few({ white: true }, (part) => part.surface);
  const inSurfaces = few({}, (part) => `${part.surface}, ${stands(part) ? 'stands' : 'house'}`);
  // The whole house has both: its tree has a trunk of the wood that its floors are of.
  if (cut === 'all') assert.ok(inSurfaces > inWhite, `${inSurfaces} meshes, and ${inWhite}`);
  return showing.length;
});
assert.deepEqual(scene.levels, [817, 814]);
assert.ok(counts[0] > things.length, 'the house has no more parts than the sketch has things');
assert.ok(counts[0] > counts[1] && counts[1] > counts[2], String(counts));

// Another window changes the figures - the doors 2.4 m high, the floors 0.2 m thick - and says
// of the store that it is open air, and of the second box of the night rooms that the block is
// glass. Read again, as the page reads then: the figures are the sketch's, both boxes of the night
// rooms count as glass and the store as open air - and the lawn is ground and the cut a cut still.
const said = { 2: 'open', 4: 'glass' };
const changed = sketched.map((thing, at) => (said[at] ? { ...thing, is: said[at] } : thing));
const SET = { doorHighM: 2.4, floorSlabM: 0.2 };
kept.set(KEY, JSON.stringify({ ...JSON.parse(SKETCH), things: changed, figures: SET }));
const again = read(true);
assert.deepEqual([again.trouble, again.things.length], ['', 35]);
assert.deepEqual(again.figures, { ...DEFAULTS, ...SET });
const recounted = counted.map((as, at) => ({ 2: 'open', 3: 'glass', 4: 'glass' })[at] ?? as);
assert.deepEqual(asOf(again.things), recounted);
// A door is as high as the sketch says now. By hand, the door at the porch - the sixth thing,
// with its middle at column 49 and row 30, on the level of row 24: a metre by a metre on the
// floor, and 2.4 m are 4.8 rows up from it, where 2.1 m were 4.2.
assert.equal(drawn[5].kind, 'door');
near([...things[5].x, ...things[5].y, ...things[5].z], [48, 50, 29, 31, 19.8, 24], 'the door');
near([...again.things[5].x, ...again.things[5].y], [48, 50, 29, 31], 'the door, where it stood');
near(again.things[5].z, [19.2, 24], 'the door, 2.4 m high');
// And the scene is built by them, on the ground that the lawn and the cut shape: the three things
// hold with a slab of 0.2 m to stand on, the floor of every block is that thick, and the store,
// which had a roof as a room has, has nothing over it now: it is open air.
const rebuilt = sceneOf(again.land, again.things, again.figures);
assert.deepEqual(amiss(rebuilt, liftBy(0.2)), []);
const floorsOf = ({ parts }) =>
  parts.filter((part) => part.of === 'floor' && !drawn[part.thing].kind);
const thick = (built) => floorsOf(built).map((part) => part.max[2] - part.min[2]);
const slabbed = (built, slabM) =>
  thick(built).length >= 8 && thick(built).every((high) => Math.abs(high - slabM) < 1e-9);
assert.deepEqual([slabbed(scene, 0.3), slabbed(rebuilt, 0.2)], [true, true], 'a floor is off');
const roofed = ({ parts }, at) => parts.some((part) => part.thing === at && part.over === true);
assert.deepEqual([drawn[2].name, roofed(scene, 2), roofed(rebuilt, 2)], ['Store', true, false]);
// Then the other window keeps what is no sketch. Nothing of it is drawn, and its figures are
// those of a sketch that says none - not the ones of the sketch before. It changes nothing: the
// pad's scripts hold the sketch they held, with its doors of 2.4 m.
const held = globalThis.sketch.doc;
kept.set(KEY, 'no sketch');
const none = read(true);
assert.deepEqual([none.things, none.figures], [[], DEFAULTS]);
assert.match(none.trouble, /cannot be read/);
assert.deepEqual([globalThis.sketch.doc === held, held.figures], [true, SET]);
// Reading wrote nothing, into neither store.
assert.deepEqual(written, []);

process.stdout.write(
  'tools/sketch/view3d: the made-up sketch, read as the page reads it, gives parts that hold what holds of every part on the ground that its lawn and its cut shape, and read again it is built by what it says then\n',
);
