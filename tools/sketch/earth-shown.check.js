// The check of the shaped ground as the pad shows it (story ST-027), against figures worked out
// by hand: what a slice draws of it - the line of the ground, the tint under it and, once the
// ground is shaped, the hill as it was, as a thin line with words of its own - and what it draws
// with no block of ground, which is what it drew before the ground could be shaped, call for
// call; where an object on the ground stands; what the pad says of a place over the ground; and
// that Undo and redo have the ground again. The pad's own scripts on a made-up store and the
// made-up plot, in the side view - earth.js and land.js among them - with the ground settled as
// the page settles it: after every change, with the sketch's things. The block is drawn with the
// Block tool and set to ground with the step of the key C, its top edge is moved with Select, and
// a person is set down with the Object tool. land.js is handed a pen that keeps what it is asked.
// No browser, and nothing of the real site: site.js is never read. Run by tools/sketch/check.js,
// or alone:
//   pnpm exec node tools/sketch/earth-shown.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// A browser's two stores, and the address of the pad's side view: a slice along the plot.
const store = (held = new Map()) => ({
  getItem: (key) => held.get(key) ?? null,
  setItem: (key, text) => held.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
globalThis.location = { hash: '#side' };
// The scripts, in the order the page loads them (index.html).
const SCRIPTS = ['demo-site', 'paper', 'figures', 'shapes', 'blocks', 'earth', 'land', 'legacy'];
for (const file of ['categories', ...SCRIPTS, 'sketch', 'strokes', 'labels', 'footer'])
  await import(`./${file}.js`);
const { SITE, paper, sketch, footer, land } = globalThis;
const { INK, FAINT } = paper;
assert.deepEqual([SITE.name, paper.VIEW], ['Made-up hillside plot', 'side']);

// AS THE PAGE DOES (page.js, `refresh`): after every change of the sketch the ground is settled
// with the sketch's things, before anything asks it. `worked` counts the times the paper said
// that it worked the ground out anew.
let worked = 0;
sketch.onChange = () => {
  if (paper.settle(sketch.doc.things)) worked += 1;
};

// THE MADE-UP PLOT, by hand (demo-site.js). Its hill lies at 820 - 0.1 c - 0.02 r m at column c
// and row r of the top view's paper, and a height h in row 2 (826 - h) of a standing paper, which
// is 92 columns wide and 40 rows high: along row r the hill lies in row 12 + 0.04 r + 0.2 c. The
// slice of the side view runs along row 30 here: on it the hill lies in row 13.2 + 0.2 c - at
// column 45 in row 22.2, 814.9 m. The slice across the plot runs along column 45.
const [ALONG, ACROSS] = [30, 45];
const hillAlong = (r) => Array.from({ length: 93 }, (_, c) => [c, 12 + 0.04 * r + 0.2 * c]);
// Four slices, each with the columns at which it enters the plot and leaves it. Along rows 30 and
// 14, at the outline's two sides along the grid. Along row 46 at its two sides askew: 10 r - 3 c
// = 404 on the one, at column 56 / 3, and 6 c + 7 r = 746 on the other, at column 212 / 3. And
// row 4 runs beside the plot.
const SLICES = { 30: [12, 80], 14: [12, 80], 46: [56 / 3, 212 / 3], 4: [] };
sketch.doc = sketch.adopt({ ...sketch.blank(), on: { side: ALONG, end: ACROSS } });
sketch.onChange();

// A PEN THAT KEEPS WHAT IT IS ASKED, at two pixels a cell: a place said in pixels is half as many
// cells. It has no canvas: a standing view asks its pen for paths, rules and words alone.
const kept = [];
const keeps =
  (kind) =>
  (...told) =>
    kept.push([kind, ...told]);
const pen = { unit: 2, path: keeps('path'), rule: keeps('rule'), write: keeps('write') };
/** What land.js asks of the pen for the site, on a slice along a row of the top view. */
function drawn(along = ALONG) {
  kept.length = 0;
  land.site(pen, { side: along, end: ACROSS });
  return [...kept];
}
/** Calls of a pen as text, every number to a millionth: a figure worked out by hand is the one the pad worked out. */
const said = (calls) =>
  JSON.stringify(calls, (_, value) =>
    typeof value === 'number' ? Number(value.toFixed(6)) : value,
  );
// What a standing view asks of its pen, by hand. The line of the ground, in ink, 2.5 pixels wide,
// and the words for it, 60 pixels in and 24 down; and then, whatever the ground: the plot's
// boundaries with their words, the other slice in the slices' own colour, and the two ends of
// the paper - the made-up plot points south-west.
const WORDS = ['write', '— the ground along the slice', 30, 12, INK, 11, 'left'];
const AS_IT_WAS = ['write', '— the ground as it was', 30, 19, FAINT, 11, 'left'];
const CUT = '#b45309';
const rest = (along) => [
  ...SLICES[along].flatMap((edge) => [
    ['rule', edge, 0, edge, 40, FAINT, 1, [3, 5]],
    ['write', 'plot boundary', edge, 27, FAINT, 10],
  ]),
  ['rule', ACROSS, 0, ACROSS, 40, CUT, 1, [10, 4, 2, 4]],
  ['write', 'front slice', ACROSS, 19, CUT, 10],
  ['write', '◀ uphill, north-east', 3, 35, FAINT, 11, 'left'],
  ['write', 'downhill, south-west ▶', 89, 35, FAINT, 11, 'right'],
];
// WITH NO BLOCK OF GROUND a slice asks what it asked before the ground could be shaped, call for
// call - but for where the house of today stands, which no view writes any more (story ST-029):
// one line, the hill's, and one line of words - ten calls where it runs through the plot.
const plain = (along) => said([['path', hillAlong(along), INK, 2.5], WORDS, ...rest(along)]);
assert.equal(plain(ALONG), said([['path', hillAlong(30), INK, 2.5], WORDS, ...rest(30)]));
assert.equal(JSON.parse(plain(ALONG)).length, 10);
/** Whether the ground is the site's own: the paper holds no grid, and each of the four slices asks its pen what it ever did. */
const unshaped = () =>
  paper.shaped() === null &&
  Object.keys(SLICES).every((row) => said(drawn(Number(row))) === plain(Number(row)));

// WHAT THE PAD SAYS OF A PLACE (footer.js): column 45 and row 14 of the slice lie 18.5 m down the
// plot and 826 - 7 = 819 m above sea level - over the hill, 819 - 814.9 = 4.1 m. And row 20,
// 816 m: 1.1 m over the hill.
/** What the pad says of a place of the slice at column 45, but for its last words, which are the same of every place. */
function says(row) {
  const words = footer.measure([45, row], null, null);
  assert.ok(words.endsWith(' at the slice'), words);
  return words.slice(0, -' at the slice'.length);
}
const above = (high, far) => `18.5 m down the plot, ${high} m above sea level, ${far} the ground`;
const HILL_SAYS = [above('819.0', '4.1 m above'), above('816.0', '1.1 m above')];
const saysOfHill = () => assert.deepEqual([says(14), says(20)], HILL_SAYS);
assert.ok(unshaped());
saysOfHill();

// UNDO AND REDO. The ground and what stands on it, as a text: the grid that the paper holds,
// number for number, and the rows in which the person's foot is drawn - in the slice along the
// plot, and in the one across it.
const undo = () => sketch.step(sketch.past, sketch.future);
const block = () => sketch.doc.things.find(sketch.isBox);
const person = () => sketch.doc.things.find((thing) => thing.kind === 'person');
/** The row the person's foot is drawn in, in each of the two slices: both run through it. */
const feet = () =>
  ['side', 'end'].map((plane) => {
    const { things } = sketch.layer(plane, sketch.on(plane));
    return things.find((entry) => entry.thing === person()).rect[3];
  });
const state = () => JSON.stringify([paper.shaped(), person() ? feet() : 'nobody']);
/** A change of the sketch: Undo has the ground and the person as they were before it, and redo as it left them. */
function done(act) {
  const before = state();
  act();
  const after = state();
  undo();
  assert.ok(state() === before, 'Undo does not have the ground as it was');
  sketch.step(sketch.future, sketch.past);
  assert.ok(state() === after, 'redo does not have the ground as the change left it');
}

// A BLOCK, drawn with the Block tool on the slice: from column 40 to 50 and from row 16 to 28, 6 m
// deep about the slice - rows 24 to 36 of the top view. Its top lies at 826 - 8 = 818 m. It is a
// room, as it has no name: the ground is the site's, and a slice asks its pen nothing more. A
// person set down over it would stand on its roof, the level of row 16 - nearer than the hill.
done(() => sketch.apply({ tool: 'block', from: [40.5, 16.5], to: [49.5, 27.5], colour: 9 }));
assert.deepEqual(sketch.doc.things, [{ x: [40, 50], y: [24, 36], z: [16, 28], colour: 9 }]);
assert.ok(unshaped());
const OVER_IT = [45.2, 14.3];
assert.equal(sketch.placed('person', OVER_IT, 0).floor, 16);

// SET TO GROUND with the step of the key C: a room, open air, glass - and with the fourth step
// ground. Only that step works the ground out - and its Undo, to the site's own, and its redo:
// three times. Over the block the ground is 818 m.
for (const as of ['room', 'open', 'glass']) {
  done(() => sketch.countNext(block()));
  assert.deepEqual([block().is, worked], [as, 0]);
  assert.ok(unshaped());
}
done(() => sketch.countNext(block()));
assert.deepEqual([block().is, worked], ['ground', 3]);
const grid = paper.shaped();
assert.deepEqual([grid.length, grid[0].length, grid[ALONG][45]], [63, 93, 818]);

/**
 * The line of the ground as a slice draws it, held against the thin line by hand. Up to the plot
 * boundary at column 12, and from the one at column 80 on, it is the hill's own, to the last
 * figure. From column 40 to 50 it runs level in the row of the block's `top`. And between - the
 * ground on its way out - it lies off the hill, `over` it for a fill and under it for a cut:
 * less than at the block's end, and nearer to the hill with every column towards the boundary.
 * It runs out, and stops nowhere. It gives how far off the hill the block's two ends lie, in rows.
 */
function runsOut(line, thin, top, over) {
  const off = (c) => (over ? 1 : -1) * (thin[c][1] - line[c][1]);
  assert.equal(line.length, 93);
  line.forEach(([c, row], at) => {
    assert.equal(c, at);
    if (c <= 12 || c >= 80) assert.equal(row, thin[c][1], `the ground is changed at column ${c}`);
    else if (c >= 40 && c <= 50) assert.equal(row, top, `column ${c} lies in row ${row}`);
    else {
      const [inner, outer] = c < 40 ? [c + 1, c - 1] : [c - 1, c + 1];
      assert.ok(off(inner) > off(c) && off(c) > off(outer), `the ground stops at column ${c}`);
    }
  });
  return [off(40), off(50)].map((rows) => Number(rows.toFixed(6)));
}
/**
 * What a slice asks of its pen while the ground is shaped: first the thin line, the hill's rows,
 * a pixel wide in the faint ink; then the line of the ground, which is drawn over it and hides it
 * wherever the two are one; the words, and under them the second line of words; and the rest as
 * ever. It gives the two lines.
 */
function shown(along = ALONG) {
  const [thin, thick, ...after] = drawn(along);
  assert.equal(said(thin), said(['path', hillAlong(along), FAINT, 1]));
  const line = thick[1];
  assert.deepEqual([thick[0], ...thick.slice(2)], ['path', INK, 2.5]);
  assert.equal(said(after), said([WORDS, AS_IT_WAS, ...rest(along)]));
  return [line, thin[1]];
}
/** The upper edge of the tint under a slice (land.ground), on a canvas that keeps it: from the paper's foot and back to it. */
function tinted() {
  const edge = [];
  const ctx = { beginPath() {}, fill() {}, moveTo: (...at) => edge.push(at) };
  ctx.lineTo = ctx.moveTo;
  land.ground({ ctx }, ALONG);
  assert.deepEqual([ctx.fillStyle, edge.shift(), edge.pop()], ['#f1ebe0', [0, 40], [92, 40]]);
  return edge;
}

// A FILL. The thin line lies in row 22.2 at column 45. The line of the ground runs level in row
// 16 from column 40 to 50, where the hill lies in rows 21.2 and 23.2: 5.2 and 7.2 rows under it,
// 2.6 m and 3.6 m. From there it runs out to the hill at the plot boundary, on either side, over
// the hill all the way. The tint reaches up to that line, and not to the thin one: what is
// filled shows tinted between the two.
const [filled, hill] = shown();
assert.equal(hill[45][1].toFixed(6), '22.200000');
assert.deepEqual(runsOut(filled, hill, 16, true), [5.2, 7.2]);
assert.deepEqual(tinted(), filled);
// And so on every slice, once the ground is shaped - no two heights are held against each other
// to tell: through the two sides askew, and beside the plot, where the two lines are one to the
// last figure and the words stand all the same.
shown(46);
const [beside, asItWas] = shown(4);
assert.deepEqual(beside, asItWas);
// A metre over the terrace the pad says 1.0 m, where the hill gave 4.1 m; and a place a metre
// under its top is 2.0 m below the ground, where it lay 1.1 m above the hill.
const TERRACE_SAYS = [above('819.0', '1.0 m above'), above('816.0', '2.0 m below')];
assert.deepEqual([says(14), says(20)], TERRACE_SAYS);

// A PERSON set down over the block with the Object tool stands on the ground - the ground is
// nearest now - and has its foot in row 16, in both slices. It works out nothing.
done(() => sketch.apply({ tool: 'object', from: OVER_IT, to: OVER_IT, kind: 'person', turned: 0 }));
const STANDS = { kind: 'person', x: 45, y: 30, floor: 'ground' };
assert.deepEqual([person(), feet(), worked], [STANDS, [16, 16], 3]);
assert.equal(paper.shaped(), grid);

// A CUT. The top edge of the block moved with Select from row 16 to row 26, 813 m, under the
// hill: the line of the ground runs level in row 26, 4.8 and 2.8 rows under the hill's, and runs
// out under the hill all the way. The tint ends at it: what is cut shows as paper. The person
// has its foot in row 26, with nothing of its own changed, and the pad says 6.0 m.
const EDGE = [41.5, 16.1];
const lowered = { tool: 'move', from: EDGE, to: [41.5, 26.1], grabbed: sketch.grab(EDGE, 0.3) };
assert.equal(lowered.grabbed.zone, 'n');
done(() => sketch.apply(lowered));
assert.deepEqual([block().z, person(), feet(), worked], [[26, 28], STANDS, [26, 26], 6]);
const [cut, hillStill] = shown();
assert.deepEqual(runsOut(cut, hillStill, 26, false), [4.8, 2.8]);
assert.deepEqual([hillStill, tinted(), paper.shaped()[ALONG][45]], [hill, cut, 813]);
assert.equal(says(14), above('819.0', '6.0 m above'));

// UNDONE, the top is in row 16 again, and the ground the one it was, number for number; redone,
// the cut. And with what the block was set to taken off again, it is read from its name again:
// a room - the key's round ends so, a step after a cut since story ST-028, and counts.check.js
// holds its six steps. The ground is the site's own - a slice asks its pen what it asked with
// nothing drawn - the pad says of the hill what it said, and the person stands on the hill:
// under its middle, column 45.5 of row 30.5, at 820 - 4.55 - 0.61 = 814.84 m, row 22.32.
undo();
assert.deepEqual([block().z, feet(), paper.shaped()], [[16, 28], [16, 16], grid]);
sketch.step(sketch.future, sketch.past);
done(() => sketch.count(block()));
assert.deepEqual([block().is, person(), worked], [undefined, STANDS, 11]);
assert.ok(unshaped());
saysOfHill();
assert.deepEqual(
  feet().map((row) => row.toFixed(6)),
  ['22.320000', '22.320000'],
);

// OF page.js, which wants a whole page to load, the text alone: `refresh` settles the ground
// with the sketch's things, and reads the layers after - and nothing else of the page settles it.
const page = readFileSync(`${import.meta.dirname}/page.js`, 'utf8');
const code = page.split('\n').map((line) => line.trim());
const at = code.indexOf('function refresh() {');
assert.ok(at > 0, 'page.js has no refresh');
assert.match(code[at + 1], /^paper\.settle\(sketch\.doc\.things\);/, 'refresh begins otherwise');
assert.equal(code[at + 2], 'layers.refresh();');
assert.equal(code.filter((line) => line.includes('settle(')).length, 1);
// OF land.js, the one script that wrote where the house of today stands, the text: it names
// neither the words nor the site's point for them - and the made-up site has no such point.
const landJs = readFileSync(`${import.meta.dirname}/land.js`, 'utf8');
for (const gone of ['house today', '.house']) assert.ok(!landJs.includes(gone), gone);
assert.ok(!('house' in SITE), 'the made-up site says where a house stands');

process.stdout.write(
  'tools/sketch: a slice draws the shaped ground over the hill as it was, an object stands on it, the pad measures from it, and Undo has it again\n',
);
