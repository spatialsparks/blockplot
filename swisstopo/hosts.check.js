// The check of whom the pad asks, and of every address that it asks (ST-031): hosts.js by hand,
// with nothing running and nothing asked. The three hosts, typed in - here, and in no third file
// of the pad (named.check.js). Which origin may be asked. The policy that the map's page puts
// into its head, to the letter; and whom that page asks by its own address, every kind of
// address and what is refused. The map as the service's own list has it: the levels, how many
// pictures each has, the layers and their credits. Every address, by hand - the picture that the
// origin of the Swiss grid lies in, a search, the terrain's four - and what is none. Where the
// pad gives the map's page is plot-routes.check.js's. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { URL } from 'node:url';
import { CADASTRE } from './cadastre.js';
import { CADASTRAL_FROM, FOUND_AT, HOSTS, LAYERS, LEVELS, MARK_FROM, layersOf } from './hosts.js';
import { PLACES_MOST, SEARCH_MAX, SHEET, TILE_PX, asksOf } from './hosts.js';
import { collectionAddress, fileAddress, itemsAddress, matrixOf, mayAsk } from './hosts.js';
import { policyOf, searchAddress, tileAddress, tileName } from './hosts.js';

// The three hosts, typed in - each by what it is for - and the three as origins.
const TYPED = 'map wmts.geo.admin.ch search api3.geo.admin.ch terrain data.geo.admin.ch'.split(' ');
assert.deepEqual(Object.entries(HOSTS).flat(), TYPED);
const [MAP_AT, SEARCH_AT] = ['https://wmts.geo.admin.ch', 'https://api3.geo.admin.ch'];
const TERRAIN_AT = 'https://data.geo.admin.ch';
const SWISSTOPO = { map: MAP_AT, search: SEARCH_AT, terrain: TERRAIN_AT };
// A stand-in: one origin of this machine in the place of all three.
const STAND_IN = 'http://127.0.0.1:5123';
const standIn = (at = STAND_IN) => ({ map: at, search: at, terrain: at });
// A host that the pad does not ask, put together here: no file of the pad names a fourth host.
const other = (host, scheme = 'https') => `${scheme}://${host}`;
const ELSEWHERE = other('tiles.example.org');
// And no origin: this machine, and for its port the word that a template writes of what is none.
const NO_PORT = other('127.0.0.1:null', 'http');

// Which origin may be asked: the three, each as https, with no port and nothing after it; and
// this machine by its address, with a port. Four that may, and what may not.
for (const origin of [MAP_AT, SEARCH_AT, TERRAIN_AT, STAND_IN]) assert.equal(mayAsk(origin), true);
const MAY_NOT = [other(TYPED[1], 'http'), `${MAP_AT}:443`, `${MAP_AT}/`, `${MAP_AT}.example.org`];
MAY_NOT.push(other('map.geo.admin.ch'), other('geo.admin.ch'), ELSEWHERE, MAP_AT.toUpperCase());
MAY_NOT.push('http://127.0.0.1', 'http://127.0.0.1:0', 'http://127.0.0.1:65536', `${STAND_IN}/`);
MAY_NOT.push('http://127.0.0.1:05123', `${STAND_IN}@example.org`, 'https://127.0.0.1:5123');
MAY_NOT.push(other('127.0.0.2:5123', 'http'), other('localhost:5123', 'http'));
MAY_NOT.push(other('[::1]:5123', 'http'), ` ${MAP_AT}`, `${MAP_AT}\n`, TYPED[1], '127.0.0.1:5123');
MAY_NOT.push('', undefined, null, 5123, [MAP_AT], NO_PORT);
for (const origin of MAY_NOT) assert.equal(mayAsk(origin), false, String(origin));

// The policy of the map's page, in its three forms, to the letter.
assert.equal(
  policyOf(SWISSTOPO),
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' https://wmts.geo.admin.ch; connect-src 'self' https://api3.geo.admin.ch https://data.geo.admin.ch; base-uri 'none'; form-action 'none'",
);
assert.equal(
  policyOf(standIn()),
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' http://127.0.0.1:5123; connect-src 'self' http://127.0.0.1:5123; base-uri 'none'; form-action 'none'",
);
const NOBODY =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'";
assert.equal(policyOf(null), NOBODY);
// Each origin once where two are one, and each of the two requests' own where they are two.
const mixed = { map: MAP_AT, search: STAND_IN, terrain: STAND_IN };
assert.ok(policyOf(mixed).includes(`; connect-src 'self' ${STAND_IN}; `));
const apart = policyOf({ ...mixed, terrain: TERRAIN_AT });
assert.ok(apart.includes(`; connect-src 'self' ${STAND_IN} ${TERRAIN_AT}; `));
// Neither names what may not be asked: a refusal, a fourth host, a word that would end the rule.
const NOT_ASKED = [{ refused: 'no asks' }, standIn(ELSEWHERE), standIn(`${STAND_IN}; img-src *`)];
for (const asks of [...NOT_ASKED, undefined]) assert.equal(policyOf(asks), NOBODY);
// A <meta> cannot say frame-ancestors (T-041.2): no form of the policy has it.
for (const asks of [SWISSTOPO, standIn(), null]) assert.ok(!policyOf(asks).includes('frame-'));

