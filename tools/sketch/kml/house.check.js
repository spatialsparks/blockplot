// The check of the house for Google Earth (ST-016, T-016.4): `raiseOf`, the raise kept for a
// plot, and `houseFile` - by hand, on a scene of three solids made up here, on a site at the
// grid's zero; and on the made-up house, read as the 3D page reads it - the made-up sketch,
// tests/__fixtures__/sketch/made-up.json, in a made-up store, by the pad's own scripts in the
// order 3d.html names them, on the made-up plot at its made-up place - with how many of its
// boxes stand above the ground worked out by hand, below, and the White model's parts of them
// (ST-038). No browser here, and nothing of the real site: site.js is never read. The wall
// around a window, by hand, and the switches are white.check.js's. Run by tools/sketch/check.js,
// as every *.check.js is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { sceneOf } from '../scene/scene.js';
import { NO_PLACE, RAISE_KEY, houseFile, keepRaise, keptRaise, raiseOf } from './house.js';

// --- the raise ----------------------------------------------------------------------------------
// Empty is 0, and so are blanks; a sign, a decimal point or a decimal comma are taken; nothing
// else is - no letter, and no exponent, which no field of a raise needs and 1e400 would overflow.
const RAISES = [
  ['', 0],
  [' ', 0],
  ['2.5', 2.5],
  ['-2,5', -2.5],
  ['+1', 1],
  [' 1 ', 1],
  ['.5', 0.5],
  ['-0', 0],
  ['x', null],
  ['1e400', null],
  ['2.5 m', null],
  ['1.2.3', null],
  ['-', null],
];
for (const [text, metres] of RAISES) assert.equal(raiseOf(text), metres, JSON.stringify(text));
assert.ok(Object.is(raiseOf('-0'), 0));

// Kept for the page's plot, by its id - or under the one key where the page has no plot, as on
// the made-up pad - as it was typed; a text that is no number keeps nothing, and leaves what was.
const storeOf = () => {
  const held = new Map();
  return {
    held,
    getItem: (key) => held.get(key) ?? null,
    setItem: (key, text) => held.set(key, text),
  };
};
const onPlot = { localStorage: storeOf(), PLOT: { id: 'orchard' } };
const madeUpPad = { localStorage: storeOf() };
assert.deepEqual([keptRaise(onPlot), keptRaise(madeUpPad)], ['', '']);
keepRaise('-2,5', onPlot);
keepRaise('1', madeUpPad);
keepRaise('x', onPlot);
assert.deepEqual([...onPlot.localStorage.held], [[`${RAISE_KEY}/orchard`, '-2,5']]);
assert.deepEqual([...madeUpPad.localStorage.held], [['blockplot/earth/raise', '1']]);
assert.deepEqual([keptRaise(onPlot), keptRaise(madeUpPad)], ['-2,5', '1']);

// --- a scene made up by hand --------------------------------------------------------------------
// A ground of grid points a metre apart, x 0 to 4 and y 3 down to 0, falling a metre a column:
// 110 m at x 0, 107 at x 3. On x 1 to 3 and y 1 to 2 the lowest grid point is 107 m, at x 3.
const xs = [0, 1, 2, 3, 4];
const ys = [3, 2, 1, 0];
const ground = { xs, ys, heights: ys.map(() => xs.map((x) => 110 - x)), drawn: [] };
const solid = (name, [bottom, top], more = {}) => ({
  min: [1, 1, bottom],
  max: [3, 2, top],
  colour: '#888888',
  see: 'solid',
  name,
  ...more,
});
// A room from 107 m to 112 m - over the ground - a cellar from 103 m to 106 m - its top under
// 107 m - and a tree, an object, which no file holds. Each is built of one part, as White
// builds it, of the thing at its place in the solids: a wall of the room, of the cellar, and the
// tree's piece.
const room = solid('Room', [107, 112]);
const cellar = solid('Cellar', [103, 106]);
const tree = solid('Tree', [108, 115], { kind: 'tree' });
const partOf = ({ min, max }, thing, of = 'wall') => ({
  of,
  shape: 'box',
  min,
  max,
  surface: 'plaster',
  thing,
});
const builtOf = (solids) => ({
  solids,
  ground,
  parts: solids.map((one, thing) => partOf(one, thing, one.kind ? 'piece' : 'wall')),
});
const scene = builtOf([room, cellar, tree]);
const outline = [
  [0, 0],
  [4, 0],
  [4, 3],
  [0, 3],
];
const at = { name: 'Check & plot', bearingDeg: 90, originLV95: [2_600_000, 1_200_000], outline };
const NOW = new Date('2026-10-15T12:00:00Z');

