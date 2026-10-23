// The check of a straight staircase's steps (story ST-037, rules 2 and 3): how many a flight has
// and how large they are, by hand - one with a length of its own by the rule of the stride, one
// with none as before - through the pad's `shapes.stepsOf` (stairs.js) and its words under the
// paper and of what is selected (footer.js); the scene's flight built so (steps.js), counted and
// measured from its parts; the pad and the scene on one count at every size in range; and
// `stepsOf` of what is no flight. The pad's own scripts on a made-up store and the made-up plot,
// a made-up plot for the scene: no browser, nothing of the real site. Run by tools/sketch/check.js,
// or alone: pnpm exec node tools/sketch/scene/flight-steps.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { VERSION } from '../check-golden.js';
import { sceneOf } from './scene.js';
import { RISE_M, STRIDE_M, steps } from './steps.js';

// A browser's two stores; the pad from above, on a sketch that holds one staircase on level 18.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const FLOOR = 18;
const blank = { space: VERSION, things: [], floors: [FLOOR], notes: [], on: { top: FLOOR } };
local.held.set('blockplot/sketch/space', JSON.stringify({ ...blank, show: { top: {} } }));
globalThis.location = { hash: '#top' };
await import('../demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const SCRIPTS = ['paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch'];
for (const file of [...SCRIPTS, 'stairs', 'footer']) await import(`../${file}.js`);
const { shapes, sketch, footer } = globalThis;

// THE RULE, by hand. (2h + L) / 0.63, the whole number nearest it, and each rise h / n and each
// going L / n: 3 m by 4.5 m, 10.5 / 0.63 = 16.667, 17 steps of 17.647 by 26.471 cm; 2.5 m by 6 m,
// 11 / 0.63 = 17.460, 17 of 14.706 by 35.294 cm; 2.8 m by 4.5 m, 10.1 / 0.63 = 16.032, 16 of 17.5
// by 28.125 cm; 3 m by 6.5 m, 12.5 / 0.63 = 19.841, 20 of 15 by 32.5 cm; 3 m by 5.5 m, 11.5 /
// 0.63 = 18.254, 18 of 16.667 by 30.556 cm. With no length of its own, the fewest steps that
// rise 0.19 m at the most, over the flight's length: 3 m, 16 of 18.75 cm over 4.5 m, 28.125 cm;
// 2.8 m, 2.8 / 0.19 = 14.7, 15 of 18.667 cm over 4.5 m, 30 cm; 2 m, 2 / 0.19 = 10.5, 11 of
// 18.182 cm over 3.5 m, 31.818 cm. The words round each to a tenth of a centimetre, no ".0".
assert.deepEqual([STRIDE_M, RISE_M], [0.63, 0.19]);
const TABLE = [
  [3, 4.5, true, 17, '17 steps, each 17.6 cm by 26.5 cm'],
  [2.5, 6, true, 17, '17 steps, each 14.7 cm by 35.3 cm'],
  [2.8, 4.5, true, 16, '16 steps, each 17.5 cm by 28.1 cm'],
  [3, 6.5, true, 20, '20 steps, each 15 cm by 32.5 cm'],
  [3, 5.5, true, 18, '18 steps, each 16.7 cm by 30.6 cm'],
  [3, 4.5, false, 16, '16 steps, each 18.8 cm by 28.1 cm'],
  [2.8, 4.5, false, 15, '15 steps, each 18.7 cm by 30 cm'],
  [2, 3.5, false, 11, '11 steps, each 18.2 cm by 31.8 cm'],
];
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a}, not ${b}`);
const staircase = (kind, high, long, own, turn) => ({
  kind,
  x: 30,
  y: 20,
  floor: FLOOR,
  high,
  ...(own && { long }),
  ...(turn && { turn }),
});
for (const [high, long, own, count, said] of TABLE) {
  for (const kind of shapes.FLIGHTS) {
    const deep = shapes.KINDS[kind].size[1];
    const name = shapes.KINDS[kind].name;
    for (const turn of [0, 1]) {
      const thing = staircase(kind, high, long, own, turn);
      const what = `${kind} ${high} m by ${long} m, ${own ? 'its own' : 'its flight'}, turn ${turn}`;
      const got = shapes.stepsOf(thing);
      assert.equal(got.count, count, what);
      near(got.rise, high / count, what);
      near(got.going, long / count, what);
      // The line under the paper with Select over it, and the words of it selected.
      sketch.doc.things = [thing];
      const [along, across] = turn ? [deep, long] : [long, deep];
      const area = String(Number((long * deep).toFixed(2)));
      const line = `a ${name.toLowerCase()} of ${along} m by ${across} m, ${area} m²; ${said}`;
      const under = footer.measure([30, 20], null, { at: 0 });
      assert.ok(under.endsWith(` — ${line}`), `${what}: ${under}`);
      const words = `${name}: ${along} m by ${across} m, ${high} m high, ${said}, on the level at 817 m. R turns it.`;
      assert.equal(footer.picked(thing).words, words, what);
    }
  }
}
// What is no straight flight has no steps to say, and its words are those of before.
for (const kind of ['spiral', 'chair']) assert.equal(shapes.stepsOf({ kind, floor: FLOOR }), null);
const spiral = { kind: 'spiral', x: 30, y: 20, floor: FLOOR };
const spiralSaid = 'Spiral staircase, one storey: 2 m by 2 m, 3 m high, on the level at 817 m.';
assert.equal(footer.picked(spiral).words, `${spiralSaid} R turns it.`);

// THE SCENE. A made-up plot of 20 m by 12 m in cells of half a metre: a column is x = column / 2,
// a row of the top view y = 12 - row / 2, a level 120 - level / 2 metres above sea level; its
// ground is flat at 104.75 m, in level 30.5. A flight not turned on the ground there, in rows 2
// to 4 - from y = 11 to 10 - from column 4, x = 2, climbs towards the larger x from its foot at
// 104.75 m.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 20,
  yFromM: 0,
  yToM: 12,
  sideM: [100, 120],
  outline: [
    [1, 11],
    [19, 11],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(25).fill(Array(41).fill('475').join(' ')) },
};
// The house's figures, which no part of a flight on the ground asks of; but without them a scene
// has no parts.
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.375,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.5,
  sillHighM: 1,
};
const FOOT = 104.75;
const alone = { blocks: [], kinds: steps };
const flight = (long, high, own) => ({
  x: [4, 4 + 2 * long],
  y: [2, 4],
  z: [30.5 - 2 * high, 30.5],
  kind: 'stairs',
  turn: 0,
  fill: '#eceff2',
  floor: 30.5,
  ...(own && { long }),
});
const built = (long, high, own) =>
  sceneOf(site, [flight(long, high, own)], figures, alone).parts.filter((part) => part.thing === 0);

// WITH A LENGTH OF ITS OWN: 17 steps at 3 m by 4.5 m and at 2.5 m by 6 m, each a rise higher than
// the one before and a going on, side by side from x = 2 to the flight's end.
for (const [high, long] of [
  [3, 4.5],
  [2.5, 6],
]) {
  const parts = built(long, high, true);
  assert.equal(parts.length, 17, `${high} m by ${long} m`);
  parts.forEach((part, before) => {
    const what = `step ${before} of ${high} m by ${long} m`;
    near(part.min[2], FOOT, what);
    near(part.max[2] - FOOT, ((before + 1) * high) / 17, what);
    near(part.min[0], 2 + (before * long) / 17, what);
    near(part.max[0], 2 + ((before + 1) * long) / 17, what);
    assert.deepEqual([part.min[1], part.max[1]], [10, 11], what);
  });
}
// WITH NONE, at 3 m, as before: sixteen steps of 0.1875 m over 4.5 m, each 0.28125 m deep - the
// first from x = 2 to 2.28125 and up to 104.9375 m, the last to x = 6.5 and up to 107.75 m.
const before = built(4.5, 3, false);
assert.equal(before.length, 16);
before.forEach((part, nth) => {
  const at = { min: [2 + nth * 0.28125, 10, FOOT], max: [2 + (nth + 1) * 0.28125, 11] };
  at.max.push(FOOT + (nth + 1) * 0.1875);
  assert.deepEqual([part.of, part.shape, part.surface], ['step', 'box', 'concrete']);
  assert.deepEqual([part.min, part.max], [at.min, at.max], `step ${nth} of before`);
});

// ONE COUNT, the pad's and the scene's, at every height from 2 to 4.5 m in 5 cm and every length
// from 2 to 8 m in half metres, and at every height with no length of its own: whoever changes
// the rule on one side alone fails here.
for (let twentieths = 40; twentieths <= 90; twentieths += 1) {
  const high = twentieths / 20;
  const flightLong = shapes.sizeOf({ kind: 'stairs', high })[0];
  const sizes = [[flightLong, false]];
  for (let halves = 4; halves <= 16; halves += 1) sizes.push([halves / 2, true]);
  for (const [long, own] of sizes) {
    const pad = shapes.stepsOf(staircase('stairs', high, long, own, 0)).count;
    assert.equal(built(long, high, own).length, pad, `${high} m by ${long} m, own: ${own}`);
  }
}

process.stdout.write('flight-steps.check: the steps of a straight staircase hold\n');
