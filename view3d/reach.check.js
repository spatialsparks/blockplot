// The check of how far the 3D page draws the ground, and how fine (story ST-042, reach.js): the
// pad's own scripts - the ones 3d.html names, in its order - on the made-up plot, with every
// golden sketch: the land, the scene's ground and its meshes as they were. Then one box beyond
// the paper's downhill end, by hand: one near rectangle around it of the ground at the paper's
// edge, none drawn under the box, the ground drawn 73 m beyond the paper, flat squares between,
// and their skirts behind the ground on the stage, on a layer the shade in corners does not see.
// Then a made-up plot of version 3 of 1 km, the rough hillside of squares.check.js, with a house
// of two boxes in its middle: every far square at the paper's ground, none on a near rectangle,
// none larger than a sixteenth of its distance, within 600 000 triangles and a second; and blocks
// 1 km apart make two near rectangles. No browser, nothing of a real plot. Run by check.js.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { BEFORE, VERSION, golden } from '../check-golden.js';
import { drawnBox, groundMesh, hillMesh, landOf as meshesOf } from '../scene/ground.js';
import { sceneOf } from '../scene/scene.js';
import { build } from './build.js';
import { frameOf } from './frame.js';
import { FAR_SHARE, NEAR_M, reachOf } from './reach.js';
import { SIGHT_M, UNDER, sightOf } from './stage.js';

const KEY = 'blockplot/sketch/space';
const kept = new Map();
const store = { getItem: (key) => kept.get(key) ?? null, setItem() {} };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
Object.assign(globalThis, { location: { hash: '' }, views: { seen: {}, keep() {} } });
const pad = path.join(import.meta.dirname, '..');
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { read } = await import('./read.js');
const { SITE, paper, squares, windows } = globalThis;
assert.deepEqual(
  [NEAR_M, FAR_SHARE, paper.COLS, paper.ACROSS, paper.WHOLE],
  [20, 1 / 16, 92, 62, true],
);

/** The rectangle `[left, top, right, bottom]` of a far square; whether two rectangles share a cell. */
const rectOf = ([c0, r0, c1, r1]) => [c0, r0, c1, r1];
const overlaps = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const area = ([l, t, r, b]) => (r - l) * (b - t);
/** Every far square at the paper's ground, and the far squares and near rects tiling what is drawn. */
function tiles({ near, far }, drawn, at) {
  for (const [c0, r0, c1, r1, ...heights] of far) {
    assert.deepEqual(heights, [at(c0, r0), at(c1, r0), at(c0, r1), at(c1, r1)]);
    assert.ok(near.every(({ rect }) => !overlaps(rectOf([c0, r0, c1, r1]), rect)));
  }
  const sum = [...far.map(rectOf), ...near.map(({ rect }) => rect)].reduce(
    (s, r) => s + area(r),
    0,
  );
  assert.equal(
    sum,
    area(drawn),
    'the far squares and the near rectangles do not fill what is drawn',
  );
}

// EVERY GOLDEN SKETCH on the made-up plot: the land as read.js handed it on before - the site
// itself, or with the paper's very grid - and the scene's ground and meshes of it as they were.
const grey = { name: 'grey', hex: '#8795a1' };
for (const version of [...BEFORE, VERSION]) {
  for (const name of ['made-up', 'every-part']) {
    kept.set(KEY, golden(name, version));
    const { things, figures, land, trouble } = read(true);
    assert.deepEqual([trouble, things.length > 0], ['', true], `${name} of version ${version}`);
    const heights = paper.shaped() ?? paper.grid();
    if (heights === null) assert.equal(land, SITE, `${name} of version ${version}`);
    else assert.deepEqual([land.ground.heights === heights, land.ground.near], [true, undefined]);
    const scene = sceneOf(land, things, figures);
    assert.equal(scene.ground.near, undefined);
    const meshes = meshesOf(scene.ground, scene.box.min[2]);
    assert.deepEqual(meshes.top, groundMesh(scene.ground));
    assert.deepEqual(meshes.hill, hillMesh(scene.ground, scene.box.min[2]));
    assert.deepEqual(drawnBox(scene.ground, scene.box), scene.box);
    assert.equal(sightOf(scene.box), SIGHT_M[1]);
  }
}

