// The check of a cut as the pad shows it (story ST-028), against figures worked out by hand: a
// block drawn over the earth in the side view and made a cut - by the category that is picked
// for it, and by the key C - has the ground of the slice at its floor; land.js, which did not
// change for it, draws the hill as it was as a thin line above that floor, with paper between
// the two; the pad says of a place how far it lies over the cut ground; what is set down in a
// cut stands on the ground, near the cut's floor and near the top of its box alike, and goes
// with the floor as Select moves it; with the floor over the hill a slice asks its pen what it
// ever did; and Undo and redo have the ground again. The pad's own scripts on a made-up store
// and the made-up plot, as earth-shown.check.js loads them, with the ground settled as the page
// settles it: after every change, with the sketch's things. And layers.js on a made-up page, for
// the hint that tells the owner how. No browser, and nothing of the real site: site.js is never
// read. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/earth-cut-shown.check.js
import assert from 'node:assert/strict';
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
const { SITE, paper, blocks, sketch, footer, land } = globalThis;
const { INK, FAINT } = paper;
assert.deepEqual([SITE.name, paper.VIEW], ['Made-up hillside plot', 'side']);
// AS THE PAGE DOES (page.js, `refresh`): after every change of the sketch the ground is settled
// with the sketch's things, before anything asks it.
sketch.onChange = () => paper.settle(sketch.doc.things);

// THE MADE-UP PLOT, by hand (demo-site.js). Its hill lies at 820 - 0.1 c - 0.02 r m at column c
// and row r of the top view's paper, and a height h in row 2 (826 - h) of a standing paper: along
// row r the hill lies in row 12 + 0.04 r + 0.2 c. The slice of the side view runs along row 30:
// on it the hill lies in row 13.2 + 0.2 c - at column 45 in row 22.2, 814.9 m. The slice across
// the plot runs along column 45. And the four slices of earth-shown.check.js, each with the
// columns at which it enters the plot and leaves it: row 4 runs beside the plot.
const [ALONG, ACROSS] = [30, 45];
const hillAlong = (r) => Array.from({ length: 93 }, (_, c) => [c, 12 + 0.04 * r + 0.2 * c]);
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
// What a standing view asks of its pen whatever the ground, by hand, as earth-shown.check.js has
// it: the words for the line of the ground; and after them the plot's boundaries with their
// words, the other slice in the slices' own colour, and the two ends of the paper.
const WORDS = ['write', '— the ground along the slice', 30, 12, INK, 11, 'left'];
const AS_IT_WAS = ['write', '— the ground as it was', 30, 19, FAINT, 11, 'left'];
const SLICE = '#b45309';
const rest = (along) => [
  ...SLICES[along].flatMap((edge) => [
    ['rule', edge, 0, edge, 40, FAINT, 1, [3, 5]],
    ['write', 'plot boundary', edge, 27, FAINT, 10],
  ]),
  ['rule', ACROSS, 0, ACROSS, 40, SLICE, 1, [10, 4, 2, 4]],
  ['write', 'front slice', ACROSS, 19, SLICE, 10],
  ['write', '◀ uphill, north-east', 3, 35, FAINT, 11, 'left'],
  ['write', 'downhill, south-west ▶', 89, 35, FAINT, 11, 'right'],
];
// WITH NOTHING SHAPED a slice asks what it ever did, call for call - but for where the house of
// today stands, which no view writes any more (story ST-029): one line, the hill's, and one line
// of words - ten calls where it runs through the plot.
const plain = (along) => said([['path', hillAlong(along), INK, 2.5], WORDS, ...rest(along)]);
/** Whether the ground is the site's own: the paper holds no grid, and each of the four slices asks its pen what it ever did. */
const unshaped = () =>
  paper.shaped() === null &&
  Object.keys(SLICES).every((row) => said(drawn(Number(row))) === plain(Number(row)));
/** What the pad says of column 45 and row 20 of the slice (footer.js), 826 - 10 = 816 m: how far over the ground, in metres. */
const over = () =>
  /^18\.5 m down the plot, 816\.0 m above sea level, (.+) m above the ground at the slice$/.exec(
    footer.measure([45, 20], null, null),
  )[1];