// Whom the map's page asks, by its own address (T-041.2): no word asks swisstopo, one port a
// stand-in, and anything else nobody, in one sentence - what it was told quoted, and cut.
for (const no of ['', '?', '?plot=home', '?Asks=5123', undefined])
  assert.deepEqual(asksOf(no), SWISSTOPO);
for (const port of ['5123', '1', '65535'])
  assert.deepEqual(asksOf(`?asks=${port}`), standIn(`http://127.0.0.1:${port}`), port);
const sorry = (told) => ({
  refused: `This page was told to ask "${told}": a port of this machine, for a stand-in, or nothing, for swisstopo.`,
});
const NO_PAGE_ASKS = ['', '0', '65536', '05123', 'swisstopo', 'localhost:5123'];
for (const told of NO_PAGE_ASKS) assert.deepEqual(asksOf(`?asks=${told}`), sorry(told), told);
assert.deepEqual(asksOf('?asks=5123&asks=5124'), sorry('5123, 5124'));
// Quoted as JSON - a quote in it escaped, a tag left as text - and cut to 40 characters.
assert.deepEqual(asksOf(`?asks=${'a'.repeat(41)}`), sorry('a'.repeat(40)));
assert.deepEqual(asksOf('?asks=%22%3Cb%3E'), sorry('\\"<b>'));

// The map, as the service's own list has it: a picture of 256 pixels, the sheet, 29 levels.
assert.equal(TILE_PX, 256);
assert.deepEqual(SHEET, { west: 2_420_000, east: 2_900_000, south: 1_030_000, north: 1_350_000 });
const TYPED_LEVELS = [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000];
TYPED_LEVELS.push(750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1);
assert.deepEqual([LEVELS, LEVELS.length], [TYPED_LEVELS, 29]);
// How many pictures a level has across and down, by hand: 480 000 m and 320 000 m over the 256
// pixels of the level, rounded up. And none for what is no level.
const MATRIX = { 0: [1, 1], 9: [2, 1], 12: [2, 2], 15: [4, 3], 17: [19, 13], 23: [938, 625] };
Object.assign(MATRIX, { 24: [1250, 834], 26: [3750, 2500], 28: [18750, 12500] });
for (const [level, [columns, rows]] of Object.entries(MATRIX)) {
  assert.deepEqual(matrixOf(Number(level)), { columns, rows }, `level ${level}`);
}
for (const no of [29, -1, 26.5, '26', NaN, undefined, null]) assert.equal(matrixOf(no), null);
// At every level the pictures cover the sheet, and the last of them is not wholly off it: held
// in whole numbers, twentieths of a metre, of which every level's pixel is a whole number.
const covers = (count, sheet, picture) => (count - 1) * picture < sheet && sheet <= count * picture;
LEVELS.forEach((metres, level) => {
  const [{ columns, rows }, pixel] = [matrixOf(level), Math.round(metres * 20)];
  assert.ok(Math.abs(metres * 20 - pixel) < 1e-9, `level ${level}`);
  assert.ok(covers(columns, 9_600_000, 256 * pixel), `level ${level}, across`);
  assert.ok(covers(rows, 6_400_000, 256 * pixel), `level ${level}, down`);
});