// ONE BOX BEYOND THE PAPER: columns 148 to 198 - 28 to 53 m past its downhill edge, column 92 -
// and rows 16 to 46. Widened by 40 cells it is columns 108 to 238 and rows -24 to 86, which
// neither touches the paper, 92 columns by 62 rows: two near rectangles, the box's first, by its
// top. What is drawn holds both, columns 0 to 238 and rows -24 to 86: it reaches 146 cells past
// the downhill edge, 73 m - and 12 m past either side.
const BOX = { x: [148, 198], y: [16, 46], z: [26, 32], colour: 6 };
kept.set(KEY, JSON.stringify({ space: VERSION, things: [BOX], floors: [], notes: [], on: {} }));
const { things, land } = read(true);
const { near, far, beyond, at } = land.ground;
assert.deepEqual(
  [near.map(({ rect }) => rect), beyond, at],
  [
    [
      [108, -24, 238, 86],
      [0, 0, 92, 62],
    ],
    73,
    paper.groundAt,
  ],
);
// The box's near grid is the ground at the paper's edge, at every one of its grid points: no
// block of ground, so the paper's ground is the site's own.
near[0].heights.forEach((line, row) =>
  line.forEach((height, column) => assert.equal(height, paper.realAt(92, row - 24), `${column}`)),
);
assert.equal(near[0].heights.length * near[0].heights[0].length, 111 * 131);
tiles(land.ground, [0, -24, 238, 86], at);
// Between the paper and the box the far squares are flat along the plot.
const between = far.filter(([c0, , c1]) => c0 >= 92 && c1 <= 108);
assert.ok(
  between.length > 0 && between.every(([, , , , h00, h10, h01, h11]) => h00 === h10 && h01 === h11),
);
// The scene: no ground under the box, 50 by 30 cells; the paper's grid as it was; its box the
// box, the outline and the near grids, and the sight reaching every far square too.
const scene = sceneOf(
  land,
  things.map((thing) => ({ ...thing, colour: grey })),
);
const [boxGrid, paperGrid] = scene.ground.near;
assert.equal(boxGrid.drawn.flat().filter((there) => !there).length, 50 * 30);
assert.ok(
  boxGrid.drawn.slice(40, 70).every((cells) => cells.slice(40, 90).every((there) => !there)),
);
assert.deepEqual(paperGrid, sceneOf(SITE, []).ground);
assert.deepEqual([scene.box.min[0], scene.box.max[0], scene.box.max[1]], [-4, 115, 40]);
const all = drawnBox(scene.ground, scene.box);
assert.ok(sightOf(all) >= 2 * Math.hypot(...all.min.map((low, axis) => all.max[axis] - low)));
// Its meshes: two triangles a cell drawn and a far square; the earth lighter beyond the paper,
// that is every point but the paper's own grid; a skirt from every edge of a far square.
const { top, hill, skirts } = meshesOf(scene.ground, scene.box.min[2]);
const drawnCells = scene.ground.near.flatMap((grid) => grid.drawn.flat()).filter(Boolean).length;
assert.equal(top.indices.length / 3, 2 * drawnCells + 2 * far.length);
const paperPoints = 93 * 63;
assert.deepEqual(
  [top.light.slice(0, -4 * far.length).filter((light) => light === 0).length],
  [paperPoints],
);
const farLight = far.map(([c0, r0, c1, r1]) => Number(c0 >= 92 || r0 >= 62 || c1 <= 0 || r1 <= 0));
assert.deepEqual(
  top.light.slice(-4 * far.length),
  farLight.flatMap((light) => [light, light, light, light]),
);
assert.ok(skirts.indices.length / 3 > 8 * far.length);
// The hill: the walls of the box's pit, 2 x (50 + 30) of them, and the base - two triangles each.
assert.equal(hill.indices.length, (2 * (50 + 30) + 1) * 2 * 3);
// On the stage the skirts are a child of the hill, drawn behind the ground where the hill's
// walls are drawn ahead of it: ahead, the top of each skirt drew a dark line across the ground
// along every edge of a far square - the stripes of the T-042.5 Look.
const { hill: dug } = build(scene, frameOf(scene));
const [hung] = dug.children;
assert.equal(hung.geometry.getIndex().count, skirts.indices.length);
assert.ok(hung.material.polygonOffsetFactor > 0 && hung.material.polygonOffsetUnits > 0);
assert.ok(dug.material.polygonOffsetFactor < 0 && dug.material.polygonOffsetUnits < 0);
// And on a layer of their own, which the shade in corners does not see (stage.js, `UNDER`).
assert.deepEqual([hung.layers.isEnabled(UNDER), hung.layers.isEnabled(0)], [true, false]);

// A PLOT OF 1 KM, of version 3: squares.check.js's rough hillside - falling 0.45 m a metre, value
// noise of 6 octaves, banks every 30 m, a ravine every 260 m, 3 cm of micro-relief - by its rule.
const SIDE = 2000;
const WIDE = SIDE + 1;
function hash(i, j, octave) {
  let h = Math.imul(i, 0x27d4eb2d) ^ Math.imul(j, 0x165667b1) ^ Math.imul(octave + 1, 0x3c6ef372);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}
