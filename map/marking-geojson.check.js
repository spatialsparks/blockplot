// The check of a GeoJSON file's outline taken by the marking (ST-045, T-045.1): marking.js by
// hand, with nothing running and no file read. The made-up pentagon, as a file gives it, taken in
// the place of corners marked by hand and of a parcel taken: every corner to the centimetre,
// marked on nothing, its side the longest, the ground around as it was, the parcel let go; whether
// it is still as given after a corner moved, added or undone; the file let go by "Start again", by
// an undo to no corner and by a parcel taken after it; the four sentences of whose the corners
// are, to the letter; the order, as `orderOf` reads it back field for field; two corners and 1001
// refused, nothing changed; and an outline whose paper is too large, taken all the same and said
// so in the sentence of `paperOf`. All of it lies at the origin of the Swiss grid. Run by check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { longest, paperOf } from '../new-plot/frame.js';
import { PAPER_MAX_M, SAID as MAKING, orderOf } from '../new-plot/request.js';
import { marking } from './marking.js';

const [E0, N0] = [2_600_000, 1_200_000];
/** Places of a flat list of figures, two a place: so many metres east and north of the origin. */
const corners = (...metres) =>
  Array.from({ length: metres.length / 2 }, (_, at) => [
    E0 + metres[2 * at],
    N0 + metres[2 * at + 1],
  ]);
const placed = ([e, n]) => ({ e, n });
const PENTAGON = corners(20, 10, 38, 34, 28.4, 41.2, 10, 30, 4, 22);
// The pentagon as a file may give it, a hair beyond the centimetre: the marking takes it to it.
const GIVEN = PENTAGON.map(([e, n], at) => [e + (at % 2 ? 0.004 : -0.003), n + 0.0049]);
const RECTANGLE = corners(0, 0, 40, 0, 40, 25, 0, 25);
const PARCEL = { egrid: 'CH999912341234', number: '1234', canton: 'BE' };
// What the page says, typed in, to the letter.
const HAND =
  'Marked by hand on a map: good to a few decimetres, no survey, and of no legal effect.';
const SURVEY = {
  'false true': 'From a file you gave: no survey, and of no legal effect.',
  'false false': 'After a file you gave, changed by hand: no survey, and of no legal effect.',
  'true true':
    'From a file you gave, converted from WGS84 to about a metre: no survey, and of no legal effect.',
  'true false':
    'After a file you gave, converted from WGS84 to about a metre, changed by hand: no survey, and of no legal effect.',
};
const FEW = 'An outline of fewer than three corners encloses nothing.';
const FULL = 'An outline has 1000 corners at the most.';
const surveyOf = ({ wgs84, asGiven }) => SURVEY[`${wgs84} ${asGiven}`];
assert.equal(longest(PENTAGON), 0);

/** A marking with the pentagon taken from a file, and nothing else done. */
const taken = (wgs84 = false) => {
  const plot = marking();
  assert.equal(plot.takeFile(GIVEN, { wgs84 }), '');
  return plot;
};

// Over corners marked by hand on the photo, its paper along another side, with 2.5 m of ground
// around: the file's corners in their place, each to the centimetre, marked on nothing, the side
// the longest again, the ground as it was - and the file's, as given.
for (const wgs84 of [false, true]) {
  const plot = marking();
  for (const place of RECTANGLE) assert.equal(plot.add(placed(place), 28, 'photo'), '');
  assert.equal(plot.around(2.5), '');
  plot.pick(1);
  assert.deepEqual([plot.read().side, plot.read().file, plot.read().said.survey], [1, null, HAND]);
  assert.equal(plot.takeFile(GIVEN, { wgs84 }), '');
  const now = plot.read();
  assert.deepEqual(now.corners, PENTAGON);
  assert.deepEqual([now.on, now.side, now.aroundM], [[], 0, 2.5]);
  assert.deepEqual(now.paper, paperOf(PENTAGON, 0, 2.5));
  assert.deepEqual([now.parcel, now.file], [null, { wgs84, asGiven: true }]);
  assert.deepEqual(
    [now.said.corners, now.said.survey],
    ['5 corners, 520 m².', SURVEY[`${wgs84} true`]],
  );
}
// Over a parcel taken: the parcel let go - a parcel and a file never stand together.
const overParcel = marking();
assert.equal(overParcel.take(RECTANGLE, PARCEL), '');
assert.equal(overParcel.takeFile(GIVEN, { wgs84: true }), '');
assert.deepEqual(
  [overParcel.read().parcel, overParcel.read().file, overParcel.read().on],
  [null, { wgs84: true, asGiven: true }, []],
);
// And a parcel taken over a file lets the file go.
const parcelAfter = taken();
assert.equal(parcelAfter.take(RECTANGLE, PARCEL), '');
assert.deepEqual([parcelAfter.read().file, parcelAfter.read().parcel?.asGiven], [null, true]);
assert.deepEqual(parcelAfter.read().on, ['cadastral']);