// UNDO AND REDO. The ground and what stands on it, as a text: the grid that the paper holds,
// number for number, and the row in which the foot of each person is drawn - in the slice along
// the plot, and in the one across it that runs through that person.
const undo = () => sketch.step(sketch.past, sketch.future);
const block = () => sketch.doc.things.find(sketch.isBox);
const people = () => sketch.doc.things.filter((thing) => thing.kind === 'person');
const feet = () =>
  people().map((person) =>
    ['side', 'end'].map((plane) => {
      const { things } = sketch.layer(plane, plane === 'side' ? ALONG : person.x);
      return things.find((entry) => entry.thing === person).rect[3];
    }),
  );
const state = () => JSON.stringify([paper.shaped(), feet()]);
/** A change of the sketch: Undo has the ground and the feet as they were before it, and redo as it left them. */
function done(act) {
  const before = state();
  act();
  const after = state();
  undo();
  assert.ok(state() === before, 'Undo does not have the ground as it was');
  sketch.step(sketch.future, sketch.past);
  assert.ok(state() === after, 'redo does not have the ground as the change left it');
}

// A BLOCK, drawn with the Block tool on the slice: from column 40 to 50 and from row 16 to 26, 6 m
// deep about the slice - rows 24 to 36 of the top view. Its floor lies in row 26, 826 - 13 =
// 813 m: under the hill everywhere, which lies at 820 - 4 - 0.48 = 815.52 m at its uphill corner,
// column 40 of row 24, and at 820 - 5 - 0.72 = 814.28 m at the one across, the lowest. It is a
// room, as it has no name: the ground is the site's, and the place at 816 m lies 1.1 m over it.
done(() => sketch.apply({ tool: 'block', from: [40.5, 16.5], to: [49.5, 25.5], colour: 1 }));
assert.deepEqual(sketch.doc.things, [{ x: [40, 50], y: [24, 36], z: [16, 26], colour: 1 }]);
assert.ok(unshaped());
assert.equal(over(), '1.1');
// The grid points that the block reaches, its edges included: 11 columns by 13 rows, 143. And
// those of them at which the ground that the paper holds is a height, to the last figure.
const REACH = Array.from({ length: 143 }, (_, at) => [40 + (at % 11), 24 + Math.floor(at / 11)]);
const level = (m) => REACH.filter(([c, r]) => paper.shaped()[r][c] === m);

// WHAT A BLOCK OFFERS AN OBJECT that is set down on the slice (`standOn`, strokes.js): near the
// block's floor, at column 45 and row 25, and near the top of its box, at column 43 and row 17.
// A room, open air and glass offer their floor and their top, rows 26 and 16 - the hill lies in
// rows 22.2 and 21.8 there, further off. A block of ground offers its floor, as it did, under
// the ground - and its top is the ground. A CUT OFFERS NEITHER: all there is in it is the ground.
const NEAR = { floor: [45.2, 25.1], top: [43.2, 17.1] };
const stoodOn = (to) => sketch.placed('person', to, 0).floor;
const offered = () => Object.values(NEAR).map(stoodOn);
const BOTH = [26, 16];
const NEITHER = ['ground', 'ground'];
const OFFERS = { room: BOTH, open: BOTH, glass: BOTH, ground: [26, 'ground'], cut: NEITHER };
assert.deepEqual(offered(), BOTH);

// MADE A CUT, TWICE OVER, for one ground. First by its category, `ground-cut`, picked from the
// list: the paper holds a grid, and the 143 grid points that the cut reaches are 813 m. Then,
// the pick undone, by the key C: a room, open air, glass, ground - a terrace of 818 m, meanwhile
// - and with the fifth step a cut: the same ground, number for number, in a grid of its own.
done(() => sketch.categorise(block(), 'ground-cut'));
const picked = paper.shaped();
assert.deepEqual([picked.length, picked[0].length, level(813).length], [63, 93, 143]);
assert.deepEqual([block().category, block().is, offered()], ['ground-cut', undefined, NEITHER]);
undo();
assert.ok(unshaped());
for (const [as, offers] of Object.entries(OFFERS)) {
  done(() => sketch.countNext(block()));
  assert.deepEqual([block().is, block().category, offered()], [as, undefined, offers]);
}
assert.notEqual(paper.shaped(), picked);
assert.deepEqual([paper.shaped(), level(813).length], [picked, 143]);

/**
 * What a slice asks of its pen while the ground is shaped: first the thin line, the hill's rows,
 * a pixel wide in the faint ink; then the line of the ground, which is drawn over it; the words,
 * and under them the second line of words; and the rest as ever. It gives the two lines.
 */
