// The check of a parcel taken by the marking (ST-043, T-043.4): marking.js by hand, with nothing
// running and no file read. A ring of 35 corners to the decimetre - as many as the trial's, and as
// it gave them - made up at the origin of the Swiss grid, and no parcel that exists, taken in the
// place of the pentagon marked: every figure as it came, on the cadastral map, its side the
// longest, the ground around as it was, its area as `paperOf` says and by hand; whether it is still
// as given after a corner added, moved or undone - and after a side picked and the ground changed,
// which change no corner; the parcel let go by "Start again" and by an undo to no corner; two
// corners and 1001 refused, nothing changed; the two sentences of whose the corners are, to the
// letter; and the order, as given and changed, as `orderOf` reads it - and the order of a plot
// marked by hand, with no `parcel` key. Run by check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { longest, paperOf } from '../new-plot/frame.js';
import { CORNERS_MAX, orderOf } from '../new-plot/request.js';
import { GEOPORTAL } from '../swisstopo/hosts.js';
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
// The ring: its first side runs 40 m east along the south, the longest by far - the next is under
// 6 m; then up the east side, west along a curved road of 26 corners, and down the west side.
// By the shoelace, by hand over its figures in decimetres: 903.71 m².
const RING = corners(
  ...[0, 0, 40, 0, 40.4, 5.3, 40.1, 11.2, 39.7, 16.8, 39.2, 21.7, 37.7, 21.7, 36.2, 21.8],
  ...[34.7, 22.5, 33.2, 22.9, 31.7, 22.7, 30.2, 23, 28.7, 23.6, 27.2, 23.7, 25.7, 23.5],
  ...[24.2, 23.8, 22.7, 24.3, 21.2, 24, 19.8, 23.7, 18.3, 24, 16.8, 24.2, 15.3, 23.6],
  ...[13.8, 23.4, 12.3, 23.6, 10.8, 23.4, 9.3, 22.7, 7.8, 22.5, 6.3, 22.6, 4.8, 22.1],
  ...[3.3, 21.4, 1.8, 21.4, 0.9, 17.6, 0.4, 12.3, 0.7, 7.1, 0.2, 3.4],
);
// A made-up parcel, the stand-in's: its EGRID, its number and its canton.
const PARCEL = { egrid: 'CH999912341234', number: '1234', canton: 'BE' };
// What the page says, typed in, to the letter - but the portal's name, which hosts.js alone types.
const HAND =
  'Marked by hand on a map: good to a few decimetres, no survey, and of no legal effect.';
const GIVEN = `Parcel 1234 (BE) of the official survey, as ${GEOPORTAL} gives it: no extract of the land register, and of no legal effect.`;
const CHANGED =
  'After parcel 1234 (BE) of the official survey, changed by hand: no survey, and of no legal effect.';
const FEW = 'A parcel of fewer than three corners encloses nothing.';
const FULL = 'An outline has 1000 corners at the most.';
assert.deepEqual([RING.length, CORNERS_MAX, longest(RING)], [35, 1000, 0]);

/** A marking with the ring taken, and nothing else done. */
const taken = () => {
  const plot = marking();
  assert.equal(plot.take(RING, PARCEL), '');
  return plot;
};
const given = (plot) => plot.read().parcel?.asGiven;
const parcel = (asGiven) => ({ ...PARCEL, asGiven });

// The pentagon marked on the photo, its paper along another side, with 2.5 m of ground around:
// the ring taken in its place - every figure as it came, each on the cadastral map, the side the
// longest again, the ground as it was - and the parcel's, as given.
const plot = marking();
for (const place of PENTAGON) assert.equal(plot.add(placed(place), 28, 'photo'), '');
assert.equal(plot.around(2.5), '');
plot.pick(1);
assert.deepEqual([plot.read().side, plot.read().parcel, plot.read().said.survey], [1, null, HAND]);
assert.equal(plot.take(RING, PARCEL), '');
const now = plot.read();
assert.deepEqual(now.corners, RING);
assert.deepEqual([now.on, now.side, now.aroundM], [['cadastral'], 0, 2.5]);
assert.deepEqual(now.paper, paperOf(RING, 0, 2.5));
assert.equal(Math.round(now.paper.areaM2 * 100) / 100, 903.71);
assert.deepEqual(now.parcel, parcel(true));
assert.deepEqual([now.said.corners, now.said.survey], ['35 corners, 904 m².', GIVEN]);

