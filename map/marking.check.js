// The check of the marking (ST-031): marking.js - what a plot is while it is
// marked, with nothing of the page in it - by hand, with nothing running and no file read but the
// script's own text. All of it lies at the origin of the Swiss grid, and is no plot that exists:
// the pentagon of the first hand case of a plot (T-031.3), corner after corner - what the page
// says at each, the area, the side that the paper lies along, the paper's sheet as `paperOf` has
// it, and the order as the server's own reader takes it; another side picked, and lost when a
// corner goes; a corner moved; the last taken away, and all; from how near a corner is set, and
// to the centimetre; a thousand corners and one more; an outline that crosses itself and a paper that
// is too large, each in the sentence of `paperOf`; the ground around, and what is no such figure
// in the order's own sentence; and what the corners were marked on. The marks on the map and
// the plot's side are a browser test's, tests/e2e/sketch-new-plot.spec.ts. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { paperOf } from '../new-plot/frame.js';
import { AROUND_M, CORNERS_MAX, orderOf } from '../new-plot/request.js';
import { LEVELS, MARK_FROM } from '../swisstopo/hosts.js';
import { marking } from './marking.js';
import { MARKED } from './marks.js';

const [E0, N0] = [2_600_000, 1_200_000];
/** Places of a flat list of figures, two a place: so many metres east and north of the origin. */
const corners = (...metres) =>
  Array.from({ length: metres.length / 2 }, (_, at) => [
    E0 + metres[2 * at],
    N0 + metres[2 * at + 1],
  ]);
const placed = ([e, n]) => ({ e, n });
/** A place to the millimetre, in metres from the origin. */
const mm = ([e, n]) => [e - E0, n - N0].map((metres) => Math.round(metres * 1000) / 1000 + 0);
// What the page says, typed in, to the letter.
const NONE = 'No corner yet. Go near, and click the corners of your plot, one after the other.';
const SURVEY =
  'Marked by hand on a map: good to a few decimetres, no survey, and of no legal effect.';
const FAR = 'Come nearer to mark a corner: here a pixel of the map is more than half a metre.';
const FULL = 'An outline has 1000 corners at the most.';
const NO_FIGURE = 'The ground around the plot is none: 0 to 20 m, in steps of half a metre.';
const CROSSES = 'Its outline crosses itself.';
const LARGE =
  'Its paper would be 1001 m by 30 m, and the pad takes 1000 m each way: mark a smaller plot, or less ground around it.';
const lies = (side, count, long, along, across) =>
  `The paper lies along side ${side} of ${count}, ${long} m long, and will be ${along} m by ${across} m.`;
// The figures that the sentences state: a thousand corners, and half a metre a pixel from level 26 on.
assert.deepEqual([CORNERS_MAX, MARK_FROM, LEVELS[MARK_FROM], AROUND_M], [1000, 26, 0.5, 5]);
assert.equal(MARKED, 'marked');

/** A plot with these corners marked, each a click from near on the cadastral map. */
const marked = (places, shows = 'cadastral') => {
  const plot = marking();
  for (const place of places) assert.equal(plot.add(placed(place), 28, shows), '');
  return plot;
};
const PENTAGON = corners(20, 10, 38, 34, 28.4, 41.2, 10, 30, 4, 22);
const RECTANGLE = corners(10, 10, 34, 10, 34, 26, 10, 26);

