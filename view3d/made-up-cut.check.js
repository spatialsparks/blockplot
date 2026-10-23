// The check of the cut of the made-up sketch, in both views together (story ST-028): the last
// of the file's things, a block with no name along the long side of its day rooms, for which the
// category "Ground cut" was picked. tests/__fixtures__/sketch/made-up.json in a made-up store,
// read by the pad's own scripts - the ones 3d.html names, in its order - on the made-up plot,
// and handed to the scene as the page hands it: as made-up.check.js does, which holds the house
// - its tops, its staircases, its lawn - and had no room for this. Against figures worked out by
// hand: the file's text by where its last two things stand, which check-blocks.js held until
// the cut came; the block as the pad reads it, a cut by its category, with the category's word
// for the paper, on the level of the day rooms; what the page hands on - two things fewer than
// the file has, 35 solids on two levels, and the plot with the paper's very grid: 814 m at the
// cut's 252 grid points, the site's own on the outline beside them and inside the house, the
// floor of the day rooms along their side; ground in every cell of the cut and no part of a
// house in its box; the tree on the lawn still. Then the sketch as another window keeps it: the
// block taken out - the hill against the house again, and no thing another but where the car
// stands - and the block with no category, a room. The cut lowers the ground under the car and
// round the house by what the rule works out: no figure of that is held here. No browser, and
// nothing of the real site: site.js is never read. Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { asNow, golden } from '../check-golden.js';
import { amiss } from '../scene/holds.js';
import { sceneOf } from '../scene/scene.js';

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

// The scripts the page loads before its module, read off the page, as made-up.check.js loads
// them: the site first, which is the made-up plot's here, and the switch of views last, which
// wants a page and is made up above. Among them are the list of the categories, by which the
// block is a cut, and earth.js, without which the paper takes no ground away.
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual([scripts[0], scripts.at(-1)], ['site.js', 'views.js']);
assert.ok(['categories.js', 'blocks.js', 'earth.js'].every((js) => scripts.includes(js)));
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { read, site } = await import('./read.js');
assert.equal(site.name, 'Made-up hillside plot');
const { blocks, categories, paper, sketch } = globalThis;

// --- the file -----------------------------------------------------------------------------------
// ITS TEXT, as check-blocks.js held it until the cut came, whole, and with the cut said: without
// the block named "Lawn" that says ground and the block after it that says the category
// `ground-cut` - the last two of its things, wherever each lies - without what a box says of a
// slope, and without a wide staircase at the end of the things that are left, it is the file of
// version 3 as the pad reads it. A file that lacks either block, or has them in another order,
// fails it. Where the two lie is counts.check.js's, made-up.check.js's and, of the cut, this one's.
const LAST = /,\{"x"[^{]*"name":"Lawn","is":"ground"\},\{"x"[^{]*"category":"ground-cut"\}(?=\])/;
const [head, tail] = SKETCH.split(LAST);
const v3 = `${head}${tail}`.replace(/,"slope":\{[^}]*\}|,\{"kind":"widestairs"[^}]*\}(?=\])/g, '');
assert.equal(v3, asNow('made-up', 3));

// THE CUT, by hand: the last of the file's 37 things - ten boxes and 27 objects - after the lawn.
// Columns 30 to 50 and rows 10 to 22 of the top view: 10 m down the plot, the whole long side of
// the day rooms, and 6 m across it, from that side, row 22, out to the edge of the plot, row 10
// - as deep about its slice, row 16, as every block that is drawn in the side view. Its floor
// lies in row 24 of a standing view, 826 - 12 = 814 m: the floor of the day rooms. Its box
// reaches up to row 18, 817 m, which says nothing: only the floor of a cut counts. Red, with no
// name and no word on what it is: the one box of the file that says a category.
const CUT = { x: [30, 50], y: [10, 22], z: [18, 24], colour: 1, category: 'ground-cut' };
const sketched = JSON.parse(SKETCH).things;
const [lawn, cut] = sketch.doc.things.slice(-2);
const boxes = sketch.doc.things.filter(sketch.isBox);
assert.deepEqual([sketched.length, sketched.at(-1), cut, boxes.length], [37, CUT, CUT, 10]);
assert.deepEqual(
  boxes.filter((box) => 'category' in box),
  [cut],
);