// The layers, typed in, each with the credits that it asks for - the first sign of a credit is
// the copyright sign. With no cadastre the national map and the photo alone; with one, made up
// here, its map between them, of its figures and with both credits. The pad's own are those of
// cadastre.js, whose check holds the real one's. And two levels that the page goes by, with a
// cadastre or none: half a metre, and half a metre - the national map is marked on at 26 and 27.
const CREDIT = '© swisstopo';
assert.equal(CREDIT.codePointAt(0), 0xa9);
const layer = (id, ending, to, credits) => ({ id, ending, from: 0, to, credits });
const NATIONAL_MAP = layer('ch.swisstopo.pixelkarte-farbe', 'jpeg', 27, [CREDIT]);
const PHOTO_MAP = layer('ch.swisstopo.swissimage', 'jpeg', 28, [CREDIT]);
const none = layersOf(null);
assert.deepEqual(
  Object.entries(none),
  Object.entries({ national: NATIONAL_MAP, photo: PHOTO_MAP }),
);
const MADE_UP = { layer: 'made.up.cadastre', ending: 'png', to: 28, credit: '© made up' };
const madeUp = layersOf({ ...MADE_UP, from: 25, topic: '/made/up' });
const cadastral = layer('made.up.cadastre', 'png', 28, [CREDIT, '© made up']);
const three = { national: NATIONAL_MAP, cadastral, photo: PHOTO_MAP };
assert.deepEqual(Object.entries(madeUp), Object.entries(three));
assert.deepEqual(Object.entries(LAYERS), Object.entries(layersOf(CADASTRE)));
for (const frozen of [HOSTS, SHEET, LEVELS, LAYERS, none, none.photo.credits, madeUp]) {
  assert.ok(Object.isFrozen(frozen));
}
assert.ok(Object.isFrozen(madeUp.cadastral) && Object.isFrozen(madeUp.cadastral.credits));
assert.equal(CADASTRAL_FROM, CADASTRE?.from ?? null);
assert.deepEqual([MARK_FROM, FOUND_AT, LEVELS[MARK_FROM]], [26, 26, 0.5]);
assert.ok(LAYERS.national.to >= MARK_FROM && LAYERS.photo.to >= MARK_FROM);

// The picture that the origin of the Swiss grid lies in - E 2 600 000, N 1 200 000: 180 000 m east
// and 150 000 m south of the sheet's top left corner. At level 26 a picture is 128 m: 1406.25
// pictures across and 1171.875 down. At level 28 it is 25.6 m: 7031.25 and 5859.375.
assert.equal(
  tileAddress(MAP_AT, 'photo', 26, 1406, 1171),
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/2056/26/1406/1171.jpeg',
);
const tile = (name, picture) => `/1.0.0/${name}/default/current/2056/${picture}`;
const PHOTO = tile('ch.swisstopo.swissimage', '28/7031/5859.jpeg');
assert.equal(tileAddress(MAP_AT, 'photo', 28, 7031, 5859), `${MAP_AT}${PHOTO}`);
// The first picture of all, and the last of the last level that the national map has - of a
// stand-in, whose origin stands in the place of the map's.
const NATIONAL = 'ch.swisstopo.pixelkarte-farbe';
assert.equal(tileAddress(MAP_AT, 'national', 0, 0, 0), `${MAP_AT}${tile(NATIONAL, '0/0/0.jpeg')}`);
const LAST = tileAddress(STAND_IN, 'national', 27, 7499, 4999);
assert.equal(LAST, `${STAND_IN}${tile(NATIONAL, '27/7499/4999.jpeg')}`);
assert.ok(tileAddress(MAP_AT, 'photo', 26, 3749, 2499) !== null);
// What is no picture, each with all else as it was: a fourth layer, a layer by its name at the
// service, a level there is not, a column and a row off the level, a figure that is no whole
// number - a text is none - and an origin that may not be asked. And level 28 of the national map.
const PICTURE = { at: MAP_AT, name: 'photo', level: 26, column: 1406, row: 1171 };
const NO_PICTURE = {
  name: ['relief', LAYERS.photo.id, 'toString', '__proto__', '', undefined, ['photo']],
  level: [29, -1, '26', 26.5, undefined],
  column: [3750, -1, 1406.5, '1406', NaN, undefined],
  row: [2500, -1, 1171.5, '1171', Infinity, null],
  at: [`${MAP_AT}/`, ELSEWHERE, TYPED[1], SEARCH_AT.toUpperCase(), '', undefined, NO_PORT],
};
for (const [which, nones] of Object.entries(NO_PICTURE)) {
  for (const none of nones) {
    const { at, name, level, column, row } = { ...PICTURE, [which]: none };
    assert.equal(tileAddress(at, name, level, column, row), null, `${which}: ${String(none)}`);
  }
}
assert.equal(tileAddress(MAP_AT, 'national', 28, 7031, 5859), null);