// The pentagon, corner after corner. No corner: the page says how one is set, and nothing else.
// One and two: how many. From the third the outline closes: its area to a whole square metre,
// that it is no survey, and the paper - along the longest side, which of three corners is the
// third, 32.3 m back to the first, and from the fourth on the first, 30 m.
const plot = marking();
const SAID = [
  { corners: NONE, survey: '', paper: '' },
  { corners: '1 corner.', survey: '', paper: '' },
  { corners: '2 corners.', survey: '', paper: '' },
  { corners: '3 corners, 180 m².', survey: SURVEY, paper: lies(3, 3, 32.3, 42.5, 21.5) },
  { corners: '4 corners, 420 m².', survey: SURVEY, paper: lies(1, 4, 30, 40, 30) },
  { corners: '5 corners, 520 m².', survey: SURVEY, paper: lies(1, 5, 30, 40, 30) },
];
const NOTHING = { corners: [], side: 0, on: [], paper: null, parcel: null, said: SAID[0] };
const empty = (aroundM) => ({ ...NOTHING, aroundM });
assert.deepEqual(plot.read(), empty(5));
PENTAGON.forEach((place, at) => {
  assert.equal(plot.add(placed(place), 28, 'cadastral'), '', `corner ${at + 1}`);
  const now = plot.read();
  assert.deepEqual(now.said, SAID[at + 1], `corner ${at + 1}`);
  assert.deepEqual(now.corners, PENTAGON.slice(0, at + 1), `corner ${at + 1}`);
  assert.equal(now.paper === null, at < 2, `corner ${at + 1}: no paper before the third`);
});
// Five corners: the first side the longest, 520 m², and the paper's sheet - its four corners in
// LV95, round the paper from where x and y are least - `paperOf`'s very figures, and by hand.
const five = plot.read();
const paper = paperOf(PENTAGON, 0, 5);
assert.deepEqual([five.side, five.aroundM, five.on], [0, 5, ['cadastral']]);
assert.deepEqual(five.paper, paper);
assert.deepEqual([five.paper.areaM2, five.paper.bearingDeg], [520, 36.8699]);
assert.deepEqual(five.paper.sheet.map(mm), corners(21, 3, 45, 35, 21, 53, -3, 21).map(mm));
// And the order, as the server's own reader takes one - to the letter the first hand case's, of
// new-plot/made.check.js - with a name that the script after this one adds.
const HAND =
  '{"name":"Trial slope","corners":[[2600020,1200010],[2600038,1200034],[2600028.4,1200041.2],[2600010,1200030],[2600004,1200022]],"side":0,"aroundM":5,"on":["cadastral"]}';
assert.equal(JSON.stringify(plot.order('Trial slope')), HAND);
assert.deepEqual(orderOf(HAND), plot.order('Trial slope'));

// Another side picked: the next, and the one before - round the outline, from the first to the
// last. The paper then lies along it: along the second side, 12 m, it is the first one's sheet
// a quarter on; along the fifth, 20 m.
plot.pick(1);
assert.deepEqual([plot.read().side, plot.read().said.paper], [1, lies(2, 5, 12, 30, 40)]);
assert.equal(plot.read().paper.bearingDeg, 306.8699);
plot.pick(-1);
plot.pick(-1);
assert.deepEqual([plot.read().side, plot.read().said.paper], [4, lies(5, 5, 20, 30, 40)]);
assert.equal(plot.order('p').side, 4);
plot.pick(1);
assert.equal(plot.read().side, 0, 'the next after the last is the first');
// A side that was picked stays where a corner is moved - and is lost when a corner goes, or one
// is added: the paper lies along the longest again.
plot.pick(1);
plot.move(4, { e: E0 + 4.004, n: N0 + 13.996 }, 'photo');
assert.deepEqual([plot.read().side, plot.read().corners[4]], [1, [E0 + 4, N0 + 14]]);
plot.undo();
assert.deepEqual(plot.read().said, SAID[4]);
plot.pick(-1);
assert.equal(plot.read().side, 3);
assert.equal(plot.add(placed(PENTAGON[4]), 26, 'cadastral'), '');
assert.deepEqual(plot.read().said, SAID[5]);

// A corner moved: the fifth, 8 m south, to the centimetre of where it was let go. The outline
// then encloses 560 m², and its paper is 6.5 m longer at its foot. A corner that there is not
// is not moved.
plot.move(4, { e: E0 + 4.004, n: N0 + 13.996 }, 'cadastral');
const moved = plot.read();
assert.deepEqual(moved.corners, [...PENTAGON.slice(0, 4), [E0 + 4, N0 + 14]]);
assert.deepEqual(moved.said, {
  corners: '5 corners, 560 m².',
  survey: SURVEY,
  paper: lies(1, 5, 30, 46.5, 30),
});
for (const none of [5, -1, 1.5, undefined]) plot.move(none, { e: E0, n: N0 }, 'cadastral');
assert.deepEqual(plot.read(), moved);
// The last taken away, and all: nothing is left but the ground around as it was set - which
// the order says too - and no side that was picked.
assert.equal(plot.around(2.5), '');
plot.undo();
assert.deepEqual([plot.read().corners, plot.read().aroundM], [PENTAGON.slice(0, 4), 2.5]);
plot.pick(1);
assert.deepEqual([plot.order('p').side, plot.order('p').aroundM], [1, 2.5]);
plot.clear();
assert.deepEqual(plot.read(), empty(2.5));
// Of nothing, nothing is taken away, and no side is picked: of two corners neither.
for (const nothing of [plot.undo, plot.clear, () => plot.pick(1), () => plot.pick(-1)]) {
  nothing();
  assert.deepEqual(plot.read(), empty(2.5));
}
const twoCorners = marked(PENTAGON.slice(0, 2));
twoCorners.pick(1);
assert.deepEqual([twoCorners.read().side, twoCorners.order('p').side], [0, 0]);
// An area is said to a whole square metre, the nearest: 3 m by half a metre, 1.5 m², are 2 -
// and 3 m by 40 cm are 1.
const strip = (deep) => marked(corners(0, 0, 3, 0, 3, deep, 0, deep)).read().said.corners;
assert.deepEqual([strip(0.5), strip(0.4)], ['4 corners, 2 m².', '4 corners, 1 m².']);

