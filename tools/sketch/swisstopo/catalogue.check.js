// The check of what the catalogue says of swissALTI3D (ST-031): catalogue.js by hand, with
// nothing running and nothing asked. First on two answers of the real catalogue, version 1 -
// its collection, and the items of the tile north-east of the origin of the Swiss grid in Bern -
// which lie in __fixtures__/catalogue/ as they came, each held here to its length and its
// SHA-256; then on made-up answers for everything that has to be refused. They are the cases of
// the parked product's catalogue.test.ts and catalogue.refusals.test.ts,
// packages/adapters/src/geodata/terrain/, case for case where they hold of this reader, with
// `gsd` where version 0.9 says `eo:gsd` - but the two that ask through a client, which are
// ground-refused.check.js's - and with what the pad's reader has of its own: a file is held to
// the address that hosts.js builds, and a year to its four figures. A host is taken from HOSTS:
// none is typed here (named.check.js). Run by check.js, as every check is.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { MAX_YEARS, namesOf, readNewest, readYears } from './catalogue.js';
import { HOSTS, collectionAddress, fileAddress, itemsAddress } from './hosts.js';

// A case, under its title: where one fails, the title says which.
let cases = 0;
function it(title, run) {
  cases += 1;
  try {
    run();
  } catch (error) {
    throw new Error(`${title}: ${error.message}`, { cause: error });
  }
}
/** That a call refuses in these words, to the letter. */
const refuses = (call, message) => assert.throws(call, { name: 'Error', message });

// The two answers, as the card of T-031.4 has them: each by its length and its SHA-256.
const HELD = {
  'collection.json': [1978, 'f2e87449d1b8a46abb44df2e54cc24f66fede749f1d4ba45a3e6f597cc5fff5b'],
  'items-2600-1200.json': [
    5854,
    '7a41a9764b5bb4cb2f055eee34b1ef84dd455ed4f48f538f631329170d8ede17',
  ],
};
const FOLDER = path.join(import.meta.dirname, '__fixtures__', 'catalogue');
const fixture = (name) => fs.readFileSync(path.join(FOLDER, name));
const recorded = (name) => JSON.parse(fixture(name));
it('holds the two answers of the real catalogue to their lengths and their SHA-256', () => {
  for (const [name, [length, sha256]] of Object.entries(HELD)) {
    const sum = createHash('sha256').update(fixture(name)).digest('hex');
    assert.deepEqual([name, fixture(name).length, sum], [name, length, sha256]);
    // One line of JSON, with no line end.
    assert.ok(!fixture(name).includes(10) && !fixture(name).includes(13), name);
  }
  // And nothing lies beside them but their note: a file that is added wants holding too.
  assert.deepEqual(fs.readdirSync(FOLDER).sort(), ['CLAUDE.md', ...Object.keys(HELD)]);
});

// The four tiles that meet at the origin, from south to north and west to east; and the years.
const TILES = [2599, 2600, 2599, 2600].map((eastKm, at) => ({
  eastKm,
  northKm: at < 2 ? 1199 : 1200,
}));
const NORTH_EAST = TILES.slice(3);
const YEARS = { first: 2019, last: 2026 };
const [COLLECTION, AT] = ['ch.swisstopo.swissalti3d', `https://${HOSTS.terrain}`];
const GEOTIFF = 'image/tiff; application=geotiff; profile=cloud-optimized';
const nameOf = (year) => `swissalti3d_${year}_2600-1200`;
/** Where the pad asks for the file of the north-east tile of a year: its path, and its address. */
const pathOf = (year) => fileAddress(AT, nameOf(year)).slice(AT.length);
/** A made-up item of the north-east tile, of a year: a file for each of `changes`, the one that
 * is read but for what the change says of it. */
const item = (year, ...changes) => {
  const file = { type: GEOTIFF, href: `${AT}${pathOf(year)}`, 'proj:epsg': 2056, gsd: 0.5 };
  const files = changes.map((change, index) => [`file-${index}`, { ...file, ...change }]);
  return { id: nameOf(year), collection: COLLECTION, assets: Object.fromEntries(files) };
};
/** A made-up answer of the catalogue with these items, and a made-up collection. */
const answer = (...features) => ({ type: 'FeatureCollection', features, links: [] });
const collection = (interval, id = COLLECTION) => ({ id, extent: { temporal: { interval } } });
const day = (year) => `${String(year).padStart(4, '0')}-01-01T00:00:00Z`;
const spanning = (from, to) => collection([[day(from), day(to)]]);
const newest = (...features) => readNewest(answer(...features), NORTH_EAST, YEARS);

