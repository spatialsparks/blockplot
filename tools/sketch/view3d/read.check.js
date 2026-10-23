// The check of how the 3D view reads the sketch: the pad's own scripts, loaded here on the
// made-up plot with a made-up sketch in a made-up store, and each thing as the scene wants it
// against what a person worked out by hand - then the scene of them, in metres. Also: what is
// read when another window changed the sketch, what is said of a sketch that cannot be read,
// which events say that it changed, how a level and a side are named, what the tab keeps, what
// a block counts as, the figures of the house, and a door and a window at the figures the sketch
// gives them - as the page opens, and read again. A top that slopes is tops.check.js's.
// No browser, and nothing of the real site: site.js is never read. Which script may name the
// pad's globals is rules.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { sceneOf } from '../scene/scene.js';

// A browser's two stores, and the page's address: what the pad's scripts ask of the globals.
// Whatever is written into a store is noted: reading writes nothing.
const [kept, written] = [new Map(), []];
const local = { getItem: (key) => kept.get(key) ?? null, setItem: (key) => written.push(key) };
const session = { getItem: () => null, setItem: (key) => written.push(key) };
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
globalThis.location = { hash: '' };
// The pad's switch of views, which keeps what a tab shows, made up: what the tab kept the last
// time - of the pad's own views, and of the 3D view - and a note of what it is told to keep.
const keeping = [];
const lastSeen = { px: 12, '3d': { cut: 817, ground: false } };
globalThis.views = { seen: lastSeen, keep: (showing) => keeping.push(showing) };
const KEY = 'blockplot/sketch/space';
const asKept = (things, more) =>
  JSON.stringify({ space: 6, things, floors: [], notes: [], on: {}, ...more });
/** The pad's sketch and the view's reader, loaded anew: the sketch is read as its script loads. */
let loads = 0;
async function opened() {
  loads += 1;
  await import(`../sketch.js?${loads}`);
  return import(`./read.js?${loads}`);
}

// The made-up plot's ground is a plane: on its paper, the ground lies in row
// 12 + 0.2 * column + 0.04 * row of a standing view (docs/sketch/pad-gotchas.md). The scripts are
// the ones the 3D page loads before the sketch's, in its order.
const SCRIPTS = ['demo-site', 'paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy'];
for (const file of SCRIPTS) await import(`../${file}.js`);

// Kept, but no sketch: a kind that the pad does not know. The pad opens with an empty paper and
// has no words for it; the view draws nothing of it, and says so.
kept.set(KEY, asKept([{ kind: 'unicorn', x: 1, y: 1, floor: 'ground' }]));
const unread = (await opened()).read();
assert.deepEqual(unread.things, []);
assert.match(unread.trouble, /cannot be read/);

// A made-up sketch: two blocks, one of them of two boxes, a box in a colour the pad has not, and
// six objects - on a floor and on the ground, turned, lifted, and one of an older sketch.
const drawn = [
  { x: [30, 50], y: [22, 38], z: [18, 24], colour: 2, name: 'Day rooms' },
  { x: [30, 50], y: [22, 30], z: [12, 18], colour: 4, group: 7, name: 'Winter garden' },
  { x: [30, 40], y: [30, 38], z: [12, 18], colour: 4, group: 7 },
  { x: [22, 30], y: [24, 32], z: [20, 24], colour: 99 },
  { kind: 'door', x: 49, y: 30, floor: 24 },
  { kind: 'car', x: 16, y: 27.5, floor: 'ground', turn: 1 },
  { kind: 'tree', x: 70, y: 26, floor: 'ground' },
  { kind: 'window', x: 40, y: 22, floor: 24 },
  { kind: 'window', x: 10, y: 10, floor: 'ground' },
  { kind: 'bed', x: 20, y: 20, floor: 30, turned: true },
];
kept.set(KEY, asKept(drawn));
const { keep, levelName, read, seen, site, watch, winds } = await opened();
const { things, figures, trouble } = read();
assert.equal(trouble, '');
// The figures of the house are the pad's to say of the sketch: this one says nothing of them,
// and has the defaults. What they are by hand, and read again, is made-up.check.js's.
const DEFAULTS = globalThis.figures.of({});
assert.deepEqual([figures, figures.doorHighM, Object.keys(figures).length], [DEFAULTS, 2.1, 8]);
assert.equal(site, globalThis.SITE);
assert.equal(site.name, 'Made-up hillside plot');