// A side picked and the ground changed change no corner: still as given. A corner that is not
// set - from afar - and one moved that is not there change nothing either.
const kept = taken();
kept.pick(1);
kept.pick(-1);
assert.equal(kept.around(10), '');
assert.notEqual(kept.around(21), '', 'no such figure');
assert.notEqual(kept.add(placed([E0 + 20, N0 + 30]), 25, 'cadastral'), '', 'from afar');
kept.move(35, placed([E0 + 20, N0 + 30]), 'cadastral');
assert.deepEqual([given(kept), kept.read().corners], [true, RING]);
// A corner added, moved or undone: changed by hand, and said so - the parcel still named.
const added = taken();
assert.equal(added.add(placed([E0 + 20, N0 + 12]), 28, 'cadastral'), '');
const moved = taken();
moved.move(3, placed([E0 + 41, N0 + 11.2]), 'cadastral');
const undone = taken();
undone.undo();
for (const one of [added, moved, undone]) {
  assert.deepEqual([one.read().parcel, one.read().said.survey], [parcel(false), CHANGED]);
}
// And a side picked after: still changed. A parcel taken anew over it is as given again.
moved.pick(1);
assert.equal(given(moved), false);
assert.equal(moved.take(RING, PARCEL), '');
assert.deepEqual([moved.read().parcel, moved.read().corners], [parcel(true), RING]);

// "Start again" lets the parcel go, and so does an undo that leaves no corner - not one before.
const again = taken();
again.clear();
assert.deepEqual([again.read().parcel, again.read().said.survey], [null, '']);
for (const place of PENTAGON) assert.equal(again.add(placed(place), 28, 'cadastral'), '');
assert.deepEqual([again.read().parcel, again.read().said.survey], [null, HAND]);
const back = marking();
assert.equal(back.take(RING.slice(0, 3), PARCEL), '');
back.undo();
back.undo();
assert.deepEqual(back.read().parcel, parcel(false), 'one corner left');
back.undo();
assert.equal(back.read().parcel, null);
for (const place of RING.slice(0, 3)) assert.equal(back.add(placed(place), 28, 'cadastral'), '');
assert.deepEqual([back.read().parcel, back.read().said.survey], [null, HAND]);

// Two corners, and 1001, are refused in their sentences, and nothing changes; 1000 are taken.
const refusing = taken();
refusing.add(placed([E0 + 20, N0 + 12]), 28, 'photo');
const before = refusing.read();
const many = (count) => Array.from({ length: count }, (_, at) => [E0 + at / 10, N0 + (at % 2)]);
assert.equal(refusing.take(RING.slice(0, 2), PARCEL), FEW);
assert.equal(refusing.take(many(1001), PARCEL), FULL);
assert.equal(marking().take([], PARCEL), FEW);
assert.deepEqual(refusing.read(), before);
const thousand = marking();
assert.equal(thousand.take(many(1000), PARCEL), '');
assert.deepEqual([thousand.read().corners.length, given(thousand)], [1000, true]);

// The order: the parcel as its sixth field, as given and changed, read by `orderOf` field for
// field, its corners the ring's; and of a plot marked by hand, or let go, no `parcel` key at all.
const FIELDS = ['name', 'corners', 'side', 'aroundM', 'on', 'parcel'];
for (const [one, asGiven] of [
  [taken(), true],
  [undone, false],
]) {
  const order = one.order('Musterlingen 1234');
  assert.deepEqual(Object.keys(order), FIELDS);
  assert.deepEqual(orderOf(JSON.stringify(order)), order);
  assert.deepEqual(order.parcel, parcel(asGiven));
}
assert.deepEqual(taken().order('p').corners, RING);
for (const one of [again, back]) {
  const order = one.order('p');
  assert.deepEqual(Object.keys(order), FIELDS.slice(0, -1));
  assert.deepEqual(orderOf(JSON.stringify(order)), order);
  assert.ok(!Object.hasOwn(orderOf(JSON.stringify(order)), 'parcel'));
}

process.stdout.write(
  'tools/sketch/map: a parcel taken - 35 corners as they came in the place of what was marked, on the cadastral map along its longest side, as given until a corner is added, moved or undone, let go with the last corner, two and 1001 refused, said whose they are, and its order named\n',
);
