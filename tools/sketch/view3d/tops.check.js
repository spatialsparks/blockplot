// The check of a top that slopes, in the 3D view (story ST-026): a made-up sketch on the made-up
// plot, read by the pad's own scripts, and what the view makes of it, against figures worked
// out by hand. A block whose top slopes is read with its top - along the plot, across it, and
// of a box that was cut out of its plane - and a level block and an object with none: every
// thing of a sketch with no slope is the thing it was. Its solid says that top in metres. And
// in the Volumes it stands on the stage as what it is: from its foot up to its top and no
// further, in its colour, as see-through as a box, with lines along its own edges - beside a
// level block, which is the box it was. No browser, and nothing of the real site: site.js is
// never read. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { sceneOf } from '../scene/scene.js';
import { build } from './build.js';
import { frameOf } from './frame.js';

// A browser's two stores, and what the pad's scripts ask of the page beside them: read.js takes
// the pad's globals as it loads, so the pad's scripts are loaded first, in the page's order.
const KEY = 'blockplot/sketch/space';
const kept = new Map();
const store = { getItem: (key) => kept.get(key) ?? null, setItem() {} };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
globalThis.location = { hash: '' };
globalThis.views = { seen: {}, keep() {} };
for (const file of ['demo-site', 'paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy']) {
  await import(`../${file}.js`);
}

// A made-up sketch: five blocks of 8 rows across the plot and 6 rows high, side by side, and a
// bed. A slope is a plane on the paper (docs/STORAGE_FORMAT.md): two lines of the grid, and the
// row of a standing view the top lies in at each.
// - the first falls down the plot, from its own top, row 12, at its first column to row 16 at
//   its last;
// - the second falls up the paper's rows, the other way round: at its first row, 22, it lies
//   in row 18 - on its floor - and at its last in row 12, its own top;
// - the third was cut out of a plane that begins a column before it, row 12 at column 52 and
//   row 16 at column 60: at its own first column, 53, the top lies in row 12.5;
// - the fourth is level, and green as the second is;
// - the fifth says a plane that lies wholly over it: its top is level.
const same = { y: [22, 30], z: [12, 18] };
const drawn = [
  { x: [30, 40], ...same, colour: 2, name: 'Shed', slope: { x: [30, 40], z: [12, 16] } },
  { x: [42, 50], ...same, colour: 4, slope: { y: [22, 30], z: [18, 12] } },
  { x: [53, 60], ...same, colour: 2, group: 3, slope: { x: [52, 60], z: [12, 16] } },
  { x: [62, 68], ...same, colour: 4, name: 'Level' },
  { x: [70, 76], ...same, colour: 2, slope: { x: [70, 76], z: [6, 10] } },
  { kind: 'bed', x: 20, y: 20, floor: 30 },
];
const asKept = (things) => JSON.stringify({ space: 6, things, floors: [], notes: [], on: {} });
kept.set(KEY, asKept(drawn));
await import('../sketch.js');
const { read, site } = await import('./read.js');
const { things, trouble } = read();
assert.deepEqual([trouble, things.length], ['', 6]);

// WHAT IS READ. A block whose top slopes says `top`: the axis it slopes along, and the row it
// lies in at the first end of its box along that axis and at the second - what the pad says of
// the box (`blocks.topOf`), whole or not. All else of it is what it was.
const [shed, wedge, cut, level, plain, bed] = things;
const [orange, green] = [
  { name: 'orange', hex: '#f08c00' },
  { name: 'green', hex: '#5a9e4b' },
];
const block = (x, colour, more) => ({ x, ...same, colour, as: 'room', ...more });
assert.deepEqual(
  shed,
  block([30, 40], orange, { name: 'Shed', top: { axis: 'x', rows: [12, 16] } }),
);
assert.deepEqual(wedge, block([42, 50], green, { top: { axis: 'y', rows: [18, 12] } }));
assert.deepEqual(cut, block([53, 60], orange, { group: 3, top: { axis: 'x', rows: [12.5, 16] } }));
things.forEach((thing, at) => {
  assert.deepEqual(thing.top ?? null, globalThis.blocks.topOf(drawn[at]), `thing ${at}`);
});
// A level block says none, and neither does one whose plane leaves it level, nor an object.
assert.deepEqual(level, block([62, 68], green, { name: 'Level' }));
assert.deepEqual(plain, block([70, 76], orange));
assert.deepEqual(Object.keys(bed).sort(), ['fill', 'floor', 'kind', 'turn', 'x', 'y', 'z']);
// And every thing of a sketch with no slope is the thing it was: the same sketch without its
// planes, read again as another window leaves it, is the same things but for that one word.
const without = (thing, key) =>
  Object.fromEntries(Object.entries(thing).filter(([name]) => name !== key));