// AS THE PAD READS IT: a cut by its category, which was picked - and the lawn ground by what it
// says, the two blocks of the ten that are none of the house. And the block stands on the level
// of the day rooms, the fifth block there, and makes no level of its own: the top view lists the
// three levels it listed, and the ground. The word that stands on it on the paper is asked last.
const counted = (thing) => Object.values(blocks.countsAs(sketch.blockOf(thing))).join(' by ');
assert.deepEqual(
  [counted(cut), counted(lawn), lawn.name],
  ['cut by category', 'ground by is', 'Lawn'],
);
const OF_THE_HOUSE = /^(room|open|glass) by /;
assert.deepEqual(
  boxes.filter((box) => !OF_THE_HOUSE.test(counted(box))),
  [lawn, cut],
);
const { category, by } = categories.of(sketch.blockOf(cut));
assert.deepEqual(
  [category.key, category.name, category.as, by],
  ['ground-cut', 'Ground cut', 'cut', 'picked'],
);
const listed = sketch.keys().map((key) => {
  const on = sketch.layer('top', key).things.filter(({ thing }) => sketch.isBox(thing));
  const among = on.some(({ thing }) => thing === cut) ? ', the cut among them' : '';
  return `${sketch.nameOf('top', key)}: ${on.length}${among}`;
});
assert.deepEqual(listed, [
  'Level 817 m: 4',
  'Level 814 m: 5, the cut among them',
  'Level 812 m: 1',
  'Ground: 0',
]);

// --- as the 3D page reads it ---------------------------------------------------------------------
// TWO THINGS FEWER than the file has are handed on, in their order: neither the lawn nor the cut
// is one, and no thing says a category, or that it is a cut or ground. The scene of them has 35
// solids, a thing each, on the levels at 817 m and 814 m: the cut's floor is the day rooms', and
// gives none of its own. The tree, the ninth thing, stands on the lawn still: its floor is row 24.
const drawn = sketched.slice(0, -2);
const called = (list) => list.map(({ name, kind }) => name ?? kind);
const { things, figures, trouble, land } = read();
assert.deepEqual([things.length, called(things), trouble], [35, called(drawn), '']);
assert.ok(things.every((thing) => !('category' in thing) && !['cut', 'ground'].includes(thing.as)));
const scene = sceneOf(land, things, figures);
assert.deepEqual([scene.solids.length, called(scene.solids)], [35, called(drawn)]);
assert.deepEqual(scene.levels, [817, 814]);
assert.deepEqual([things[8].kind, things[8].floor, things[8].z], ['tree', 24, [8, 24]]);

