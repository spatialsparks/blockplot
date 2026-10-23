// The check of an order whose corners came from a GeoJSON file the person gave (ST-045, T-045.1):
// request.js by hand, with nothing running and no file read but request.js's own text. An order
// with a file, as given and changed, converted from WGS84 or not, read - marked on nothing, `[]`,
// or on a map; every shape of a file that is none refused in the tenth sentence, after the
// parcel's; a parcel and a file together refused in the eleventh; `on: []` without a file still
// refused in the eighth; an order without a file read as before, with no `file`. And request.js
// still imports nothing. All of it lies at the origin of the Swiss grid. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { orderOf } from './request.js';

const [E0, N0] = [2_600_000, 1_200_000];
const PENTAGON = [
  [E0 + 20, N0 + 10],
  [E0 + 38, N0 + 34],
  [E0 + 28.4, N0 + 41.2],
  [E0 + 10, N0 + 30],
  [E0 + 4, N0 + 22],
];
const ORDER = { name: 'Made-up file', corners: PENTAGON, side: 0, aroundM: 5, on: [] };
const PARCEL = { egrid: 'CH999912341234', number: '1234', canton: 'BE', asGiven: true };
const of = (order) => orderOf(JSON.stringify(order));
const refused = (sentence) => ({ status: 400, refused: sentence });
const EIGHTH = refused(
  'It does not say what the corners were marked on: a map, the aerial photo, or a map and the photo.',
);
const NINTH = refused(
  'Its parcel is none: an EGRID, CH and twelve figures; a number of 20 characters at the most; a canton, two capital letters; and whether its corners are as given.',
);
const TENTH = refused(
  'Its file is none: whether its corners were converted from WGS84, and whether they are as given.',
);
const ELEVENTH = refused("It has a parcel and a file: its corners are the one's or the other's.");

// An order with a file: each of the four, marked on nothing or on a map - read field for field,
// the file's two in order, however the order gave them.
const FILES = [true, false].flatMap((wgs84) =>
  [true, false].map((asGiven) => ({ wgs84, asGiven })),
);
assert.equal(FILES.length, 4);
for (const file of FILES) {
  for (const on of [[], ['national'], ['photo'], ['cadastral', 'photo']]) {
    const order = { ...ORDER, on, file };
    assert.deepEqual(of(order), order, JSON.stringify(order.on));
    assert.deepEqual(Object.keys(of(order)), ['name', 'corners', 'side', 'aroundM', 'on', 'file']);
    assert.ok(!Object.hasOwn(of(order), 'parcel'));
  }
  const turned = { asGiven: file.asGiven, wgs84: file.wgs84 };
  assert.deepEqual(Object.keys(of({ ...ORDER, file: turned }).file), ['wgs84', 'asGiven']);
}
// An order without one: as before, with no `file` key at all - and `on: []` refused, the eighth.
const byHand = { ...ORDER, on: ['national'] };
assert.deepEqual(of(byHand), byHand);
assert.ok(!Object.hasOwn(of(byHand), 'file'));
assert.deepEqual(of(ORDER), EIGHTH);
// With a file, `on` is still one of the five or `[]`, and nothing else.
const FILE = { wgs84: false, asGiven: true };
for (const on of [['map'], ['photo', 'national'], [[]], null, 'national', {}, [null]]) {
  assert.deepEqual(of({ ...ORDER, on, file: FILE }), EIGHTH, JSON.stringify(on));
}

// The tenth sentence, to the letter, for every shape of a file that is none - with `on: []` and
// with a map.
const NO_FILE = [{ wgs84: false }, { asGiven: true }, { ...FILE, name: 'parcel.geojson' }];
NO_FILE.push({ ...FILE, crs: 'EPSG:2056' }, { ...FILE, wgs84: 'false' }, { ...FILE, asGiven: 1 });
NO_FILE.push({ ...FILE, wgs84: null }, { wgs84: false, given: true }, {}, null, [], [FILE]);
NO_FILE.push('parcel.geojson', 'true', true, false, 0, 1);
for (const file of NO_FILE) {
  for (const on of [[], ['national']]) {
    assert.deepEqual(of({ ...ORDER, on, file }), TENTH, JSON.stringify(file));
  }
}
// In its place: after what the corners were marked on, and after the parcel's - each said first.
assert.deepEqual(of({ ...ORDER, on: ['map'], file: null }), EIGHTH);
assert.deepEqual(of({ ...ORDER, parcel: null, file: null }), NINTH);
assert.deepEqual(of({ ...ORDER, on: ['cadastral'], parcel: null, file: FILE }), NINTH);
assert.deepEqual(of({ ...ORDER, parcel: PARCEL, file: null }), TENTH);

// A parcel and a file, each one: the eleventh, whatever the corners were marked on.
for (const on of [[], ['cadastral'], ['photo']]) {
  for (const file of FILES) {
    assert.deepEqual(of({ ...ORDER, on, parcel: PARCEL, file }), ELEVENTH, JSON.stringify(on));
  }
}
// And an eighth key of the order is still no field of one.
assert.deepEqual(
  of({ ...ORDER, file: FILE, crs: 'EPSG:2056' }),
  refused('It holds "crs", which no order for a plot has.'),
);

// request.js imports nothing: the browser's store loads it (tools/sketch/store/rules.js).
const text = fs.readFileSync(path.join(import.meta.dirname, 'request.js'), 'utf8');
assert.ok(!/^\s*import\b|\bimport\s*\(|\brequire\s*\(/m.test(text), 'request.js imports');

process.stdout.write(
  'tools/sketch/new-plot: an order says its corners came from a file, as given or changed, converted from WGS84 or not, and may then be marked on nothing; a file that is none is refused in its own sentence, and a parcel and a file together in another\n',
);