/** The Placemarks of a file, each as its name and the altitudes of its points. */
const placemarksOf = (text) =>
  [...text.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)].map(([, mark]) => ({
    name: mark.match(/<name>(.*?)<\/name>/)[1],
    heights: [...mark.matchAll(/,(-?[\d.]+)(?=[\s<])/g)].map(([, h]) => Number(h)),
  }));
const aboutOf = (text) => text.match(/<description>([\s\S]*?)<\/description>/)[1].split('\n');

// One Placemark of the room, its points at 107 - 2.5 and 112 - 2.5 m, and the outline at 0 on
// the ground: no cellar, no tree. The description says the plot, the day, the raise and that it
// was tuned by eye, how near the places are, and what was left out - one block under the ground.
const lowered = houseFile(scene, at, -2.5, NOW);
assert.equal(lowered.under, 1);
assert.equal(lowered.parts, 1);
const marks = placemarksOf(lowered.text);
assert.deepEqual(
  marks.map(({ name, heights }) => [name, [...new Set(heights)].sort()]),
  [
    ['Room — wall', [104.5, 109.5]],
    ['Plot outline', [0]],
  ],
);
assert.ok(lowered.text.includes('<name>Check &amp; plot — house</name>'));
assert.deepEqual(aboutOf(lowered.text), [
  'The house of the sketch on Check &amp; plot, as White shows it in 3D, saved on 2026-10-15.',
  'Raised by -2.5 m, tuned by eye to Google Earth&apos;s ground.',
  'Places to within about 4.5 m, by swisstopo&apos;s approximate formulas from LV95 to WGS84.',
  'Left out: the objects, and the ground as the sketch shapes it, and 1 block under the ground.',
]);
// Not raised, it says so; with no box under the ground, it names none; with two, it counts them.
const flat = houseFile(builtOf([room, tree]), at, 0, NOW);
assert.deepEqual(aboutOf(flat.text).slice(1, 2), [
  'Not raised: its heights are the sketch&apos;s, in metres above sea level.',
]);
assert.match(aboutOf(flat.text)[3], /shapes it\.$/);
assert.equal(flat.under, 0);
const two = houseFile(builtOf([room, cellar, cellar]), at, 1, NOW);
assert.match(aboutOf(two.text)[3], /, and 2 blocks under the ground\.$/);

// What makes no file: a site that says no place, refused in the entry's sentence; a raise that
// is no number; no box above the ground - nothing wrong; and what kmlOf refuses, in its words.
const { originLV95, ...nowhere } = at;
assert.ok(originLV95);
assert.deepEqual(houseFile(scene, nowhere, 0, NOW), { refused: NO_PLACE });
assert.match(NO_PLACE, /does not say where it lies in the national grid/);
assert.deepEqual(houseFile(scene, at, null, NOW), { unraised: true });
assert.deepEqual(houseFile(builtOf([cellar, tree]), at, 0, NOW), { text: null });
assert.deepEqual(houseFile(scene, { ...at, originLV95: [600_000, 200_000] }, 0, NOW), {
  failed:
    'The place is no place of LV95: an east from 2 000 000 to under 3 000 000 and a north from 1 000 000 to under 2 000 000.',
});

// --- the made-up house ----------------------------------------------------------------------------
// Read as view3d/made-up-cut.check.js reads it: the sketch in a made-up store, the scripts that
// 3d.html loads before its module, the made-up site in site.js's place, and the scene of what
// read.js hands on, on the ground that the sketch shapes.
const pad = path.join(import.meta.dirname, '..');
const SKETCH = readFileSync(
  path.join(pad, '..', '..', 'tests', '__fixtures__', 'sketch', 'made-up.json'),
  'utf8',
);
const kept = new Map([['blockplot/sketch/space', SKETCH]]);
const store = { getItem: (key) => kept.get(key) ?? null, setItem() {} };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
Object.assign(globalThis, { location: { hash: '' }, views: { seen: {}, keep() {} } });
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual([scripts[0], scripts.at(-1)], ['site.js', 'views.js']);
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { read, site } = await import('../view3d/read.js');
assert.deepEqual([site.name, site.originLV95], ['Made-up hillside plot', [2_600_000, 1_200_000]]);
const { things, figures, land } = read();
const house = sceneOf(land, things, figures);

