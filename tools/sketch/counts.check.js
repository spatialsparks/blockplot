// The check of ground, the fourth thing a block counts as (story ST-027; version 5 of the sketch
// file). What `blocks.countsAs` answers of the fourth word: by `is`, against every kind of name,
// and by a name that holds "ground fill" - asked before glass and open air - and of what is
// none. The golden file of version 5, which holds each of the four words once: its block of
// ground, as the pad's own strokes write it. The key C, six steps round on a block of two boxes
// - the fifth a cut (story ST-028) - with the sketch byte for byte as it was after the sixth,
// and Undo the same way back. And what the pad says of a block of ground, word for word, in a
// standing view and from above: no floor, no height and no volume, but how high its top lies
// above sea level, level or sloping - beside a room, of which every word is the one it was.
// What the ground does with such a block is earth.check.js's, and the checks' after it.
// The pad's own scripts on a made-up store and the made-up plot: no browser, nothing of the real
// site. Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/counts.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from './check-golden.js';

// A browser's two stores. The scripts that read the paper are loaded anew for each view: what
// the pad says of a block differs between a standing view and the view from above.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
await import('./demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'strokes', 'labels'];
let loads = 0;
/** The pad's sketch, loaded anew in a view of the made-up plot, on a store that holds this text: with what a tool does to it, the key C, and what the pad says in words. */
async function pad(view, text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  globalThis.location = { hash: `#${view}` };
  loads += 1;
  for (const file of [...SCRIPTS, 'footer']) await import(`./${file}.js?${loads}`);
  assert.equal(globalThis.paper.VIEW, view);
  return globalThis.sketch;
}

// --- what a block counts as: the fourth word ---------------------------------------------------------
for (const file of ['categories', 'blocks']) await import(`./${file}.js`);
const { countsAs } = globalThis.blocks;
// BY `is`. A box that says ground is ground, against every kind of name: a room's, open air's,
// glass's - and with a name that says so too. And a block named "Ground Fill" is whatever a box
// of it says: `is` is read before the name, each of the four.
const NAMED = { room: 'Bath', open: 'Garden', glass: 'Greenhouse', ground: 'Ground Fill' };
for (const [as, name] of Object.entries(NAMED)) {
  assert.deepEqual(countsAs([{ name }]), { as, by: 'name' }, name);
  assert.deepEqual(countsAs([{ name, is: 'ground' }]), { as: 'ground', by: 'is' }, name);
  assert.deepEqual(countsAs([{ name: 'Ground Fill', is: as }]), { as, by: 'is' }, as);
}
// So without a name. Of several boxes the first that says one of the four counts, wherever the
// name stands: ground before a room, and glass before ground.
assert.deepEqual(countsAs([{ is: 'ground' }]), { as: 'ground', by: 'is' });
const several = [{ name: 'Garden' }, { is: 'ground' }, { name: 'Bath', is: 'room' }];
assert.deepEqual(countsAs(several), { as: 'ground', by: 'is' });
const glazed = [{ name: 'Ground Fill' }, { is: 'glass' }, { is: 'ground' }];
assert.deepEqual(countsAs(glazed), { as: 'glass', by: 'is' });
// Anything else under `is` says nothing, the word in capitals and the two words of a name too:
// the name is read, and a later box that says ground counts.
const NO_WORDS = ['Ground', 'GROUND', ' ground', 'ground ', 'ground fill', 'earth', 'fill', ''];
for (const is of [...NO_WORDS, 4, null, true, ['ground'], { as: 'ground' }]) {
  assert.deepEqual(countsAs([{ name: 'Roof terrace', is }]), { as: 'open', by: 'name' });
  assert.deepEqual(countsAs([{ name: 'Ground Fill', is }]), { as: 'ground', by: 'name' });
  assert.deepEqual(countsAs([{ is }, { is: 'ground' }]), { as: 'ground', by: 'is' });
}

// BY ITS NAME, where no box says so: ground where the name holds "ground fill" - alone, in
// capitals, in a longer name. It is asked first: before a word of open air in the same name,
// and before glass. And a name that holds the two words by chance is ground too: the last two.
const byName = (name, as) => assert.deepEqual(countsAs([{ name }]), { as, by: 'name' }, name);
const GROUND =
  'ground fill|Ground Fill|GROUND FILL|Ground Fill, north|The ground fill behind the house|' +
  'Ground fill, roof terrace|Garden / Ground Fill|Courtyard ground fill|Balcony, ground fill|' +
  'Greenhouse ground fill|Ground fill under the greenhouse|Playground filling|Background filler';
for (const name of GROUND.split('|')) byName(name, 'ground');
// What is none is what it was. One of the two words, the two in one, in another order, cut
// short, or with anything but one blank between them: a room - "Ground floor" is one, and so is
// the word in German. And a name of open air or of glass that holds one of the two is open air,
// or glass, as it was: "Courtyard / Filled" is open air.
const ROOMS =
  'Ground floor|Fill|Groundfill|Ground|Ground  fill|Ground-fill|Ground\tfill|Ground, fill|' +
  'Fill ground|Filled ground|ground_fill|Ground fil|Underground filter|Auffüllung';
const NOT_GROUND = {
  room: ROOMS,
  open: 'Courtyard / Filled|Ground floor terrace|Garden, fill|Roof over the ground floor',
  glass: 'Greenhouse, ground floor|Greenhouse fill',
};
for (const [as, names] of Object.entries(NOT_GROUND)) {
  for (const name of names.split('|')) byName(name, as);
}
// The name of a block is the first box's that has one: the second's is not read.
assert.deepEqual(countsAs([{}, { name: 'Ground Fill' }, { name: 'Bath' }]).as, 'ground');
assert.deepEqual(countsAs([{ name: 'Bath' }, { name: 'Ground Fill' }]).as, 'room');

// --- the golden files -------------------------------------------------------------------------------
// The made-up house is its file of version 4 as the pad reads it, with two things more, the last
// two: a lawn of ground before its porch and its cut, by hand. And the file of version 5 that
// holds every field is its file of version 4 with one thing more, the last: a bank of ground, as
// the pad writes it - the Block tool in the side view, on the slice that the file has, row 20
// of the top view, from column 50 to 56 and from row 20 to 22, in brown; named; set to ground.
// Such a block is 6 m deep about its slice: rows 14 to 26. Byte for byte, but for the version.
const more = (text, things) => text.replace('}],"floors"', `},${things}],"floors"`);
const TURF = '{"x":[58,72],"y":[24,36],"z":[24,28],"colour":9,"name":"Lawn","is":"ground"}';
const BOTH = `${TURF},{"x":[30,50],"y":[10,22],"z":[18,24],"colour":1,"category":"ground-cut"}`;
assert.equal(golden('made-up'), more(asNow('made-up', 4), BOTH));
assert.notEqual(asNow('made-up', 4), golden('made-up'));
let sketch = await pad('side', golden('every-part', 4));
assert.deepEqual([JSON.stringify(sketch.doc), sketch.on()], [asNow('every-part', 4), 20]);
sketch.apply({ tool: 'block', from: [50.5, 20.5], to: [55.5, 21.5], colour: 9 });
sketch.name(sketch.doc.things.at(-1), 'Bank');
sketch.count(sketch.doc.things.at(-1), 'ground');
const BANK = '{"x":[50,56],"y":[14,26],"z":[20,22],"colour":9,"name":"Bank","is":"ground"}';
const BANKED = asNow('every-part', 5);
assert.equal(JSON.stringify(sketch.doc), BANKED);
assert.equal(BANKED, more(asNow('every-part', 4), BANK));
assert.deepEqual([local.held.get(KEY), sketch.past.length], [BANKED, 3]);
// It holds each of the four words that a block could say then, once, on every box of the block:
// its studio glass, its workshop - the two boxes of group 1 - open air, its cellar a room, its
// bank ground. The bank is its fifth box, and level; it stands on the level the cellar stands
// on, 815 m, and no thing of the file lies in it or against it. Before it stands the last of
// the file's objects, the wide staircase.
const things = () => sketch.doc.things;
const boxes = things().filter(sketch.isBox);
const told = boxes.map((box) => `${box.group ?? 'alone'}: ${box.is}`);
assert.deepEqual(told, ['alone: glass', '1: open', '1: open', 'alone: room', 'alone: ground']);
const [wide, bank] = things().slice(-2);
assert.deepEqual([boxes.at(-1), globalThis.blocks.topOf(bank)], [bank, null]);
assert.deepEqual(countsAs(sketch.blockOf(bank)), { as: 'ground', by: 'is' });
assert.deepEqual([bank.z[1], boxes[3].z[1], sketch.nameOf('top', 22)], [22, 22, 'Level 815 m']);
const meets = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
const lies = (thing) => sketch.rect(thing, 'top');
const touching = things().filter((thing) => thing !== bank && meets(lies(thing), lies(bank)));
assert.deepEqual(touching, []);
assert.deepEqual([wide.kind, things().findLast((thing) => thing.kind)], ['widestairs', wide]);

// --- the key C ---------------------------------------------------------------------------------------
// A made-up sketch on the made-up plot, where a row of a standing view is 2 * (826 - height).
// A room: 10 m by 8 m and 3 m high, on 814 m. A roof terrace of two boxes, an L, open air by its
// name: 4 m by 4 m and 2 m by 4 m, a metre high, on 814 m. "Ground Fill", ground by its name:
// 3 m by 6 m, its top in row 20, at 816 m. And a lawn of two boxes, which its name makes a room:
// 5 m by 5 m with its top in row 14, at 819 m, and 3 m by 5 m with its top in row 16 and its
// floor a metre lower, in row 22. No step of the key on one block changes another.
const ROOM = { x: [30, 50], y: [22, 38], z: [18, 24], colour: 2, name: 'Day rooms' };
const TERRACE = [
  { x: [50, 58], y: [22, 30], z: [22, 24], colour: 4, group: 1, name: 'Roof terrace' },
  { x: [50, 54], y: [30, 38], z: [22, 24], colour: 4, group: 1, name: 'Roof terrace' },
];
const FILL = { x: [58, 64], y: [22, 34], z: [20, 24], colour: 9, name: 'Ground Fill' };
const LAWN = [
  { x: [20, 30], y: [10, 20], z: [14, 20], colour: 9, group: 2, name: 'Lawn' },
  { x: [30, 36], y: [10, 20], z: [16, 22], colour: 9, group: 2, name: 'Lawn' },
];
const drawn = (...all) =>
  JSON.stringify({ space: VERSION, things: all, floors: [], notes: [], on: {}, show: { top: {} } });
const PLAIN = drawn(ROOM, ...TERRACE, FILL, ...LAWN);
sketch = await pad('side', PLAIN);
const text = () => JSON.stringify(sketch.doc);
const counts = (at) => Object.values(countsAs(sketch.blockOf(things()[at]))).join(' by ');
const said = (at) => globalThis.footer.picked(things()[at]).words;
const undo = () => sketch.step(sketch.past, sketch.future);
assert.equal(text(), PLAIN);
// What is said of every block in a standing view, after all else: how a top is sloped.
const TO_SLOPE =
  ' With Shift held down, drag a top corner of a box down to slope its top, or back up to level it.';
// C goes a step on, by whichever box the block is held: read from its name, then set - a room,
// open air, glass, ground, a cut - and read from its name again. Each step is on both boxes of
// the terrace, which say the same after it; and the pad has a phrase for each, with no word it
// lacks. Of the first three it says how large the terrace is as it did: 24 m² of floor, 4 m by
// 8 m, 1 m high, 24 m³, its floor at 814 m. Of ground its top, 815 m; of a cut its floor, 814 m.
const SIZED = '24 m² of floor, 4 m by 8 m, 1 m high, 24 m³. Its floor is 814 m above sea level.';
const TOP = '24 m², 4 m by 8 m. Its top is 815 m above sea level.';
const FLOOR = '24 m², 4 m by 8 m. Its floor is 814 m above sea level.';
const ROUND = [
  ['room by is', `a room, set by hand. C changes it. ${SIZED}`],
  ['open by is', `open air, set by hand. C changes it. ${SIZED}`],
  ['glass by is', `glass, set by hand. C changes it. ${SIZED}`],
  ['ground by is', `ground, set by hand. C changes it. ${TOP}`],
  ['cut by is', `a cut, set by hand. C changes it. ${FLOOR}`],
  ['open by name', `open air, by its name. C changes it. ${SIZED}`],
];
const state = () => [counts(1), said(2), things()[1].is, things()[2].is];
const rounded = ROUND.map(([as, words], step) => {
  const is = step < 5 ? as.split(' ')[0] : undefined;
  return [as, `Roof terrace: ${words}${TO_SLOPE}`, is, is];
});
assert.deepEqual(state(), rounded[5]);
for (const [step, after] of rounded.entries()) {
  sketch.countNext(things()[1 + (step % 2)]);
  assert.deepEqual(state(), after, `step ${step + 1}`);
  assert.equal(local.held.get(KEY), text(), 'a step is kept as it is made');
}
// After the sixth the sketch is byte for byte what it was. After the fifth each box said so
// as its last field. And Undo goes the same way back, a step at a time, to the bytes again.
assert.deepEqual([text(), sketch.past.length], [PLAIN, 6]);
undo();
const SET = '"name":"Roof terrace","is":"cut"}';
assert.equal(text(), PLAIN.replaceAll('"name":"Roof terrace"}', SET));
assert.equal(text().split(SET).length, 3);
for (const before of [rounded[3], rounded[2], rounded[1], rounded[0], rounded[5]]) {
  undo();
  assert.deepEqual(state(), before);
}
assert.deepEqual([text(), sketch.past.length, sketch.future.length], [PLAIN, 0, 6]);

// A block that is ground by its name is stepped to a room, and round again: set by hand to
// ground and to a cut on the way, and by its name at the end, with the bytes that were. As a
// room it has a floor, a height and a volume again: 18 m² of floor, 2 m high, 36 m³, on 814 m.
const FILLED = '18 m², 3 m by 6 m. Its top is 816 m above sea level.';
const DUG = '18 m², 3 m by 6 m. Its floor is 814 m above sea level.';
const AS_ROOM = '18 m² of floor, 3 m by 6 m, 2 m high, 36 m³. Its floor is 814 m above sea level.';
const FILL_ROUND = [
  `room by is: Ground Fill: a room, set by hand. C changes it. ${AS_ROOM}${TO_SLOPE}`,
  `open by is: Ground Fill: open air, set by hand. C changes it. ${AS_ROOM}${TO_SLOPE}`,
  `glass by is: Ground Fill: glass, set by hand. C changes it. ${AS_ROOM}${TO_SLOPE}`,
  `ground by is: Ground Fill: ground, set by hand. C changes it. ${FILLED}${TO_SLOPE}`,
  `cut by is: Ground Fill: a cut, set by hand. C changes it. ${DUG}${TO_SLOPE}`,
  `ground by name: Ground Fill: ground, by its name. C changes it. ${FILLED}${TO_SLOPE}`,
];
const fill = () => `${counts(3)}: ${said(3)}`;
assert.equal(fill(), FILL_ROUND[5]);
const filled = ['room', 'open', 'glass', 'ground', 'cut', undefined].map((is) => {
  sketch.countNext(things()[3]);
  assert.equal(things()[3].is, is);
  return fill();
});
assert.deepEqual([filled, text()], [FILL_ROUND, PLAIN]);

// --- what the pad says of a block of ground ----------------------------------------------------------
// Word for word, by hand. The lawn, set by hand: its two boxes cover 25 m² and 15 m², and reach
// 8 m along the plot and 5 m across it; its top is the highest top of its boxes, row 14, 819 m -
// though the box that reaches lowest, to row 22, has its own top in row 16. A ramp, set by hand:
// 5 m by 3 m, its top falling 1 m down the plot over its length, from row 18 to row 20. Of a top
// that slopes the pad says where its two ends lie above sea level, 817 m and 816 m, in place of
// the one height - one sentence on its top, not two - and names no floor: ground has none to
// measure from. A piece cut out of a longer ramp, 3 m by 3 m, lies on a plane that was said
// from column 38 on, a quarter of a row down with every column: its ends lie in rows 19.5 and
// 21, at 816.25 m and 815.5 m, both under the top of its box. Ground fill of two boxes, by its
// name: 5 m by 4 m each, the first level with its top in row 16, at 818 m; the top of the
// second falls across the plot, from row 18 at row 48 of the top view to row 20 at row 56 -
// towards the side that the top view measures from, the north-west one of a plot that runs
// downhill to 232 degrees - and of that box the pad says its own two ends, not the block's
// 818 m. And a block without a name, which is ground by hand alone: 3 m by 3 m, top in row 20.
const RAMP = { x: [40, 50], y: [40, 46], z: [18, 22], colour: 9, name: 'Ramp', is: 'ground' };
const CUT = { x: [44, 50], y: [48, 54], z: [18, 22], colour: 9, name: 'Ramp, cut', is: 'ground' };
const EAST = [
  { x: [60, 70], y: [40, 48], z: [16, 22], colour: 9, group: 3, name: 'Ground fill, east' },
  { x: [60, 70], y: [48, 56], z: [18, 22], colour: 9, group: 3, name: 'Ground fill, east' },
];
const SKETCH = drawn(
  ROOM,
  FILL,
  ...LAWN.map((box) => ({ ...box, is: 'ground' })),
  { ...RAMP, slope: { x: [40, 50], z: [18, 20] } },
  { ...CUT, slope: { x: [38, 50], z: [18, 21] } },
  EAST[0],
  { ...EAST[1], slope: { y: [48, 56], z: [18, 20] } },
  { x: [70, 76], y: [10, 16], z: [20, 24], colour: 9, is: 'ground' },
);
const C = 'C changes it.';
const SAID = [
  `Day rooms: a room, by its name. ${C} 80 m² of floor, 10 m by 8 m, 3 m high, 240 m³. Its floor is 814 m above sea level.`,
  `Ground Fill: ground, by its name. ${C} 18 m², 3 m by 6 m. Its top is 816 m above sea level.`,
  `Lawn: ground, set by hand. ${C} 40 m², 8 m by 5 m. Its top is 819 m above sea level.`,
  `Lawn: ground, set by hand. ${C} 40 m², 8 m by 5 m. Its top is 819 m above sea level.`,
  `Ramp: ground, set by hand. ${C} 15 m², 5 m by 3 m. Its top falls down the plot, from 817 m above sea level to 816 m.`,
  `Ramp, cut: ground, set by hand. ${C} 9 m², 3 m by 3 m. Its top falls down the plot, from 816.25 m above sea level to 815.5 m.`,
  `Ground fill, east: ground, by its name. ${C} 40 m², 5 m by 8 m. Its top is 818 m above sea level.`,
  `Ground fill, east: ground, by its name. ${C} 40 m², 5 m by 8 m. The top of this box falls towards the north-west side, from 817 m above sea level to 816 m.`,
  `Block: ground, set by hand. ${C} 9 m², 3 m by 3 m. Its top is 816 m above sea level.`,
];
// A step on from ground set by hand the ramp is a cut - its floor, 815 m, and no word of its top
// - and a step on from that a room by its name, with the words of every block that is no ground:
// its floor, 2 m high, what it holds under its top - 5 m by 3 m by 1.5 m in the mean - its ends.
const RAMP_CUT = `Ramp: a cut, set by hand. ${C} 15 m², 5 m by 3 m. Its floor is 815 m above sea level.`;
const RAMP_ROOM = `Ramp: a room, by its name. ${C} 15 m² of floor, 5 m by 3 m, 2 m high, 22.5 m³. Its floor is 815 m above sea level. Its top falls down the plot, from 2 m over its floor to 1 m.`;
// In each standing view the pad says after it how a top is sloped, as of every block; from
// above it does not. And the label on the paper is the box's, as of every block: what a block
// counts as changes nothing of it. Stepped on, the ground fill is a room, with a room's words.
const LABELS = { side: '3 × 2 m', front: '6 × 2 m', top: '18 m²' };
for (const [view, label] of Object.entries(LABELS)) {
  sketch = await pad(view, SKETCH);
  const more = view === 'top' ? '' : TO_SLOPE;
  things().forEach((_, at) => assert.equal(said(at), `${SAID[at]}${more}`, `${view}, thing ${at}`));
  assert.equal(globalThis.footer.picked(things()[1]).label, label, view);
  sketch.countNext(things()[1]);
  assert.equal(said(1), `Ground Fill: a room, set by hand. ${C} ${AS_ROOM}${more}`, view);
  assert.equal(globalThis.footer.picked(things()[1]).label, label, `${view}, as a room`);
  sketch.countNext(things()[4]);
  assert.equal(said(4), `${RAMP_CUT}${more}`, view);
  sketch.countNext(things()[4]);
  assert.equal(said(4), `${RAMP_ROOM}${more}`, view);
}

process.stdout.write(
  'tools/sketch: a block counts as ground by what a box says or by a name that holds "ground fill", C goes six steps round, and of ground the pad says where its top lies\n',
);