// readYears.
it('reads the years the recorded collection has items of', () => {
  // It states "2019-01-01T00:00:00Z" to "2026-01-01T00:00:00Z" - and was asked for where the
  // pad asks for it: its own link to itself is the address that hosts.js builds.
  const real = recorded('collection.json');
  assert.deepEqual(readYears(real), YEARS);
  assert.equal(real.links.find((link) => link.rel === 'self').href, collectionAddress(AT));
});
it('reads a span of one year', () => {
  assert.deepEqual(readYears(spanning(2025, 2025)), { first: 2025, last: 2025 });
});
const [D19, D20, D21, D25, D26] = [2019, 2020, 2021, 2025, 2026].map(day);
const [DAY19, DAY26, TWO] = [D19.slice(0, 10), D26.slice(0, 10), [[D19, D20]].concat([[D25, D26]])];
const SPANS = [
  ['is open at its end', [[D19, null]], `states 1, the first from "${D19}" to null`],
  ['is open at its beginning', [[null, D26]], `states 1, the first from null to "${D26}"`],
  ['runs backwards', [[D26, D19]], `states 1, the first from "${D26}" to "${D19}"`],
  ['is given in years alone', [['2019', '2026']], 'states 1, the first from "2019" to "2026"'],
  ['is one of two', TWO, `states 2, the first from "${D19}" to "${D20}"`],
  ['has a third day', [[D19, D20, D21]], `states 1, the first from "${D19}" to "${D20}"`],
  // And four that the parked product does not try: a day with no time after it, one with a sign
  // before it, a list where a day stands, and what is no text at all.
  ['is given in days alone', [[DAY19, DAY26]], `states 1, the first from "${DAY19}" to "${DAY26}"`],
  ['begins with a blank', [[` ${D19}`, D26]], `states 1, the first from " ${D19}" to "${D26}"`],
  ['holds a list for a day', [[[D19], D26]], `states 1, the first from a list to "${D26}"`],
  ['is given in numbers', [[2019, true]], 'states 1, the first from 2019 to true'],
];
for (const [what, interval, found] of SPANS) {
  it(`refuses a span of time that ${what}`, () => {
    const one = 'it has to state one span of time, from a day to a later day, and ';
    refuses(() => readYears(collection(interval)), one + found);
  });
}
it('refuses another collection, and an answer that is none', () => {
  const other = collection([[D19, D26]], 'ch.swisstopo.swisssurface3d');
  refuses(() => readYears(other), 'it is the collection "ch.swisstopo.swisssurface3d"');
  refuses(() => readYears([]), 'the collection must be an object, and is a list');
  refuses(() => readYears(null), 'the collection must be an object, and is null');
  refuses(() => readYears({ id: COLLECTION }), '"extent" must be an object, and is missing');
  const none = 'the span of time of the collection must be a list, and is missing';
  refuses(() => readYears(collection([])), none);
});

// namesOf.
it('asks for every name a tile could have, tile by tile and the years upward', () => {
  const names = namesOf(TILES, YEARS);
  assert.equal(names.length, 32);
  const ends = [names[0], names[7], names[8], names[31]].join(' ').replaceAll('swissalti3d_', '');
  assert.equal(ends, '2019_2599-1199 2026_2599-1199 2019_2600-1199 2026_2600-1200');
  assert.ok(names.every((name) => name.startsWith('swissalti3d_')) && new Set(names).size === 32);
  // The recorded items were asked for by four names, and the answer says where: at the address
  // that hosts.js builds of them.
  const four = [2019, 2024, 2025, 2026].map(nameOf);
  const [at, query] = itemsAddress(AT, four).split('?');
  const self = recorded('items-2600-1200.json').links.find((link) => link.rel === 'self');
  assert.deepEqual([at, query], [self.href, `collections=${COLLECTION}&ids=${four.join(',')}`]);
});
it('names an item by its year and by the kilometre of its south-west corner', () => {
  const two = ['swissalti3d_2024_2600-1200', 'swissalti3d_2025_2600-1200'];
  assert.deepEqual(namesOf(NORTH_EAST, { first: 2024, last: 2025 }), two);
});

