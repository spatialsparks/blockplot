// The check of the lines of a sketch (ST-039, T-039.2): each rule of lines/model.js on made-up
// lines - a point put on the paper, a segment measured, where a line lies, on which layer it is,
// what is said of it, the line in progress and its steps - and the eraser of strokes.js, which
// asks it: a line of several corners taken by any segment, a line on every level from any level,
// and none that its own switch hides. The pad's own scripts on a made-up store and the made-up
// plot: no browser, nothing of the real site. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/lines/model.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
globalThis.location = { hash: '#top' };
await import('../demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const SCRIPTS = ['paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch'];
for (const file of [...SCRIPTS, 'lines/model', 'strokes']) await import(`../${file}.js`);
const { paper, sketch, lines } = globalThis;
const CELL_M = 0.5;
assert.equal(paper.CELL_M, CELL_M);

// THE LIST AND ITS POINTS: two points and its colour, a line of three, and one of before with no
// colour - which has none. And back: the flat list that a sketch holds.
const FOUR = [10, 10, 20, 10, 20, 20, 10, 20, 3];
const CORNERS = [
  [10, 10],
  [20, 10],
  [20, 20],
  [10, 20],
];
assert.deepEqual(lines.points(FOUR), CORNERS);
assert.deepEqual(
  [lines.colourOf(FOUR), lines.colourOf([1, 2, 3, 4]), lines.colourOf([1, 2, 3, 4, '#3a7bd5'])],
  [3, null, '#3a7bd5'],
);
assert.deepEqual(lines.points([1, 2, 3, 4]), [
  [1, 2],
  [3, 4],
]);
assert.deepEqual(lines.made(CORNERS, 3), FOUR);

// RULE 1, A POINT WHERE IT WAS PUT: on the nearest grid point; with Alt, to the centimetre - at
// 0.5 m a cell, k/50 of a cell. Never -0.
assert.deepEqual(lines.snapped([61.379, -0.011], false, CELL_M), [61, 0]);
assert.ok(!Object.is(lines.snapped([61.379, -0.011], false, CELL_M)[1], -0));
assert.deepEqual(lines.snapped([61.379, -0.011], true, CELL_M), [61.38, -0.02]);
assert.deepEqual(lines.snapped([61.379, 0.004], true, CELL_M), [61.38, 0]);
assert.deepEqual(lines.snapped([3.25, 4.5], true, 1), [3.25, 4.5]);

// A SEGMENT MEASURED, as the view shows it: rows run down, and a flipped view's columns run
// leftwards. 0 to the right, counter-clockwise, from 0 up to 360.
const round = ({ m, deg }) => [Math.round(m * 1000) / 1000, Math.round(deg * 1000) / 1000];
const from = [10, 10];
assert.deepEqual(round(lines.measured(from, [14, 10], CELL_M, false)), [2, 0]);
assert.deepEqual(round(lines.measured(from, [10, 6], CELL_M, false)), [2, 90]);
assert.deepEqual(round(lines.measured(from, [6, 10], CELL_M, false)), [2, 180]);
assert.deepEqual(round(lines.measured(from, [10, 14], CELL_M, false)), [2, 270]);
const [cos, sin] = [Math.cos(Math.PI / 6) * 8.5, Math.sin(Math.PI / 6) * 8.5];
assert.deepEqual(round(lines.measured(from, [10 + cos, 10 - sin], CELL_M, false)), [4.25, 30]);
assert.deepEqual(round(lines.measured(from, [10 - cos, 10 + sin], CELL_M, false)), [4.25, 210]);
// The same line in a flipped view: its columns run leftwards, so it leans the other way.
assert.deepEqual(round(lines.measured(from, [10 + cos, 10 - sin], CELL_M, true)), [4.25, 150]);
assert.deepEqual(round(lines.measured(from, [14, 10], CELL_M, true)), [2, 180]);
const { deg } = lines.measured(from, [14, 10 + 1e-12], CELL_M, false);
assert.ok(deg >= 0 && deg < 360, 'from 0 up to 360');

// WHERE A LINE LIES, of four points, a square from [10, 10] to [20, 20] with its left side open.
assert.equal(lines.near(FOUR, [15, 10.2], 0.3), true, 'beside its first segment');
assert.equal(lines.near(FOUR, [20.25, 15], 0.3), true, 'within its reach of the second');
assert.equal(lines.near(FOUR, [15, 15], 0.3), false, 'inside the square, far from any');
assert.equal(lines.near(FOUR, [10.2, 15], 0.3), false, 'where it is open: no segment there');
assert.equal(lines.near(FOUR, [25, 10], 0.3), false, 'past the end of a segment');
// A box it misses, one it touches along an edge, one each segment passes through.
assert.equal(lines.crosses([12, 12, 18, 18], FOUR), false, 'inside it, missed');
assert.equal(lines.crosses([12, 4, 18, 10], FOUR), false, 'along an edge is outside');
assert.equal(lines.crosses([14, 9, 16, 11], FOUR), true, 'the first segment');
assert.equal(lines.crosses([14, 19, 16, 21], FOUR), true, 'the third segment');
assert.equal(lines.crosses([19, 14, 21, 16], FOUR), true, 'the second segment');
assert.equal(lines.within([9, 9, 21, 21], FOUR), true, 'every point in it');
assert.equal(lines.within([10, 10, 20, 20], FOUR), true, 'its edge within');
assert.equal(lines.within([9, 9, 21, 15], FOUR), false, 'two of its points');

// ON WHICH LAYER (Rule 2): a line of a level on that one; of the ground on the ground; on every
// level on each, but on no slice; a slice's wherever it runs; hidden by its own switch, on none.
const at = (note) => [
  lines.here(note, 'top', 24),
  lines.here(note, 'top', 30),
  lines.here(note, 'top', 'ground'),
  lines.here(note, 'side', 20),
  lines.here(note, 'end', 20),
];
assert.deepEqual(at({ view: 'top', at: 24, line: FOUR }), [true, false, false, false, false]);
assert.deepEqual(at({ view: 'top', at: 'ground', line: FOUR }), [false, false, true, false, false]);
assert.deepEqual(at({ view: 'top', at: 'every', line: FOUR }), [true, true, true, false, false]);
assert.deepEqual(at({ view: 'side', at: 36, line: FOUR }), [false, false, false, true, false]);
assert.deepEqual(at({ view: 'end', at: 100, line: FOUR }), [false, false, false, false, true]);
const HIDDEN = { view: 'top', at: 'every', hidden: true, line: FOUR };
assert.deepEqual(at(HIDDEN), [false, false, false, false, false]);
// Nothing but `true` hides it.
assert.deepEqual(at({ ...HIDDEN, hidden: 'yes' }), [true, true, true, false, false]);

// WHAT IS SAID OF IT: its corners, its length in all to the centimetre, its colour's name - and
// on every level, hidden or not. 10 + 10 + 10 cells, 15 m; one corner off the grid, 15.01 m.
const OFF = [10, 10, 20, 10, 20, 20, 10.02, 20, '#3a7bd5'];
const said = (note, name) => lines.words(note, CELL_M, name);
assert.equal(
  said({ view: 'top', at: 24, line: FOUR }, 'red'),
  'Line of 4 corners, 15 m long, in red.',
);
assert.equal(
  said({ view: 'top', at: 24, line: OFF }, 'Boundary'),
  'Line of 4 corners, 14.99 m long, in Boundary.',
);
assert.equal(
  said({ view: 'top', at: 'every', line: FOUR }, 'red'),
  'Line of 4 corners, 15 m long, in red, on every level.',
);
assert.equal(said(HIDDEN, 'red'), 'Line of 4 corners, 15 m long, in red, on every level, hidden.');
assert.equal(
  said({ view: 'side', at: 36, line: [0, 0, 3, 4, 1] }, 'blue'),
  'Line of 2 corners, 2.5 m long, in blue.',
);

// THE LINE IN PROGRESS: pressed four times and a fifth at the last point, which adds none;
// escaped once, the point being placed dropped and the four kept; pressed again, one more; and
// escaped twice, the line gone. Ended: none of one point, the points of two.
let drawing = null;
for (const point of CORNERS) drawing = lines.pressed(drawing, point, 0.3);
assert.deepEqual(drawing, { points: CORNERS, placing: true });
assert.equal(lines.pressed(drawing, [10.2, 20.1], 0.3), null, 'the second click of a double-click');
drawing = lines.escaped(drawing);
assert.deepEqual(drawing, { points: CORNERS, placing: false });
assert.equal(lines.pressed(drawing, [10, 20], 0.3), null, 'at the last point still none');
drawing = lines.pressed(drawing, [10, 12], 0.3);
assert.deepEqual(drawing, { points: [...CORNERS, [10, 12]], placing: true });
drawing = lines.escaped(drawing);
assert.equal(drawing.placing, false);
assert.equal(lines.escaped(drawing), null, 'a second Escape drops the line');
assert.equal(lines.escaped(null), null);
assert.equal(lines.ended(lines.pressed(null, [3, 4], 0.3)), null, 'a line of one point');
assert.equal(lines.ended(null), null);
const TWO = lines.pressed(lines.pressed(null, [3, 4], 0.3), [5, 4], 0.3);
assert.deepEqual(lines.ended(TWO), [
  [3, 4],
  [5, 4],
]);

// THE ERASER (strokes.js), from above on level 24: a line of four points on it, one on level 30
// and one on every level, one hidden by its switch, and one of the side view.
sketch.onChange = () => {};
const LEVEL = 24;
const SQUARE = { view: 'top', at: LEVEL, line: FOUR };
const UPPER = { view: 'top', at: 30, line: [40, 40, 44, 40, 1] };
const EVERY = { view: 'top', at: 'every', line: [50, 50, 54, 50, 2] };
const SHUT = { view: 'top', at: 'every', hidden: true, line: [60, 60, 64, 60, 2] };
const SIDE = { view: 'side', at: 36, line: [15, 20, 25, 20, 1] };
const notes = () => sketch.doc.notes;
function begin() {
  sketch.doc.notes = JSON.parse(JSON.stringify([SQUARE, UPPER, EVERY, SHUT, SIDE]));
  sketch.doc.on.top = LEVEL;
  assert.equal(sketch.on(), LEVEL);
}
const erase = (a, b = a) => sketch.apply({ tool: 'erase', from: a, to: b, colour: 0 });
begin();
// A dragged box over two of its points, [20, 10] and [20, 20], takes nothing.
erase([19, 9], [21, 21]);
assert.deepEqual(notes(), [SQUARE, UPPER, EVERY, SHUT, SIDE]);
// The line of level 30 is not on 24, and the one hidden by its switch is on no level: neither is
// taken, by a click or by a box over it all.
erase([42, 40]);
erase([62, 60]);
erase([59, 59], [65, 61]);
assert.deepEqual(notes(), [SQUARE, UPPER, EVERY, SHUT, SIDE]);
// A click on its third segment takes it; one where it is open, nothing.
erase([10.1, 15]);
assert.equal(notes().length, 5);
erase([15, 20.1]);
assert.deepEqual(notes(), [UPPER, EVERY, SHUT, SIDE]);
// Level 24 went with it: drawn on level 30 now, the line on every level is taken from there.
assert.equal(sketch.on(), 30);
erase([52, 50]);
assert.deepEqual(notes(), [UPPER, SHUT, SIDE]);
// And so from the ground: a line on every level is on it too.
begin();
sketch.doc.on.top = 'ground';
assert.equal(sketch.on(), 'ground');
erase([49, 49], [55, 51]);
assert.deepEqual(notes(), [SQUARE, UPPER, SHUT, SIDE]);

// A LINE WRITTEN: of two points or more, at the layer drawn on or the one it names; of one, none.
begin();
sketch.apply({ tool: 'line', points: CORNERS, colour: '#3a7bd5' });
assert.deepEqual(notes().at(-1), {
  view: 'top',
  at: LEVEL,
  line: [...FOUR.slice(0, -1), '#3a7bd5'],
});
sketch.apply({ tool: 'line', points: TWO.points, colour: 4, at: 30 });
assert.deepEqual(notes().at(-1), { view: 'top', at: 30, line: [3, 4, 5, 4, 4] });
sketch.apply({ tool: 'line', points: [[3, 4]], colour: 4 });
assert.equal(notes().length, 7);

// A LENGTH AND AN ANGLE TYPED (T-039.4): digits with one point or one comma, more than nought, to
// the centimetre by the digits; an angle may have a minus, and is taken round to 0 up to 360.
const LONG = 'A length is a number of metres, more than nought.';
const typed = (texts, as) => texts.map((text) => as(text));
assert.deepEqual(typed(['12.34', '12,34', '12.345', ' 3 '], lines.typedLength), [
  { m: 12.34 },
  { m: 12.34 },
  { m: 12.35 },
  { m: 3 },
]);
for (const text of ['0', '-1', '1e2', '12.3.4', '', '4 m', '0.004'])
  assert.deepEqual(lines.typedLength(text), { refused: LONG }, text);
assert.deepEqual(
  typed(['30', '30.05', '-90', '360', '725', '-0'], lines.typedAngle).map(({ deg }) => deg),
  [30, 30.1, 270, 0, 5, 0],
);
assert.ok(!Object.is(lines.typedAngle('-0').deg, -0));
for (const text of ['north', '', '-', '30°', '1e2'])
  assert.deepEqual(lines.typedAngle(text), { refused: 'An angle is a number of degrees.' }, text);

// A SEGMENT SET: the second of a line of four points, 12.34 m at 30° from [60, 30] - its end to
// the millimetre, the three other points where they were, and read back 12.34 m and 30.0°; the
// same in a flipped view, where columns run leftwards; and two that leave the plot's paper.
const PAPER = { cellM: CELL_M, flip: false, wide: paper.WIDE, rows: paper.ROWS };
const ROUND = [40, 30, 60, 30, 70, 40, 50, 50, '#c0392b'];
const readBack = (a, b, flip) => {
  const { m, deg } = lines.measured(a, b, CELL_M, flip);
  return [m.toFixed(2), deg.toFixed(1)];
};
const set = lines.setSegment(ROUND, 1, 12.34, 30, PAPER);
assert.deepEqual(set, { line: [40, 30, 60, 30, 81.374, 17.66, 50, 50, '#c0392b'] });
assert.deepEqual(readBack([60, 30], [81.374, 17.66], false), ['12.34', '30.0']);
const flipped = lines.setSegment(ROUND, 1, 12.34, 30, { ...PAPER, flip: true });
assert.deepEqual(flipped, { line: [40, 30, 60, 30, 38.626, 17.66, 50, 50, '#c0392b'] });
assert.deepEqual(readBack([60, 30], [38.626, 17.66], true), ['12.34', '30.0']);
assert.deepEqual(lines.setSegment([1, 2, 3, 4], 0, 1, 90, PAPER), { line: [1, 2, 1, 0] });
// Beyond the paper, set all the same - the paper has no edge (ST-042): 40 m at 30° from [60, 30]
// is 80 cells, 69.282 along and 40 up, to [129.282, -10]; 15.5 m at 90° from [40, 30], to [40, -1].
const BEYOND = [40, 30, 60, 30, 129.282, -10, 50, 50, '#c0392b'];
assert.deepEqual(lines.setSegment(ROUND, 1, 40, 30, PAPER), { line: BEYOND });
const UP_OFF = [40, 30, 40, -1, 70, 40, 50, 50, '#c0392b'];
assert.deepEqual(lines.setSegment(ROUND, 0, 15.5, 90, PAPER), { line: UP_OFF });
assert.equal(ROUND[4], 70); // The line handed is not changed.
// And at random, on the made-up cell: every end read back to the centimetre, and of a segment
// of 1 m or more to a tenth of a degree, from the middle of the paper to 10 m from it.
let seed = 39;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const MIDDLE = [paper.WIDE / 2, paper.ROWS / 2];
for (let n = 0; n < 2000; n += 1) {
  const [m, deg] = [1 + Math.round(random() * 900) / 100, Math.round(random() * 3599) / 10];
  const { line } = lines.setSegment([...MIDDLE, 0, 0], 0, m, deg, PAPER);
  const back = readBack(MIDDLE, line.slice(2), false);
  assert.deepEqual(back, [m.toFixed(2), deg.toFixed(1)], `${m} m at ${deg}°`);
}

// ON EVERY LEVEL, ITS SWITCH, ITS COLOUR: a hidden line off every level is on the level, its
// switch gone; on again; hidden and shown; recoloured to one of the eleven and to a value, the
// points as they were.
const note = { view: 'top', at: 'every', hidden: true, line: [1, 2, 3, 4, 5, 6, 2] };
lines.everyLevel(note, false, 18);
assert.deepEqual(note, { view: 'top', at: 18, line: [1, 2, 3, 4, 5, 6, 2] });
lines.everyLevel(note, true, 18);
assert.deepEqual(note, { view: 'top', at: 'every', line: [1, 2, 3, 4, 5, 6, 2] });
lines.hide(note, true);
assert.equal(note.hidden, true);
lines.hide(note, false);
assert.ok(!('hidden' in note));
lines.recolour(note, 6);
assert.deepEqual(note.line, [1, 2, 3, 4, 5, 6, 6]);
lines.recolour(note, '#c0392b');
assert.deepEqual(note.line, [1, 2, 3, 4, 5, 6, '#c0392b']);
const plain = { view: 'top', at: 18, line: [1, 2, 3, 4] };
lines.recolour(plain, 4);
assert.deepEqual(plain, { view: 'top', at: 18, line: [1, 2, 3, 4, 4] });

process.stdout.write(
  'tools/sketch/lines: points, measures, reach, layers, words and the line in progress hold, the eraser takes a line by any segment and none that its switch hides, and a line selected is typed, put on every level, hidden and recoloured\n',
);