kept.set(KEY, asKept(drawn.map((thing) => without(thing, 'slope'))));
assert.deepEqual(
  read(true).things,
  things.map((thing) => without(thing, 'top')),
);

// ITS SOLID, in metres of the made-up plot: a column is 2 * (x + 4), a row of the top view
// 2 * (28 - y), a row of a standing view 2 * (826 - height). The shed: x from 11 to 16, y from
// 13 to 17, 817 m to 820 m - and its top at 820 m where x is 11, at 818 m where x is 16. The
// wedge: x from 17 to 21. Its first row is the larger y, so the top is turned over: 820 m at
// y = 13, and down on its floor, 817 m, at y = 17. The third: 819.75 m, then 818 m.
const scene = sceneOf(site, things);
const [first, second, third, fourth, fifth, sixth] = scene.solids;
assert.deepEqual(first, {
  min: [11, 13, 817],
  max: [16, 17, 820],
  top: { along: 0, high: [820, 818] },
  colour: '#f08c00',
  name: 'Shed',
  block: 1,
  floor: 817,
  see: 'solid',
});
assert.deepEqual(
  [second.min, second.max, second.top],
  [[17, 13, 817], [21, 17, 820], { along: 1, high: [820, 817] }],
);
assert.deepEqual([second.see, third.top], ['through', { along: 0, high: [819.75, 818] }]);
for (const solid of [fourth, fifth, sixth]) assert.ok(!('top' in solid));
assert.deepEqual(
  [fourth.min, fourth.max],
  [
    [27, 13, 817],
    [30, 17, 820],
  ],
);