// A level of the scene, a height, is named as the pad names it by its row: the standing papers
// of the made-up plot reach up to 826 m, so 817 m is row 18, and 813.5 m row 25.
assert.deepEqual([levelName(817), levelName(813.5)], ['Level 817 m', 'Level 813.5 m']);
assert.equal(levelName(817), globalThis.sketch.nameOf('top', 18));
// The wind each standing station is seen from is the one the pad names for its slice of that
// side. The made-up plot runs downhill towards 232 degrees, south-west: so the front is seen
// from the south-west, and the back from the north-east; the pad's side view looks from a
// quarter on, 322 degrees - the station on the left - and its other side from 142 degrees.
assert.deepEqual(winds, {
  front: 'south-west',
  back: 'north-east',
  left: 'north-west',
  right: 'south-east',
});
// What the tab kept of the 3D view, the pad's switch has under a name of the view's own, beside
// what the pad's views kept; and what the view shows as the page goes is kept under that name.
assert.deepEqual(seen, { cut: 817, ground: false });
keep(() => ({ cut: 'all', ground: true }));
assert.equal(keeping.length, 1);
assert.deepEqual(keeping[0](), { '3d': { cut: 'all', ground: true } });

// Numbers that went through the ground's heights are compared to a millionth of a cell.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) => assert.ok(Math.abs(value - expected[at]) < 1e-6, what));
};
const [day, garden, wing, store, door, car, tree, pane, low, bed] = things;
assert.equal(things.length, drawn.length);

// A block is its box, as it is: the cells it was drawn on. Its colour is the pad's, by name and
// by hex; it has a name and a group where the sketch has them, and neither where it has not.
// And it says what it counts as, as the pad reads it of the boxes of its block
// (`blocks.countsAs`): the day rooms are a room, for their name has no word that says
// otherwise; the winter garden is open air, by the `garden` in its name - and so is its second
// box, which has no name of its own.
assert.deepEqual(day, {
  x: [30, 50],
  y: [22, 38],
  z: [18, 24],
  colour: { name: 'orange', hex: '#f08c00' },
  name: 'Day rooms',
  as: 'room',
});
assert.deepEqual(garden, {
  x: [30, 50],
  y: [22, 30],
  z: [12, 18],
  colour: { name: 'green', hex: '#5a9e4b' },
  name: 'Winter garden',
  group: 7,
  as: 'open',
});
assert.deepEqual(wing, {
  x: [30, 40],
  y: [30, 38],
  z: [12, 18],
  colour: { name: 'green', hex: '#5a9e4b' },
  group: 7,
  as: 'open',
});
// A colour the pad has not is its first, ink: as the pad paints such a block. With no name and
// no word of its own, it is a room. No object says what it counts as.
assert.deepEqual(store.colour, { name: 'ink', hex: '#1f2933' });
assert.deepEqual([store.as, things.filter((thing) => 'as' in thing).length], ['room', 4]);