function shown() {
  const [thin, thick, ...after] = drawn();
  assert.equal(said(thin), said(['path', hillAlong(ALONG), FAINT, 1]));
  const line = thick[1];
  assert.deepEqual([thick[0], ...thick.slice(2)], ['path', INK, 2.5]);
  assert.equal(said(after), said([WORDS, AS_IT_WAS, ...rest(ALONG)]));
  return [line, thin[1]];
}
/** The upper edge of the tint under the slice (land.ground), on a canvas that keeps it: from the paper's foot and back to it. */
function tinted() {
  const edge = [];
  const ctx = { beginPath() {}, fill() {}, moveTo: (...at) => edge.push(at) };
  ctx.lineTo = ctx.moveTo;
  land.ground({ ctx }, ALONG);
  assert.deepEqual([ctx.fillStyle, edge.shift(), edge.pop()], ['#f1ebe0', [0, 40], [92, 40]]);
  return edge;
}

// THE SLICE THROUGH THE CUT. The thin line lies in row 22.2 at column 45. The line of the ground
// runs level in row 26 from column 40 to 50, where the hill lies in rows 21.2 and 23.2: 4.8 and
// 2.8 rows over it, 2.4 m and 1.4 m of earth that is gone. Up to the plot boundary at column 12,
// and from the one at column 80 on, it is the hill's own row, to the last figure. Between a
// boundary and the cut it lies under the hill, and nearer to it with every column towards the
// boundary: it runs out, and stops nowhere. What the rule leaves, held to half a centimetre:
// row 25.44 at column 39 and row 21.19 at column 30; and row 26.44 at column 60 and row 27.64 at
// column 70 - downhill of a cut the ground lies under its floor, for it falls with the hill.
// The tint ends at the line of the ground: between that and the thin line a cut shows as paper.
const [line, hill] = shown();
const under = (c) => line[c][1] - hill[c][1];
assert.equal(hill[45][1].toFixed(6), '22.200000');
assert.equal(line.length, 93);
line.forEach(([c, row], at) => {
  assert.equal(c, at);
  if (c <= 12 || c >= 80) assert.equal(row, hill[c][1], `the ground is changed at column ${c}`);
  else if (c >= 40 && c <= 50) assert.equal(row, 26, `column ${c} lies in row ${row}`);
  else {
    const [inner, outer] = c < 40 ? [c + 1, c - 1] : [c - 1, c + 1];
    assert.ok(under(inner) > under(c) && under(c) > under(outer), `it stops at column ${c}`);
  }
});
assert.deepEqual([under(40).toFixed(6), under(50).toFixed(6)], ['4.800000', '2.800000']);
for (const [c, row] of Object.entries({ 39: 25.44, 30: 21.19, 60: 26.44, 70: 27.64 }))
  assert.ok(Math.abs(line[c][1] - row) < 0.01, `column ${c} lies in row ${line[c][1]}`);
assert.deepEqual(tinted(), line);
// THE PAD SAYS of the place at 816 m: 3.0 m above the ground, where the hill gave 1.1 m.
assert.equal(over(), '3.0');

// A PERSON set down with the Object tool in the cut near its floor, and one near the top of its
// box: each stands on the ground, its foot in row 26, in the slice along the plot and in the one
// across it. While a cut offered its top, the second stood in row 16, on its box, in the air.
for (const to of Object.values(NEAR))
  done(() => sketch.apply({ tool: 'object', from: to, to, kind: 'person', turned: 0 }));
const STAND = [45, 43].map((x) => ({ kind: 'person', x, y: 30, floor: 'ground' }));
const feetIn = (row) => Array(2).fill([row, row]);
assert.deepEqual([people(), feet()], [STAND, feetIn(26)]);