const smooth = (f) => f * f * (3 - 2 * f);
function noise(xM, yM, stepM, highCm, octave) {
  const [gx, gy] = [xM / stepM, yM / stepM];
  const [i, j] = [Math.floor(gx), Math.floor(gy)];
  const [u, v] = [smooth(gx - i), smooth(gy - j)];
  const [a, b] = [hash(i, j, octave), hash(i + 1, j, octave)];
  const [c, d] = [hash(i, j + 1, octave), hash(i + 1, j + 1, octave)];
  const above = a + (b - a) * u;
  return (above + (c + (d - c) * u - above) * v) * highCm;
}
function hillCm(column, row) {
  const [xM, yM] = [column / 2, row / 2];
  let cm = 60_000 - 45 * xM;
  for (let octave = 0; octave < 6; octave += 1) {
    cm += noise(xM, yM, 64 / 2 ** octave, 400 / 2 ** octave, octave);
  }
  const along = xM - 8 * Math.sin((2 * Math.PI * yM) / 120);
  const banks = Math.floor(along / 30);
  cm -= 150 * (banks + Math.min(1, along - 30 * banks));
  const off = Math.abs(yM - 260 * Math.round(yM / 260));
  if (off < 12) cm -= 800 * (1 - (off / 12) ** 2);
  return Math.round(cm + (hash(column, row, 99) - 0.5) * 6);
}
const hillside = new Float64Array(WIDE * WIDE);
for (let i = 0; i < hillside.length; i += 1) hillside[i] = hillCm(i % WIDE, Math.floor(i / WIDE));
const ground = { baseM: 0, ...squares.make(hillside, SIDE, SIDE) };
const outline = [
  [10, 10],
  [990, 10],
  [990, 990],
  [10, 990],
];
const LARGE = {
  ...SITE,
  xFromM: 0,
  xToM: 1000,
  yFromM: 0,
  yToM: 1000,
  sideM: [0, 800],
  outline,
  ground,
};
delete LARGE.officialAreaM2;
globalThis.SITE = LARGE;
await import('../paper.js?large');
const large = { site: LARGE, paper: globalThis.paper, squares, windows };
assert.equal(large.paper.WHOLE, false);

// A house of two boxes in its middle: 10 m by 10 m, and 12 m by 5 m against it. Widened by 40
// cells and made one, the near rectangle is columns 940 to 1064 and rows 950 to 1050.
const HOUSE = [
  { x: [980, 1000], y: [990, 1010], z: [0, 6], colour: grey },
  { x: [1000, 1024], y: [996, 1006], z: [0, 6], colour: grey },
];
const started = performance.now();
const reached = reachOf(
  large,
  HOUSE.map(({ x, y }) => [x[0], y[0], x[1], y[1]]),
);
const big = sceneOf({ ...LARGE, ground: { ...reached, at: large.paper.groundAt } }, HOUSE);
const built = meshesOf(big.ground, big.box.min[2]);
const took = performance.now() - started;
assert.deepEqual(
  [reached.near.map(({ rect }) => rect), reached.beyond],
  [[[940, 950, 1064, 1050]], 0],
);
tiles(reached, [0, 0, SIDE, SIDE], large.paper.groundAt);
// No far square larger than a sixteenth of its distance from the near rectangle, but a cell.
const [nl, nt, nr, nb] = reached.near[0].rect;
for (const [c0, r0, c1, r1] of reached.far) {
  const apart = Math.hypot(Math.max(nl - c1, c0 - nr, 0), Math.max(nt - r1, r0 - nb, 0));
  assert.ok(c1 - c0 === 1 || c1 - c0 <= FAR_SHARE * apart, `${c0} ${r0} ${c1} ${r1}`);
}
const triangles =
  (built.top.indices.length + built.hill.indices.length + built.skirts.indices.length) / 3;
assert.ok(triangles < 600_000, `${triangles} triangles`);
assert.ok(took < 1000, `built in ${took} ms`);

// Blocks 1 km apart: one at the paper's uphill end, one just past its downhill end - two near
// rectangles, not one of a kilometre; what is drawn reaches 30 m past the paper.
const APART = [
  [0, 990, 20, 1010],
  [2000, 990, 2020, 1010],
];
const apart = reachOf(large, APART);
const rects = [
  [-40, 950, 60, 1050],
  [1960, 950, 2060, 1050],
];
assert.deepEqual([apart.near.map(({ rect }) => rect), apart.beyond], [rects, 30]);
tiles(apart, [-40, 0, 2060, SIDE], large.paper.groundAt);

process.stdout.write(
  `tools/sketch/view3d: the ground of every golden sketch is drawn as it was; a box beyond the paper stands on flat ground drawn 73 m past it; a kilometre is ${reached.far.length} far squares around a near grid, ${triangles} triangles built in ${Math.round(took)} ms\n`,
);