// A door is 1 m by 1 m and 2.1 m high: 2 cells by 2 about its middle, and 4.2 rows up from the
// floor the sketch gives it.
assert.deepEqual(door, {
  x: [48, 50],
  y: [29, 31],
  z: [19.8, 24],
  kind: 'door',
  turn: 0,
  fill: '#f3e3cf',
  floor: 24,
});
// A car is 4.5 m by 2 m and 1.5 m high, and this one is turned by a quarter: 4 cells along the
// plot and 9 across it. It stands on the ground, which lies in row 12 + 0.2 * 16 + 0.04 * 27.5 =
// 16.3 under its middle: that is its floor, and it is 3 rows high.
assert.deepEqual(
  [car.x, car.y],
  [
    [14, 18],
    [23, 32],
  ],
);
near(car.z, [13.3, 16.3], 'the car');
near([car.floor], [16.3], 'the floor of the car');
assert.deepEqual([car.kind, car.turn, car.fill], ['car', 1, '#eceff2']);
// A tree is 6 m by 6 m and 8 m high: the ground lies in row 12 + 0.2 * 70 + 0.04 * 26 = 27.04
// under its middle.
assert.deepEqual(
  [tree.x, tree.y],
  [
    [64, 76],
    [20, 32],
  ],
);
near(tree.z, [11.04, 27.04], 'the tree');
near([tree.floor], [27.04], 'the floor of the tree');
// A window is 1.5 m long, 0.3 m thick and 1.5 m high, with its sill 0.9 m over the floor: 3 cells
// on the grid, 0.6 of a cell about its middle, and from 1.8 rows over the floor 3 rows up. Its
// floor is the floor it was put on, not its sill.
assert.deepEqual(pane.x, [39, 42]);
near(pane.y, [21.7, 22.3], 'the window, across the plot');
near(pane.z, [19.2, 22.2], 'the window');
assert.deepEqual([pane.kind, pane.turn, pane.fill, pane.floor], ['window', 0, '#d9ecf7', 24]);
// On the ground, the same window: the ground lies in row 12 + 0.2 * 10.5 + 0.04 * 10 = 14.5
// under its middle, and that is its floor - the bottom of its box, and its lift under that.
near(low.z, [9.7, 12.7], 'the window on the ground');
near([low.floor], [14.5], 'the floor of the window on the ground');
// An object of an older sketch says `turned`: a quarter.
assert.deepEqual([bed.kind, bed.turn, bed.x, bed.z], ['bed', 1, [18, 22], [28, 30]]);