// A side picked and the ground changed change no corner: still as given. A corner moved, added
// or undone: changed by hand, and said so - converted from WGS84 or not - the file still named;
// and what showed while a corner was set or moved is what the corners were marked on.
const kept = taken();
kept.pick(1);
assert.equal(kept.around(10), '');
assert.deepEqual(
  [kept.read().file, kept.read().said.survey],
  [{ wgs84: false, asGiven: true }, SURVEY['false true']],
);
for (const wgs84 of [false, true]) {
  const moved = taken(wgs84);
  moved.move(2, placed([E0 + 29, N0 + 41]), 'national');
  const added = taken(wgs84);
  assert.equal(added.add(placed([E0 + 8, N0 + 14]), 28, 'photo'), '');
  const undone = taken(wgs84);
  undone.undo();
  for (const [one, on] of [
    [moved, ['national']],
    [added, ['photo']],
    [undone, []],
  ]) {
    const now = one.read();
    assert.deepEqual([now.file, now.parcel, now.on], [{ wgs84, asGiven: false }, null, on]);
    assert.equal(now.said.survey, surveyOf({ wgs84, asGiven: false }));
  }
  // Taken anew over it: as given again.
  assert.equal(moved.takeFile(GIVEN, { wgs84 }), '');
  assert.deepEqual([moved.read().file, moved.read().on], [{ wgs84, asGiven: true }, []]);
}

// "Start again" lets the file go, and so does an undo that leaves no corner - not one before.
const again = taken(true);
again.clear();
assert.deepEqual([again.read().file, again.read().said.survey], [null, '']);
for (const place of PENTAGON) assert.equal(again.add(placed(place), 28, 'photo'), '');
assert.deepEqual([again.read().file, again.read().said.survey], [null, HAND]);
const back = marking();
assert.equal(back.takeFile(GIVEN.slice(0, 3), { wgs84: false }), '');
back.undo();
back.undo();
assert.deepEqual(back.read().file, { wgs84: false, asGiven: false }, 'one corner left');
back.undo();
assert.equal(back.read().file, null);

// Two corners, and 1001, are refused in their sentences, and nothing changes; 1000 are taken.
const refusing = taken(true);
refusing.move(0, placed([E0 + 21, N0 + 10]), 'photo');
const before = refusing.read();
const many = (count) => Array.from({ length: count }, (_, at) => [E0 + at / 10, N0 + (at % 2)]);
assert.equal(refusing.takeFile(GIVEN.slice(0, 2), { wgs84: false }), FEW);
assert.equal(refusing.takeFile(many(1001), { wgs84: false }), FULL);
assert.equal(marking().takeFile([], { wgs84: false }), FEW);
assert.deepEqual(refusing.read(), before);
const thousand = marking();
assert.equal(thousand.takeFile(many(1000), { wgs84: false }), '');
assert.deepEqual([thousand.read().corners.length, thousand.read().file?.asGiven], [1000, true]);

// The order: the file as its sixth field, as given and changed, converted or not, read by
// `orderOf` field for field, its corners the pentagon's, marked on nothing until a corner moved.
const FIELDS = ['name', 'corners', 'side', 'aroundM', 'on', 'file'];
const changed = taken(true);
changed.move(1, placed([E0 + 38, N0 + 35]), 'photo');
for (const [one, file, on] of [
  [taken(), { wgs84: false, asGiven: true }, []],
  [taken(true), { wgs84: true, asGiven: true }, []],
  [changed, { wgs84: true, asGiven: false }, ['photo']],
]) {
  const order = one.order('Made-up file');
  assert.deepEqual(Object.keys(order), FIELDS);
  assert.deepEqual(orderOf(JSON.stringify(order)), order);
  assert.deepEqual([order.file, order.on, order.side, order.aroundM], [file, on, 0, 5]);
}
assert.deepEqual(taken().order('p').corners, PENTAGON);
for (const one of [again, parcelAfter]) assert.ok(!Object.hasOwn(one.order('p'), 'file'));

// An outline whose paper is too large - 991 m by 20 m, with 5 m around: a paper of 1001 m by
// 30 m - is taken all the same, and said so in the sentence of `paperOf`.
const LONG = corners(0, 0, 991, 0, 991, 20, 0, 20);
const large = marking();
assert.equal(large.takeFile(LONG, { wgs84: false }), '');
const paper = large.read();
assert.deepEqual([paper.corners, paper.file], [LONG, { wgs84: false, asGiven: true }]);
assert.equal(PAPER_MAX_M, 1000);
assert.equal(paper.paper.refused, MAKING.large(1001, 30));
assert.deepEqual(paper.said, { corners: '4 corners.', survey: '', paper: MAKING.large(1001, 30) });

process.stdout.write(
  'tools/sketch/map: a file outline taken - its corners to the centimetre in the place of what was marked or taken, marked on nothing, as given until a corner is moved, added or undone, let go with the last corner or by a parcel, two and 1001 refused, said whose they are, converted from WGS84 or not, and its order named\n',
);