// THE GROUND, by hand. The hill is a plane, 820 - 0.1 c - 0.02 r m at column c and row r of the
// top view. Along the long side of the day rooms, row 22, it stood at 820 - 3 - 0.44 = 816.56 m
// at column 30 and at 814.56 m at column 50: 2.56 m to 0.56 m up their wall. On row 10, the
// outline of the plot, it lies at 816.8 m and 814.8 m. The lowest grid point that the cut
// reaches is that of column 50 and row 22: over 814 m, and the lawn, a fill, raises what it
// moves - so the ground without the cut lies over the cut's floor at every one of them, the cut
// bites at all, and the ground of this house is worked out twice (earth.js). The plot that is
// handed on says its ground as heights, the paper's very grid:
// - 814 m at the 21 * 12 = 252 grid points of the cut's rows 11 to 22;
// - on row 10, the outline, the site's very number from column 30 to 50: a wall of earth there,
//   2.8 m to 0.8 m high, in half a metre;
// - ALONG THE SIDE OF THE DAY ROOMS, row 22 from column 30 to 50, their floor: the wall shows
//   down to it, where the hill hid it;
// - 814 m at the lawn's 15 * 13 = 195 still, which the cut does not reach;
// - and the site's very number at every grid point inside the house, 487 of them: 285, 77, 49
//   and 49 inside the day rooms, the porch, the store and the garden - the four boxes above
//   them stand on the day rooms - and on the edges that two of those share 13, at column 50
//   from row 25 to 37, 7, at column 30, and 7, at row 36.
const { heights } = land.ground;
assert.equal(heights, paper.shaped());
const span = (from, to) => Array.from({ length: to - from + 1 }, (_, at) => from + at);
const along = (grid, row) => grid[row].slice(30, 51);
const reached = (grid) => span(11, 22).flatMap((row) => along(grid, row));
assert.deepEqual(
  reached(heights),
  Array(252).fill(814),
  'the cut is not 814 m at every grid point',
);
assert.deepEqual(
  along(heights, 10),
  span(30, 50).map((c) => paper.realAt(c, 10)),
);
assert.deepEqual([heights[10][30], heights[10][50]], [816.8, 814.8]);
assert.deepEqual(along(heights, 22), Array(21).fill(814), 'the ground along the day rooms');
assert.deepEqual([paper.realAt(30, 22), paper.realAt(50, 22)], [816.56, 814.56]);
const onLawn = heights.slice(24, 37).flatMap((line) => line.slice(58, 73));
assert.deepEqual(onLawn, Array(195).fill(814));
const house = things.filter(({ kind }) => kind === undefined);
const housed = (c, r) => house.some(({ x, y }) => x[0] <= c && c < x[1] && y[0] <= r && r < y[1]);
const inHouse = span(0, 62).flatMap((r) =>
  span(0, 92)
    .filter((c) => [c - 1, c].every((cc) => [r - 1, r].every((rr) => housed(cc, rr))))
    .map((c) => [c, r]),
);
assert.equal(inHouse.length, 285 + 77 + 49 + 49 + 13 + 7 + 7);
assert.ok(inHouse.every(([c, r]) => heights[r][c] === paper.realAt(c, r)));

// IN 3D A CUT IS NO SOLID AND HAS NO PART OF A HOUSE. Ground is drawn in all 20 * 12 = 240 cells
// of it: it cuts no hole. No solid has its box, and no part of the scene lies in that box with
// any of itself - x from 30 / 2 - 4 = 11 m to 21 m, y from 28 - 22 / 2 = 17 m to 23 m, from 814 m
// up to 817 m: the wall of the day rooms stands against it, inside their own box. And the three
// things hold that hold of every part: what stands on the floor of a block stands on its slab,
// 0.3 m thick, and what stands on the ground, the car and the tree, is not lifted.
/** How many cells of a box, seen from above, have ground drawn in a scene. */
const groundIn = ({ ground }, { x, y }) =>
  ground.drawn
    .slice(y[0], y[1])
    .flatMap((cells) => cells.slice(x[0], x[1]))
    .filter(Boolean).length;
/** The parts of a scene that lie in a box of the sketch, with any of themselves. */
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
const liftOf = (list) => (at) => (list[at].floor === 'ground' ? 0 : 0.3);
assert.deepEqual([groundIn(scene, CUT), partsIn(scene, CUT)], [240, []]);
assert.ok(partsIn(scene, sketched[0]).length > 0, 'no part lies in the day rooms');
const [ITS_BOX, boxOf] = ['11 17 814 21 23 817', ({ min, max }) => [...min, ...max].join(' ')];
assert.deepEqual(
  scene.solids.filter((solid) => boxOf(solid) === ITS_BOX),
  [],
);
assert.deepEqual([figures.floorSlabM, amiss(scene, liftOf(drawn))], [0.3, []]);