// The scene of them, in metres of the plot: a column is 2 * (x + 4), a row of the top view
// 2 * (28 - y), a row of a standing view 2 * (826 - height). One solid for each thing.
const scene = sceneOf(site, things);
assert.equal(scene.solids.length, drawn.length);
assert.deepEqual(
  [scene.solids[0].min, scene.solids[0].max],
  [
    [11, 9, 814],
    [21, 17, 817],
  ],
);
// The green block is see-through, and the tree, as green, is not. The tree stands as high as
// the ground lies under its middle - 31 m down the plot and 15 m across it:
// 820 - 0.2 * 35 - 0.04 * 13 = 812.48 m - and is 8 m high.
assert.deepEqual([scene.solids[1].see, scene.solids[6].see], ['through', 'solid']);
near(scene.solids[6].min, [28, 12, 812.48], 'the tree, in metres');
near(scene.solids[6].max, [34, 18, 820.48], 'the top of the tree, in metres');
// The ground is cut out under the four boxes and under nothing else: 20 * 16 cells under the
// day rooms, which the boxes over them lie within, and 8 * 8 under the store.
const cut = scene.ground.drawn.flat().filter((there) => !there).length;
assert.equal(cut, 20 * 16 + 8 * 8);
// The pad's own words for what went wrong are the view's, as the page opens.
globalThis.sketch.trouble = 'Made-up words of the pad.';
assert.equal(read().trouble, 'Made-up words of the pad.');
globalThis.sketch.trouble = '';
// Another window changed the sketch: read again, it is what the browser keeps now. And the
// sketch that the pad's scripts hold on this page is the one that was read last - they are
// asked for the boxes of a block and for how high a door is, and answer of the sketch that is
// drawn - so what is read as the page opened is that sketch too, from now on.
kept.set(KEY, asKept(drawn.slice(0, 2)));
assert.deepEqual(read(true).things, [day, garden]);
assert.equal(read(true).trouble, '');
assert.deepEqual(globalThis.sketch.doc.things, drawn.slice(0, 2));
assert.deepEqual(read().things, [day, garden]);
// The pad's words were for the sketch the page opened with, not for this one.
globalThis.sketch.trouble = 'Made-up words of the pad.';
assert.equal(read(true).trouble, '');
globalThis.sketch.trouble = '';
// What cannot be read gives no thing, and the words for it: no JSON, and no sketch. It changes
// nothing: the pad's scripts hold the sketch they held.
const held = globalThis.sketch.doc;
for (const text of ['?', '{"space":6,"things":[{"x":[1,2],"y":[1,2]}],"floors":[],"notes":[]}']) {
  kept.set(KEY, text);
  assert.deepEqual(read(true).things, [], text);
  assert.match(read(true).trouble, /cannot be read/, text);
  assert.match(read(true).locked, /^No figure can be changed here/, text);
}
// Nothing kept is no trouble: nothing is drawn yet. And nothing is locked: a figure can be set.
kept.delete(KEY);
const NOTHING = {
  things: [],
  figures: DEFAULTS,
  trouble: '',
  locked: '',
  land: site,
  sections: [],
  on: { side: globalThis.sketch.on('side'), end: globalThis.sketch.on('end') },
};
assert.deepEqual(read(true), NOTHING);
// A store that refuses to be read is the pad's to speak of: no thing, and no words of the view.
const refusing = local.getItem;
local.getItem = () => {
  throw new Error('a made-up refusal');
};
assert.deepEqual(read(true), NOTHING);
local.getItem = refusing;
assert.equal(globalThis.sketch.doc, held);
// Reading writes nothing, into neither store.
assert.deepEqual(written, []);
// A change is heard as the browser tells it: a storage event of the pad's key, or of no key -
// the store emptied. An event of another key is none of the view's.
const heard = [];
const page = { addEventListener: (type, hear) => heard.push({ type, hear }) };
let changes = 0;
watch(() => (changes += 1), page);
assert.deepEqual(
  heard.map(({ type }) => type),
  ['storage'],
);
const [{ hear }] = heard;
hear({ key: `${KEY}/steps` });
hear({ key: 'blockplot/sketch/seen' });
assert.equal(changes, 0);
hear({ key: KEY });
hear({ key: null });
assert.equal(changes, 2);
// How high a door is, how high a window, and how far its sill lies over the floor, the sketch
// says (figures.js) - and the reader has every box from the pad, so at those figures. A door of
// 2.4 m is 4.8 rows high. A window of 1.2 m, its sill 1 m up, reaches from 2 rows over its
// floor 2.4 rows up; on the ground its floor is the ground under its middle still, row 14.5:
// what its sill is lifted by is read a second time, and is the same. Nothing else has changed.
kept.set(KEY, asKept(drawn, { figures: { doorHighM: 2.4, windowHighM: 1.2, sillHighM: 1 } }));
const figured = (await opened()).read().things;
near(figured[4].z, [19.2, 24], 'a door of 2.4 m');
near(figured[7].z, [19.6, 22], 'a window of 1.2 m, its sill 1 m up');
near(figured[8].z, [10.1, 12.5], 'that window on the ground');
near([figured[8].floor], [14.5], 'the floor of that window on the ground');
assert.deepEqual([pane.x, pane.y, pane.floor], [figured[7].x, figured[7].y, figured[7].floor]);
const others = (all) => all.filter(({ kind }) => !['door', 'window'].includes(kind));
assert.deepEqual(others(figured), others(things));
// A colour of the owner's - green's value too - is handed on by its value, and solid (ST-039).
const owns = ['#3a7bd5', '#5a9e4b'];
kept.set(KEY, asKept(owns.map((colour) => ({ ...drawn[3], colour }))));
const mine = (await opened()).read().things;
const handed = mine.map(({ colour }) => colour);
const sees = sceneOf(site, mine).solids.map(({ see }) => see);
assert.deepEqual([handed, sees], [owns.map((hex) => ({ name: hex, hex })), ['solid', 'solid']]);

process.stdout.write(
  'tools/sketch/view3d: the sketch is read as the pad places it, and again when another window changed it; a level and a side are named as the pad names them\n',
);