// BY HAND (tests/__fixtures__/CLAUDE.md, "What sketch/made-up.json holds"): eight boxes of the
// house - the lawn is ground and the cut a cut, no solid of the scene. A column c is x = c / 2 - 4
// m, a row r of the top view y = 28 - r / 2, a standing row z the height 826 - z / 2; the hill
// is 820 - 0.1 c - 0.02 r m. Seven are plainly above it: the night rooms (two boxes), the bath
// and the roof terrace have their floor at 817 m, over the hill; the day rooms and the porch
// reach 817 m, and the hill under them falls to 814.24 m and 813.48 m; the garden's top, 815 m,
// stands over its downhill corner, 813.32 m - and a lawn that raises the ground, by at most
// the 0.52 m it lifts the hill at its own corner beside it, does not reach that.
// THE STORE is the case. Columns 22 to 30, rows 24 to 32, from 814 m to its top at 816 m. The
// hill on its footprint is at its lowest at column 30, row 32: 816.36 m - over its top, and so
// it was wholly under the hill, and would be left out. But since the cut its corner at column
// 30, row 24 is bare: a free grid point of ground (the cell of column 29, row 23 is no cell of the
// house), two steps from the cut's corner at column 30, row 22, which the cut sets at its floor,
// 814 m - 2.56 m under the hill. A free point lies as far under the hill as the mean of its
// neighbours: with every other free neighbour no higher than the hill, that corner lies at least
// 0.51 m under the hill there, 816.52 m - and its neighbours lie under it too, along the whole
// cut's side, set 2.56 to 2.78 m under it. So the corner lies under the store's top, and the
// store stands above the ground: it is kept, and no box is left out. earth.js's sweeps put the
// corner at 814.28 m, between the cut's floor and the store's top.
const STORE = { name: 'Store', min: [7, 12, 814], max: [11, 16, 816] };
const corner = house.ground.heights[house.ground.ys.indexOf(16)][house.ground.xs.indexOf(11)];
assert.ok(corner > 814 && corner < 816, `the store's corner lies at ${corner} m`);
const EIGHT = [
  'Day rooms',
  'Glass porch',
  'Store',
  'Night rooms',
  'Night rooms',
  'Bath',
  'Roof terrace',
  'Garden',
];
assert.deepEqual(
  house.solids.filter(({ kind }) => kind === undefined).map(({ name }) => name),
  EIGHT,
);
const { min, max } = house.solids.find(({ name }) => name === STORE.name);
assert.deepEqual({ name: STORE.name, min, max }, STORE);
// Of the eight, the White model's 153 parts - floor 33, wall 44, pane 24, frame 32, roof 16,
// rail 4 - in the scene's order, as the scene's rules build them today (scene/house.js, RULES):
// a run, "<what it is> <how many>", is so many parts one after another. No object's part: no
// door, stair, tree or piece of furniture.
const RUNS = [
  ['Day rooms', 'floor 8, wall 15, pane 1'],
  ['Glass porch', 'floor 1, frame 9, pane 6, frame 7, pane 4, frame 7, pane 4, frame 9, pane 6'],
  ['Store', 'floor 4, roof 4, wall 5'],
  ['Night rooms', 'floor 12, roof 6, wall 3, pane 1, wall 3, pane 1, wall 3, pane 1, wall 4'],
  ['Night rooms', 'floor 3, roof 3, wall 5'],
  ['Bath', 'floor 3, roof 3, wall 6'],
  ['Roof terrace', 'floor 1, rail 2'],
  ['Garden', 'floor 1, rail 2'],
];
const PARTS = RUNS.flatMap(([block, runs]) =>
  runs.split(', ').flatMap((run) => {
    const [of, count] = run.split(' ');
    return Array(Number(count)).fill(`${block} — ${of}`);
  }),
);
const made = houseFile(house, site, 2.5, NOW);
assert.equal(made.under, 0);
assert.equal(made.parts, 153);
const madeMarks = placemarksOf(made.text);
assert.deepEqual(
  madeMarks.map(({ name }) => name),
  [...PARTS, 'Plot outline'],
);
// 917 faces: six a part, but for the one that comes down to an edge at one end: five. The 24
// panes are see-through white, every other part solid white, and no edge is drawn.
assert.equal(made.text.split('<Polygon>').length - 1, 917);
assert.equal(made.text.split('<styleUrl>#box-59ffffff</styleUrl>').length - 1, 24);
assert.equal(made.text.split('<styleUrl>#box-ffffffff</styleUrl>').length - 1, 153 - 24);
assert.ok(!made.text.includes('<LineStyle>') && !made.text.includes('innerBoundaryIs'));
// The lowest foot of a part is the day rooms' floor slab, 814 m, and the highest top the night
// rooms' roof, 820 m: each raised by 2.5 m in the file.
const heights = madeMarks.slice(0, -1).flatMap((mark) => mark.heights);
assert.deepEqual([Math.min(...heights), Math.max(...heights)], [816.5, 822.5]);
assert.match(aboutOf(made.text)[3], /shapes it\.$/);

process.stdout.write(
  'tools/sketch/kml: the raise of a typed text, kept for its plot; the house file holds a Placemark for each part of White of the blocks over the ground and the outline, says its raise and what it left out, and refuses a plot with no place - the made-up house, eight blocks and their 153 parts, the store bare by the cut among them\n',
);