// readNewest.
it('takes, of the recorded items, the newest of the tile - at the address that the pad builds', () => {
  // The tile has an item of 2019 and one of 2025, each with four files: 0.5 m and 2 m, as a
  // GeoTIFF and as a zipped list. The link of the one that is read is the pad's own address.
  const real = recorded('items-2600-1200.json');
  const [tile] = NORTH_EAST;
  assert.deepEqual(readNewest(real, NORTH_EAST, YEARS), [{ tile, name: nameOf(2025), year: 2025 }]);
  const files = Object.values(real.features.find((one) => one.id === nameOf(2025)).assets);
  const read = files.filter((file) => file.type === GEOTIFF && file.gsd === 0.5);
  assert.deepEqual(
    read.map((file) => file.href),
    [fileAddress(AT, nameOf(2025))],
  );
  assert.deepEqual(
    real.features.map((one) => one.id),
    [nameOf(2019), nameOf(2025)],
  );
});
it('takes the newest item wherever it stands, and a link with or without a host', () => {
  const older = item(2019, { href: pathOf(2019) });
  const other = (host) => `https://${host}`;
  const newer = item(2025, { href: `${other('example.invalid')}${pathOf(2025)}` });
  for (const features of [
    [older, newer],
    [newer, older],
  ]) {
    assert.deepEqual(
      newest(...features).map((one) => `${one.name} ${one.year}`),
      [`${nameOf(2025)} 2025`],
    );
  }
  assert.deepEqual(newest(older), [{ tile: NORTH_EAST[0], name: nameOf(2019), year: 2019 }]);
});
it('passes over the files that are not the one to read', () => {
  const others = [{ gsd: 2 }, { type: 'application/x.ascii-xyz+zip' }, { 'proj:epsg': 21781 }];
  assert.equal(newest(item(2025, ...others, {}))[0].name, nameOf(2025));
});
const HAS = `${nameOf(2025)} has to have one file of 0.5 m cells in EPSG:2056 that is a cloud-optimised GeoTIFF, and has `;
const LIES = `the file of ${nameOf(2025)} does not lie where the pad asks for it, but at `;
const LISTS = (name, of = COLLECTION) =>
  `it lists ${name} of the collection "${of}", which was not asked for`;