/** The cut's floor moved with Select from a row up to another, at column 41.5, where nobody stands: nothing of a person's own changes. */
function floorTo(from, to) {
  const stroke = { tool: 'move', from: [41.5, from - 0.1], to: [41.5, to - 0.1] };
  stroke.grabbed = sketch.grab(stroke.from, 0.3);
  assert.deepEqual(stroke.grabbed, { at: 0, zone: 's' });
  done(() => sketch.apply(stroke));
  assert.deepEqual([block().z, people()], [[16, to], STAND]);
}
// THE FLOOR MOVED up two rows, to row 24, 814 m - under the hill still, at its lowest 814.28 m:
// 143 points, both feet in row 24, and the place at 816 m 2.0 m over the ground.
floorTo(26, 24);
assert.deepEqual([level(814).length, feet(), over()], [143, feetIn(24), '2.0']);
// To row 22, 815 m: THE HILL RUNS THROUGH THE CUT. It lies over 815 m where 0.1 c + 0.02 r < 5:
// the 57 points where 5 c + r < 250 - columns 40 to 42 whole, 43 down to row 34, 44 down to row
// 29, and 45 in row 24 - are 815 m, and every other point that the cut reaches lies under its
// floor. At column 48 the hill lies in row 22.8, under the floor: a person set down there at the
// floor of the cut stands on the ground, and not on a floor in the air.
floorTo(24, 22);
const bitten = REACH.filter(([c, r]) => 5 * c + r < 250);
assert.deepEqual([level(815), bitten.length], [bitten, 13 + 13 + 13 + 11 + 6 + 1]);
assert.ok(REACH.every(([c, r]) => paper.shaped()[r][c] <= 815));
assert.ok(paper.groundRow(48, ALONG) > 22.8);
assert.equal(stoodOn([48.2, 22.1]), 'ground');
// To row 20, 816 m, OVER THE HILL EVERYWHERE - it is 815.52 m at the most: the paper holds no
// grid, and each of the four slices asks its pen what it ever did. The people stand on the
// hill: under their middles, columns 45.5 and 43.5 of row 30.5, it lies at 820 - 4.55 - 0.61 =
// 814.84 m, row 22.32, and at 815.04 m, row 21.92.
floorTo(22, 20);
assert.ok(unshaped());
const onHill = ['22.320000', '22.320000', '21.920000', '21.920000'];
const feetSaid = () => feet().flatMap((rows) => rows.map((row) => row.toFixed(6)));
assert.deepEqual([feetSaid(), over()], [onHill, '1.1']);

// STEPPED ON WITH C, with its floor in row 22 again, where it bites: by its name again - a room,
// as it has none. The ground is the site's again, and the people stand on the hill.
undo();
assert.deepEqual([block().z, level(815)], [[16, 22], bitten]);
done(() => sketch.countNext(block()));
assert.deepEqual([block().is, blocks.countsAs([block()])], [undefined, { as: 'room', by: 'name' }]);
assert.ok(unshaped());
assert.deepEqual([people(), feetSaid(), over()], [STAND, onHill, '1.1']);

// A CUT IS ASKED OF ITS BLOCK, and not of the box: the cut again, and a block drawn beside it,
// columns 50 to 54, on whose top a person would stand, in row 16 - until Merge makes the two
// one block. The second box says nothing itself, and is a cut with its block: the ground.
undo();
done(() => sketch.apply({ tool: 'block', from: [50.5, 16.5], to: [53.5, 21.5], colour: 1 }));
assert.equal(stoodOn([52.2, 16.6]), 16);
done(() => sketch.apply({ tool: 'merge', from: [49.5, 18.5], to: [50.5, 18.5] }));
const [first, second] = sketch.doc.things.filter(sketch.isBox);
assert.deepEqual([first.is, second.is, second.x, second.group], ['cut', undefined, [50, 54], 1]);
assert.equal(stoodOn([52.2, 16.6]), 'ground');

// THE HINT of the standing views (layers.js), on a made-up page that keeps what it is handed:
// its sentence on ground, to the letter, as the browser test holds it, and after it how ground
// is taken away - the ground, and not the hill: a cut takes away from a fill too.
const OF_GROUND =
  'A block that C sets to ground shapes the ground: its top is the ground there, and from it the ground runs out to the plot boundary.';
const OF_A_CUT =
  'A block that is a cut takes ground away: where the ground stands higher than its floor, the ground is its floor. Pick "Ground cut" in the list beside the paper, or press C until the pad says a cut.';
const made = {};
globalThis.document = { getElementById: (id) => (made[id] ??= { addEventListener() {} }) };
await import('./layers.js');
assert.ok(made['layers-hint'].textContent.endsWith(` ${OF_GROUND} ${OF_A_CUT}`));

process.stdout.write(
  'tools/sketch: a cut has the ground of a slice at its floor, under the hill as it was, what is set down in it stands on that ground, the pad measures from it and says how, and Undo has it again\n',
);