// From how near a corner is set: where a pixel is half a metre or less, level 26, and nearer.
// Further, none is set, and the page says to come nearer. And a corner is taken to the
// centimetre of the place that was clicked.
const near = marking();
for (const level of [0, 15, 24, 25])
  assert.equal(near.add(placed(PENTAGON[0]), level, 'photo'), FAR);
assert.deepEqual(near.read().corners, []);
for (const level of [26, 27, 28])
  assert.equal(near.add({ e: E0 + 0.014, n: N0 - 0.006 }, level, 'photo'), '');
assert.deepEqual(near.read().corners, Array(3).fill([E0 + 0.01, N0 - 0.01]));
assert.equal(near.read().said.paper, 'Two corners that follow each other lie at one place.');

// `CORNERS_MAX` corners, a thousand: a plot of 499 m by 10 m with a corner at every metre of its
// two long sides - 500 a side, from 0 to 499 m - so 499 m times 10 m, 4990 m², its paper along
// the first of its two short ones, side 500: 10 m long, 20 m with 5 m each way, and 499 m and
// twice 5 m, 509 m, across. And one more, which is not added: the page says why, and the order of
// a thousand is one that the server's reader takes.
const HALF = CORNERS_MAX / 2;
const thousand = Array.from({ length: CORNERS_MAX }, (_, at) =>
  at < HALF ? [E0 + at, N0] : [E0 + CORNERS_MAX - 1 - at, N0 + 10],
);
const full = marked(thousand);
assert.equal(full.read().said.corners, '1000 corners, 4990 m².');
assert.equal(full.read().said.paper, lies(500, 1000, 10, 20, 509));
assert.equal(full.add(placed(PENTAGON[0]), 28, 'cadastral'), FULL);
assert.deepEqual(full.read().corners, thousand);
assert.equal(orderOf(JSON.stringify(full.order('A thousand'))).refused, undefined);
// Too far is said before too many; and with a corner undone, the thousandth is set again.
assert.equal(full.add(placed(PENTAGON[0]), 25, 'cadastral'), FAR);
full.undo();
assert.equal(full.add(placed(thousand.at(-1)), 28, 'cadastral'), '');
assert.equal(full.add(placed(thousand.at(-1)), 28, 'cadastral'), FULL);

// What `paperOf` refuses is said in its sentence, with no area and no sheet: the rectangle's
// corners in the order 1, 2, 4, 3; and a plot of 991 m with 5 m around - which fits with 4.5 m.
const [first, second, third, fourth] = RECTANGLE;
const bow = marked([first, second, fourth, third]).read();
assert.deepEqual(bow.said, { corners: '4 corners.', survey: '', paper: CROSSES });
assert.deepEqual(bow.paper, { refused: CROSSES });
const long = marked(corners(0, 0, 991, 0, 991, 20, 0, 20));
assert.deepEqual(long.read().said, { corners: '4 corners.', survey: '', paper: LARGE });
assert.equal(long.around(4.5), '');
assert.equal(long.read().said.paper, lies(1, 4, 991, 1000, 29));
assert.equal(long.read().said.corners, '4 corners, 19820 m².');