// --- as another window keeps it ------------------------------------------------------------------
/** What `read` hands on of a text kept anew, with the scene of it as the page builds it. */
function readAgain(text) {
  kept.set(KEY, text);
  const again = read(true);
  return { ...again, scene: sceneOf(again.land, again.things, again.figures) };
}
// THE BLOCK TAKEN OUT of the text: the house of before the cut. The same 35 things are handed
// on, and each as it was but one: the car, the eighth, which stands on the ground uphill of the
// house and lower with the cut - its floor a row further down the paper - by what the rule works
// out. The tree stood on the lawn as it does. So nothing but the ground tells the two houses
// apart. Without the cut the hill stands against the day rooms again: no grid point that the
// cut reached lies under the site's own - the lawn raises - nor, then, under 814.56 m.
const TEXT = `,${JSON.stringify(CUT)}`;
assert.equal(SKETCH.split(TEXT).length, 2);
const bare = readAgain(SKETCH.replace(TEXT, ''));
assert.deepEqual([bare.trouble, bare.things.length, bare.scene.solids.length], ['', 35, 35]);
const others = (list) => list.filter((_, at) => at !== 7);
assert.deepEqual([drawn[7].kind, others(bare.things)], ['car', others(things)]);
assert.ok(things[7].floor > bare.things[7].floor, 'the car does not stand lower with the cut');
const uncut = bare.land.ground.heights;
const real = span(11, 22).flatMap((row) => span(30, 50).map((c) => paper.realAt(c, row)));
assert.ok(reached(uncut).every((height, at) => height >= real[at] && height >= 814.56));
assert.deepEqual([groundIn(bare.scene, CUT), amiss(bare.scene, liftOf(drawn))], [240, []]);

// THE BLOCK WITH NO CATEGORY: `,"category":"ground-cut"` taken out of the text. It has no name,
// and says nothing: a room. It is handed on, the last of 36 things, a red box with no name, and
// is the 36th solid - the one solid that has the box no solid had - with a floor, walls and a
// roof, on the level of the day rooms: no level more. No ground is drawn in its 240 cells. And
// it is a block of the house, which holds the ground back: along the side of the day rooms,
// between the two, the grid points of columns 31 to 49 are no ground at all, and say the site's
// very number - the hill, as it was.
const roomed = readAgain(SKETCH.replace(',"category":"ground-cut"', ''));
const { category: picked, colour, ...box } = CUT;
assert.deepEqual([picked, colour, roomed.things.length], ['ground-cut', 1, 36]);
assert.deepEqual(roomed.things.at(-1), {
  ...box,
  colour: { name: 'red', hex: '#d9482b' },
  as: 'room',
});
assert.deepEqual([roomed.scene.solids.length, roomed.scene.levels], [36, [817, 814]]);
assert.deepEqual(
  roomed.scene.solids.flatMap((solid, at) => (boxOf(solid) === ITS_BOX ? [at] : [])),
  [35],
);
const built = new Set(roomed.scene.parts.filter((part) => part.thing === 35).map(({ of }) => of));
assert.deepEqual([...built].sort(), ['floor', 'roof', 'wall']);
assert.deepEqual([groundIn(roomed.scene, CUT), partsIn(roomed.scene, CUT).length > 0], [0, true]);
assert.deepEqual(
  along(roomed.land.ground.heights, 22).slice(1, -1),
  span(31, 49).map((c) => paper.realAt(c, 22)),
);
assert.deepEqual(amiss(roomed.scene, liftOf([...drawn, CUT])), []);

// THE WORD ON THE PAPER, asked last: it is the pad's own page's to say (labels.js), which the
// 3D page does not load - all above was read with the scripts of that page alone. The file
// again, as the pad holds it: the block has no name, and the word that stands on it where a
// name would is the name of the category that was picked for it. No other thing has one.
await import('../labels.js');
kept.set(KEY, SKETCH);
assert.equal(read(true).trouble, '');
const last = sketch.doc.things.at(-1);
assert.deepEqual([last, sketch.worded(last)], [CUT, 'Ground cut']);
assert.deepEqual(sketch.doc.things.map(sketch.worded).filter(Boolean), ['Ground cut']);

// Reading wrote nothing, into neither store.
assert.deepEqual(written, []);

process.stdout.write(
  'tools/sketch/view3d: the cut of the made-up sketch is a cut by its category to the pad, and to the 3D page the ground it takes away - 814 m at its 252 grid points, the floor of the day rooms along their side, the site at the edge of the plot - and no thing: 35 solids, and no part of a house where it lies\n',
);