// A search: the words in one value of the query, whatever they hold, and the place asked for in
// LV95. Words that hold a second `sr`, an `&` and a `#` stay in that one value.
assert.deepEqual([SEARCH_MAX, PLACES_MOST], [80, 10]);
assert.equal(
  searchAddress(SEARCH_AT, 'Sidlerstrasse 5 Bern'),
  'https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=Sidlerstrasse%205%20Bern&type=locations&sr=2056&limit=10',
);
const [PATH, AFTER] = ['/rest/services/api/SearchServer', '&type=locations&sr=2056&limit=10'];
const SEARCH = `${SEARCH_AT}${PATH}?searchText=`;
const sly = 'Bern&sr=4326#top?limit=99 +=/';
const slyly = `${SEARCH}Bern%26sr%3D4326%23top%3Flimit%3D99%20%2B%3D%2F${AFTER}`;
assert.equal(searchAddress(SEARCH_AT, sly), slyly);
const read = new URL(searchAddress(STAND_IN, sly));
const query = [...read.searchParams].map(([name, value]) => `${name}=${value}`);
assert.deepEqual(query, [`searchText=${sly}`, 'type=locations', 'sr=2056', 'limit=10']);
assert.deepEqual([read.origin, read.pathname, read.hash], [STAND_IN, PATH, '']);
assert.equal(searchAddress(SEARCH_AT, 'Zürich'), `${SEARCH}Z%C3%BCrich${AFTER}`);
// Eighty characters and eighty-one; and what is no search: blank words, no text, half a sign of
// two halves - by its number - and an origin that may not be asked.
assert.equal(searchAddress(SEARCH_AT, 'n'.repeat(80)), `${SEARCH}${'n'.repeat(80)}${AFTER}`);
const HALF = String.fromCharCode(0xd83d);
for (const words of ['n'.repeat(81), '', '   ', '\t\n', `a${HALF}`, undefined, null, 5, ['Bern']]) {
  assert.equal(searchAddress(SEARCH_AT, words), null, String(words));
}
for (const at of [`${SEARCH_AT}/`, ELSEWHERE, undefined, NO_PORT]) {
  assert.equal(searchAddress(at, 'Bern'), null);
}

// The terrain's four: a tile's name, the catalogue's entry, tiles asked for by their names, and
// a tile's file - built here, and never taken from an answer.
const [NAME, OLDER] = ['swissalti3d_2025_2600-1200', 'swissalti3d_2019_2601-1200'];
assert.deepEqual([tileName(2025, 2600, 1200), tileName(2019, 2601, 1200)], [NAME, OLDER]);
assert.equal(tileName(1000, 9999, 1000), 'swissalti3d_1000_9999-1000');
for (const none of [999, 10000, 25, '2025', 2025.5, -2600, NaN, undefined, null]) {
  for (const at of [0, 1, 2]) {
    assert.equal(tileName(...[2025, 2600, 1200].with(at, none)), null, `${at}: ${String(none)}`);
  }
}
const COLLECTION = `${TERRAIN_AT}/api/stac/v1/collections/ch.swisstopo.swissalti3d`;
assert.equal(collectionAddress(TERRAIN_AT), COLLECTION);
const ITEMS = '/api/stac/v1/search?collections=ch.swisstopo.swissalti3d&ids=';
assert.equal(itemsAddress(TERRAIN_AT, [NAME]), `${TERRAIN_AT}${ITEMS}${NAME}`);
assert.equal(itemsAddress(STAND_IN, [NAME, OLDER]), `${STAND_IN}${ITEMS}${NAME},${OLDER}`);
assert.equal(
  fileAddress(TERRAIN_AT, NAME),
  'https://data.geo.admin.ch/ch.swisstopo.swissalti3d/swissalti3d_2025_2600-1200/swissalti3d_2025_2600-1200_0.5_2056_5728.tif',
);
// And what is none: a name that `tileName` does not give - with more after it, in capitals, two
// as one, a year of three figures - no name at all, a list with a hole, and an origin that may
// not be asked.
const NOT_GIVEN = [`${NAME}/../x`, `${NAME}&ids=x`, NAME.toUpperCase(), `${NAME},${OLDER}`];
NOT_GIVEN.push('swissalti3d_0999_2600-1200', `${NAME}\n`, ` ${NAME}`, '', undefined, 5, [NAME]);
for (const name of NOT_GIVEN) {
  assert.equal(fileAddress(TERRAIN_AT, name), null, String(name));
  assert.equal(itemsAddress(TERRAIN_AT, [NAME, name]), null, String(name));
}
const holed = [NAME, NAME, NAME];
delete holed[1];
for (const names of [[], holed, NAME, undefined, { 0: NAME, length: 1 }]) {
  assert.equal(itemsAddress(TERRAIN_AT, names), null);
}
for (const at of [`${TERRAIN_AT}/`, ELSEWHERE, undefined, NO_PORT]) {
  const built = [collectionAddress(at), itemsAddress(at, [NAME]), fileAddress(at, NAME)];
  assert.deepEqual(built, [null, null, null]);
}

process.stdout.write(
  "tools/sketch/swisstopo: the map's page asks swisstopo, a stand-in or nobody by its address, under a policy of its own, and every address is built of an origin that may be asked and of figures that are some\n",
);