// The ground around: 5 m until another figure is set, 0 to 20 m in halves. What is no such
// figure is said in the order's own sentence - asked of `orderOf` itself, and typed in - and
// the ground, and the paper with it, stay as they were.
const ground = marked(RECTANGLE);
assert.equal(ground.read().said.paper, lies(1, 4, 24, 34, 26));
for (const [figure, along, across] of [
  [0, 24, 16],
  [0.5, 25, 17],
  [19.5, 63, 55],
  [20, 64, 56],
]) {
  assert.equal(ground.around(figure), '', `${figure}`);
  assert.deepEqual(
    [ground.read().aroundM, ground.read().said.paper],
    [figure, lies(1, 4, 24, along, across)],
  );
}
assert.equal(orderOf(JSON.stringify({ ...ground.order('p'), aroundM: 21 })).refused, NO_FIGURE);
for (const none of [21, 20.5, -0.5, 0.25, Number.NaN, Infinity, undefined, null, '5', [5]]) {
  assert.equal(ground.around(none), NO_FIGURE, `${none}`);
  assert.equal(ground.read().aroundM, 20, `${none}`);
}
assert.equal(ground.around(-0), '');
assert.ok(Object.is(ground.read().aroundM, 0), 'a nought with a minus before it is a plain nought');

// What the corners were marked on: what showed while a corner was set or moved - the national
// map, the cadastral map, the aerial photo, in the order in which an order says them - of the
// corners that there are. A layer that no corner is marked on says nothing.
const on = (one) => one.read().on;
assert.deepEqual(on(marked(RECTANGLE)), ['cadastral']);
assert.deepEqual(on(marked(RECTANGLE, 'photo')), ['photo']);
const BOTH = ['cadastral', 'photo'];
const both = marked(RECTANGLE.slice(0, 3), 'photo');
assert.equal(both.add(placed(fourth), 26, 'cadastral'), '');
assert.deepEqual([on(both), both.order('p').on], [BOTH, BOTH]);
both.undo();
assert.deepEqual(on(both), ['photo'], 'of the corners that there are');
const turned = marked(RECTANGLE);
turned.move(2, placed(third), 'photo');
assert.deepEqual(on(turned), BOTH, 'a corner moved on the photo');
// The national map is one that a corner is marked on, where the pad offers no cadastre (T-044.10).
turned.move(2, placed(third), 'national');
assert.deepEqual(on(turned), ['national', ...BOTH], 'a corner moved on the national map');
turned.undo();
turned.undo();
assert.deepEqual(on(turned), ['cadastral']);
// A corner that was set on the one and moved on the other was marked on both: so of a plot
// whose every corner was.
for (const at of [0, 1]) turned.move(at, placed(RECTANGLE[at]), 'photo');
assert.deepEqual(on(turned), BOTH, 'every corner set on the cadastral map and moved on the photo');
const national = marked(RECTANGLE.slice(0, 3), 'national');
assert.deepEqual([on(national), national.order('p').on], [['national'], ['national']]);
// Where there is no cadastre: a corner set at 26 on the national map and moved on the photo.
const unsurveyed = marking();
assert.equal(unsurveyed.add(placed(RECTANGLE[0]), 26, 'national'), '');
unsurveyed.move(0, placed(RECTANGLE[0]), 'photo');
assert.deepEqual(on(unsurveyed), ['national', 'photo']);
for (const order of [marked(RECTANGLE), marked(RECTANGLE, 'photo'), both, national]) {
  assert.equal(orderOf(JSON.stringify(order.order('p'))).refused, undefined);
}

// Of the script, the text: it asks nobody, and the paper and the order are the server's own
// rules, loaded as modules - no sum of an area and no limit of an order is stated here.
const text = fs.readFileSync(path.join(import.meta.dirname, 'marking.js'), 'utf8');
assert.ok(!/\bfetch\b|XMLHttp|localStorage|sessionStorage/.test(text.replace(/^\s*\/\/.*$/gm, '')));
assert.ok(text.includes("import { longest, paperOf } from '../new-plot/frame.js';"));
assert.ok(/import \{[^}]*\borderOf\b[^}]*\} from '\.\.\/new-plot\/request\.js';/.test(text));

process.stdout.write(
  'tools/sketch/map: a plot while it is marked - the pentagon corner after corner, its area, its paper and its order as the server has them, a side picked, a corner moved and undone, a thousand corners and no more, none from afar, and what is refused in the sentence of its own rule\n',
);