const NEXT = [{ rel: 'self' }, { rel: 'next', href: '/api/stac/v1/search?cursor=x' }];
const REFUSED = {
  'has no item for a tile': [
    answer(),
    'swissALTI3D has no tile for the square kilometre at E 2600 km, N 1200 km',
  ],
  'was cut short': [
    { features: [item(2025, {})], links: NEXT },
    'it is only the first part of the items, with a link to the next',
  ],
  'lists a tile that was not asked for': [
    answer(item(2025, {}), { ...item(2025, {}), id: 'swissalti3d_2025_2601-1200' }),
    LISTS('"swissalti3d_2025_2601-1200"'),
  ],
  'lists a year that was not asked for': [
    answer(item(2027, {})),
    LISTS('"swissalti3d_2027_2600-1200"'),
  ],
  'lists an item of another collection': [
    answer({ ...item(2025, {}), collection: 'ch.swisstopo.swisssurface3d' }),
    LISTS(`"${nameOf(2025)}"`, 'ch.swisstopo.swisssurface3d'),
  ],
  'lists an item without a name': [
    answer({ collection: COLLECTION, assets: {} }),
    LISTS('missing'),
  ],
  'has no file to read in the newest item': [
    answer(item(2019, {}), item(2025, { gsd: 2 })),
    `${HAS}0`,
  ],
  'has two files to read': [answer(item(2025, {}, {})), `${HAS}2`],
  'names the side of a cell as version 0.9 does': [
    answer(item(2025, { gsd: undefined, 'eo:gsd': 0.5 })),
    `${HAS}0`,
  ],
  'has a file without a link': [answer(item(2025, { href: undefined })), `${LIES}missing`],
  'links to no file of a service': [
    answer(item(2025, { href: 'mailto:nobody@example.invalid' })),
    `${LIES}"mailto:nobody@example.invalid"`,
  ],
  'links to the file of another state': [
    answer(item(2025, { href: pathOf(2019) })),
    `${LIES}"${pathOf(2019).slice(0, 60)}"`,
  ],
  'links to the file with more after it': [
    answer(item(2025, { href: `${pathOf(2025)}?v=2` })),
    `${LIES}"${pathOf(2025).slice(0, 60)}"`,
  ],
  'links to a folder that only ends as the pad’s does': [
    answer(item(2025, { href: `/x${pathOf(2025).slice(1)}` })),
    `${LIES}"/x${pathOf(2025).slice(1, 59)}"`,
  ],
  'names an item by a list': [answer({ ...item(2025, {}), id: [nameOf(2025)] }), LISTS('a list')],
  'has no list of items': [{ links: [] }, '"features" must be a list, and is missing'],
  'has no links': [{ features: [] }, '"links" must be a list, and is missing'],
  'has links that are no list': [
    { features: [], links: {} },
    '"links" must be a list, and is an object',
  ],
  'is no object': ['Maintenance', 'the answer must be an object, and is "Maintenance"'],
};
for (const [what, [search, reason]] of Object.entries(REFUSED)) {
  it(`refuses an answer that ${what}`, () =>
    refuses(() => readNewest(search, NORTH_EAST, YEARS), reason));
}
it('writes out what could steer a terminal, and no more than sixty characters of it', () => {
  // ESC [ 2 J and a hundred letters: sixty signs of it, the first by its number. And the sign
  // 155, which begins the same order alone, with a letter beyond the plain ones and the sign 127.
  const sign = (number) => String.fromCharCode(number);
  const steering = { ...item(2025, {}), id: `${sign(27)}[2J${'x'.repeat(100)}` };
  refuses(() => newest(steering), LISTS(`"\\u001b[2J${'x'.repeat(56)}"`));
  const alone = { ...item(2025, {}), id: `${sign(0x9b)}2J"${sign(0xfc)}${sign(0x7f)}` };
  refuses(() => newest(alone), LISTS('"\\u009b2J\\"\\u00fc\\u007f"'));
});
it('refuses an item that is listed twice, whatever the two say and wherever they stand', () => {
  const twice = (year) => `it lists "${nameOf(year)}" twice`;
  refuses(() => newest(item(2025, {}), item(2025, {})), twice(2025));
  refuses(() => newest(item(2025, {}), item(2019, {}), item(2025, { gsd: 2 })), twice(2025));
  // An item that would not be read, the older one, is no more to be listed twice.
  refuses(() => newest(item(2019, {}), item(2025, {}), item(2019, {})), twice(2019));
});

// readYears, of a span of time longer than MAX_YEARS - and of one that no name can hold.
it('reads MAX_YEARS years, and refuses one more', () => {
  assert.equal(MAX_YEARS, 50);
  assert.deepEqual(readYears(spanning(1977, 2026)), { first: 1977, last: 2026 });
  const more = 'its span of time holds the 51 years from 1976 to 2026, and 50 are read at most';
  refuses(() => readYears(spanning(1976, 2026)), more);
  const all = 'its span of time holds the 9999 years from 1 to 9999, and 50 are read at most';
  refuses(() => readYears(spanning(1, 9999)), all);
});
it('keeps the longest request for four tiles to 200 names', () => {
  // 61 characters before the names, and 200 names of 26 with a comma between two.
  const longest = itemsAddress(AT, namesOf(TILES, readYears(spanning(1977, 2026))));
  assert.equal(longest.split(',').length, 200);
  assert.equal(longest.length - AT.length, 61 + 200 * 26 + 199);
  // Where the years 1000 to 9999, unbounded, would be 36 000 names and nearly a million characters.
  const unbounded = itemsAddress(AT, namesOf(TILES, { first: 1000, last: 9999 }));
  assert.equal(unbounded.split(',').length, 36_000);
  assert.equal(unbounded.length - AT.length, 972_060);
});
it('refuses a span that begins before the year 1000: a tile is named by four figures', () => {
  assert.deepEqual(readYears(spanning(1000, 1049)), { first: 1000, last: 1049 });
  const before =
    'its span of time begins in the year 999, and a tile is named by a year of four figures';
  refuses(() => readYears(spanning(999, 1048)), before);
  assert.equal(itemsAddress(AT, namesOf(NORTH_EAST, { first: 999, last: 1000 })), null);
});

assert.equal(cases, 43);
process.stdout.write(
  `tools/sketch/swisstopo: the two answers of the real catalogue are the bytes of their card, and are read - the years 2019 to 2026, and of the tile north-east of the origin the state of 2025, at the address that the pad builds; and an answer that is another is refused in its words: ${cases} cases\n`,
);