// ON THE STAGE, in the Volumes. A frame, made up: heights count from 810 m, so the plot's
// [x, y, h] lies on the stage at [x, h - 810, -y].
const place = frameOf({ box: { min: [0, 0, 810] } });
const built = build(scene, place);
const [down, across, , box, other] = built.solids;
assert.equal(built.solids.length, 6);
/** The places of a shape's points, each once, as words. */
const placesOf = ({ geometry }) => {
  const points = geometry.getAttribute('position');
  const places = Array.from({ length: points.count }, (_, at) =>
    [points.getX(at), points.getY(at), points.getZ(at)].join(' '),
  );
  return [...new Set(places)].sort();
};
const onStage = (...corners) => corners.map((corner) => place(corner).join(' ')).sort();
/** How much a mesh holds, added up from its triangles: more than nothing only where they run against the clock, seen from outside. */
const holds = ({ geometry }) => {
  const [points, corners] = [geometry.getAttribute('position'), geometry.getIndex()];
  const at = (n) => ['getX', 'getY', 'getZ'].map((get) => points[get](corners.getX(n)));
  let sum = 0;
  for (let n = 0; n < corners.count; n += 3) {
    const [[a, b, c], [d, e, f], [g, h, i]] = [at(n), at(n + 1), at(n + 2)];
    sum += (a * (e * i - f * h) + b * (f * g - d * i) + c * (d * h - e * g)) / 6;
  }
  return sum;
};
// The shed reaches from its foot to its top and no further: its eight corners are the four of
// its foot, 7 m up the stage, two at 10 m where the plot's x is 11, and two at 8 m where it
// is 16. Where the box would have its two other corners, 10 m up at x = 16, it has none. Its
// points lie where the frame puts them - the mesh is not moved and not stretched - and it
// holds 5 m by 4 m by a mean height of 2 m: 40 cubic metres, its faces looking outward.
const shedCorners = onStage(
  [11, 13, 817],
  [11, 17, 817],
  [16, 13, 817],
  [16, 17, 817],
  [11, 13, 820],
  [11, 17, 820],
  [16, 13, 818],
  [16, 17, 818],
);
assert.deepEqual(placesOf(down), shedCorners);
assert.deepEqual(shedCorners.slice(0, 2), ['11 10 -13', '11 10 -17']);
assert.ok(!placesOf(down).includes('16 10 -13'));
assert.deepEqual(
  [down.position.toArray(), down.scale.toArray()],
  [
    [0, 0, 0],
    [1, 1, 1],
  ],
);
assert.ok(Math.abs(holds(down) - 40) < 1e-4, `the shed holds ${holds(down)}`);
// The wedge comes down to its floor where the plot's y is 17: it ends in an edge there, and
// has six corners. 4 m by 4 m by a mean height of 1.5 m: 24 cubic metres.
const wedgeCorners = onStage(
  [17, 13, 817],
  [21, 13, 817],
  [17, 17, 817],
  [21, 17, 817],
  [17, 13, 820],
  [21, 13, 820],
);
assert.deepEqual(placesOf(across), wedgeCorners);
assert.ok(Math.abs(holds(across) - 24) < 1e-4, `the wedge holds ${holds(across)}`);
// Each is in its block's colour, by the very face a level block of that colour has: the green
// one as see-through as the green box beside it. And each has thin lines along its edges, as
// a box has them, in a box's ink: the twelve edges of the shed, and the nine of the wedge -
// every one from a corner of the solid to another, and so none where a box would have one.
assert.ok(down.material === other.material && across.material === box.material);
const { color, transparent } = down.material;
assert.deepEqual([`#${color.getHexString()}`, transparent], ['#f08c00', false]);
const { opacity, depthWrite } = across.material;
assert.deepEqual([across.material.transparent, opacity < 1, depthWrite], [true, true, false]);
for (const [solid, corners, edges] of [
  [down, shedCorners, 12],
  [across, wedgeCorners, 9],
]) {
  assert.ok(solid.isMesh && solid.children.length === 1);
  const [lines] = solid.children;
  assert.ok(lines.isLineSegments);
  assert.equal(lines.material, box.children[0].material);
  assert.equal(lines.geometry.getAttribute('position').count, edges * 2);
  assert.deepEqual(placesOf(lines), corners);
}
// A level block is built as it was: the one box of every scene, as large as its own. The
// fourth, by hand: its middle at [28.5, 8.5, -15], 3 m along the plot, 3 m high, 4 m across.
assert.ok(box.geometry.type === 'BoxGeometry' && box.geometry === other.geometry);
assert.deepEqual([...box.position.toArray(), ...box.scale.toArray()], [28.5, 8.5, -15, 3, 3, 4]);
assert.equal(box.children[0].geometry.getAttribute('position').count, 12 * 2);
// A sloping one has a shape of its own, and so have its lines.
assert.ok(down.geometry !== across.geometry && down.geometry.type === 'BufferGeometry');
assert.notEqual(down.children[0].geometry, box.children[0].geometry);

// In the sun a sloping solid casts shadows and takes them where it is not see-through, as a
// box does, and its lines do neither.
const sunny = build(scene, place, { sun: true }).solids;
assert.deepEqual(
  [sunny[0], sunny[1], sunny[0].children[0]].map((one) => [one.castShadow, one.receiveShadow]),
  [
    [true, true],
    [false, false],
    [false, false],
  ],
);
// What was made for one scene alone is given back with it: the shape of a sloping solid and
// of its lines, with the land's. The shape of a box is every scene's, and stays.
const gone = [];
for (const [name, { geometry }] of [
  ['shed', down],
  ['its lines', down.children[0]],
  ['wedge', across],
  ['its lines', across.children[0]],
  ['box', box],
  ['ground', built.ground],
]) {
  geometry.addEventListener('dispose', () => gone.push(name));
}
built.dispose();
assert.deepEqual(gone.sort(), ['ground', 'its lines', 'its lines', 'shed', 'wedge']);
// And where the parts of the house stand in the solids' place, no solid is built: there a
// block is what the scene's rules build under its top, sloping or level (scene/).
assert.deepEqual(build(scene, place, { parts: true }).solids, []);

process.stdout.write(
  'tools/sketch/view3d: a block whose top slopes is read with its top, says it in metres, and stands in the volumes from its foot to its top, with lines along its own edges\n',
);
