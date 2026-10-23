// The check of what the ground of a box refuses (ST-031): ground.js, each refusal in its words,
// with the address that was asked, and with nothing half given - a refusal is an error, never a
// ground with a gap. Through the stand-in for swisstopo, on its made-up world: a cell without a
// height, a tile that there is not, a file that is no tile, the stand-in stopped - and the boxes
// that are refused before anything is asked, of which the stand-in's own account says that it
// was asked nothing. And on servers of this check's own, which give the catalogue of made-up.js
// and, in the place of one tile's file, a tile that this check makes up: the refusals of the
// parked product's fetchTerrain.refusals.test.ts and catalogue.refusals.test.ts,
// packages/adapters/src/geodata/terrain/, that are of a tile's own form or of what the catalogue
// says. A file that comes in parts and is not as its directory says is ground-parts.check.js's,
// which is full: two cases of it stand here, a block of two megabytes and one that is cut off.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { MAX_BYTES, getJson } from './door.js';
import { cellsCovering, tilesOf } from './grid.js';
import { groundOf } from './ground.js';
import { collectionAddress, fileAddress, itemsAddress, tileName } from './hosts.js';
import { changed, fieldOf, madeUpTile } from './made-up-tile.js';
import { collection, itemsOf } from './made-up.js';
import { readTileHead } from './tiff.js';

// A case, under its title: where one fails, the title says which.
let cases = 0;
async function it(title, run) {
  cases += 1;
  try {
    await run();
  } catch (error) {
    throw new Error(`${title}: ${error.message}`, { cause: error });
  }
}
/** What a request was refused with, after the kind of its error - or that it was not. */
const worded = (error) => `${error.name}: ${error.message}`;
const refusal = (request) => request.then(() => 'no error', worded);
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const namesOfTile = (eastKm, northKm) => YEARS.map((year) => tileName(year, eastKm, northKm));
const NAME = tileName(2025, 2600, 1200);
const JSON_TYPE = { 'content-type': 'application/json' };
const TIFF = { 'content-type': 'image/tiff' };
const servers = [];
/**
 * The downloads, made up, on a server of this check's own: the catalogue of made-up.js, and for
 * the tile north-east of the origin, in its state of 2025, `file` - in parts, as a service gives
 * one. `other.collection` is answered in the place of the collection, and `other.items` says
 * what is made of the items. It keeps what it was asked, and says its three addresses.
 */
async function downloads(file, other = {}) {
  const asked = [];
  const server = createServer((request, response) => {
    const [address, bytes] = [`${origin}${request.url}`, Buffer.from(file)];
    asked.push(address);
    const json = (value) => response.writeHead(200, JSON_TYPE).end(JSON.stringify(value));
    if (address === at.collection) return json(other.collection ?? collection(origin));
    const items = itemsOf(origin, namesOfTile(2600, 1200));
    if (address === at.items) return json(other.items?.(items) ?? items);
    if (address !== at.tile) return response.writeHead(404).end();
    const [first, last] = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range).slice(1).map(Number);
    const end = Math.min(last, bytes.length - 1);
    const says = { ...TIFF, 'content-range': `bytes ${first}-${end}/${bytes.length}` };
    return response.writeHead(206, says).end(bytes.subarray(first, end + 1));
  });
  servers.push(server);
  await once(server.listen(0, '127.0.0.1'), 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const at = { collection: collectionAddress(origin), tile: fileAddress(origin, NAME) };
  at.items = itemsAddress(origin, namesOfTile(2600, 1200));
  return { origin, asked, ...at };
}
const stopped = (server) =>
  [once(server, 'close'), server.close(), server.closeAllConnections()][0];

// Three cells each way from the south-west corner of the tile north-east of the origin; and a
// made-up tile there, of 128 cells each way in one block. Its ground is a slope: 540 m at the
// corner, 0.25 m a cell eastward and 2 m a cell northward.
const BOX = { minE: 2_600_000.25, maxE: 2_600_001.25, minN: 1_200_000.25, maxN: 1_200_001.25 };
const SLOPE = [540, 540.25, 540.5, 542, 542.25, 542.5, 544, 544.25, 544.5];
const slope = (e, n) => 540 + (e - 2_600_000.25) / 2 + (n - 1_200_000.25) * 4;
const SMALL = { eastKm: 2600, northKm: 1200, cells: 128, northN: 1_200_064, heightAt: slope };
const tileOf = (changes) => madeUpTile({ ...SMALL, ...changes });
/** The slope, but for one cell: no height at this easting, in the third row of the box. */
const gapAt = (east) => (e, n) => (e === east && n === 1_200_001.25 ? -9999 : slope(e, n));

// A tile of another form than the one to read, each refused with why and with its address.
// The first is the same square as the frame of old has it, on flat ground.
const OLD = { westE: 600_000, northN: 200_064, epsg: 21781, heightAt: () => 540 };
const NO_TILE = 'Error: Not a tile of swissALTI3D as swisstopo publishes it: ';
const NOT_THE_ONE = 'Error: The tile is not the one to read: ';
const system = (epsg) =>
  `it states the coordinate system EPSG:${epsg} where LV95, EPSG:2056, was asked for`;
const ASKED_OF_IT = 'E 2600000 to 2600001.5, N 1200000 to 1200001.5';
const ELSEWHERE = `it reaches from E 2601000 to 2601064, N 1200000 to 1200064, and not over all the ground that was asked of it, ${ASKED_OF_IT}`;
const ACROSS =
  'its cells lie across the cells of 0.5 m counted from zero: its north-west corner is at E 2599999.75, N 1200064';
const COARSE = 'its cells are 2 m by 2 m where 0.5 m was asked for';
const GAP = 'Error: swissALTI3D states no height at E 2600000.75, N 1200001.25';
const XML = '<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code></Error>';
const BEGINS = 'it does not begin as one does, with 49 49 2a 00, but with 3c 3f 78 6d';
const PAGE = '<!DOCTYPE html><html><body>Maintenance</body></html>';
const HTML = 'Error: The service answered with an HTML page where data was expected';
const TILES = [
  ['in the frame of old', tileOf(OLD), NOT_THE_ONE + system(21781)],
  ['in another coordinate system altogether', tileOf({ epsg: 4326 }), NOT_THE_ONE + system(4326)],
  ['of another cell size', tileOf({ cellSizeM: 2 }), NOT_THE_ONE + COARSE],
  ['that lies elsewhere', tileOf({ westE: 2_601_000 }), NOT_THE_ONE + ELSEWHERE],
  ['that lies across the cells of the grid', tileOf({ westE: 2_599_999.75 }), NOT_THE_ONE + ACROSS],
  ['that has no height for a cell of the box', tileOf({ heightAt: gapAt(2_600_000.75) }), GAP],
  ['that is an error document, sent with status 200', XML, NO_TILE + BEGINS],
  ['that is a page, sent with status 200', PAGE, HTML],
];
for (const [what, file, reason] of TILES) {
  await it(`refuses a tile ${what}`, async () => {
    const service = await downloads(file);
    assert.equal(await refusal(groundOf(service.origin, BOX)), `${reason}: ${service.tile}`);
    // The collection, the items, the tile's head - and of the tile with a gap, its one block.
    const asked = [service.collection, service.items, service.tile];
    assert.deepEqual(service.asked, what.includes('no height') ? [...asked, service.tile] : asked);
  });
}
await it('reads the tile where the gap lies beyond the box: the cell next to its last one', async () => {
  for (const file of [tileOf(), tileOf({ heightAt: gapAt(2_600_001.75) })]) {
    const { heightsM, tiles } = await groundOf((await downloads(file)).origin, BOX);
    assert.deepEqual([heightsM.flat(), tiles], [SLOPE, [{ name: NAME, year: 2025 }]]);
  }
  // And west of a box, in its third row: one that begins a cell east of the gap.
  const beside = await downloads(tileOf({ heightAt: gapAt(2_600_000.75) }));
  const east = { ...BOX, minE: 2_600_001.25, maxE: 2_600_002.25 };
  assert.deepEqual((await groundOf(beside.origin, east)).heightsM[2], [544.5, 544.75, 545]);
});
await it('asks for no block of more than a megabyte, whatever a directory names', async () => {
  // One block, of which the directory names two megabytes - and the file has them. The reader
  // names no limit of its own, so the door holds the part to a megabyte: refused, unread.
  const [tile, twice] = [tileOf(), 2 * MAX_BYTES];
  const long = new Uint8Array(readTileHead(tile).blocks[0].offset + twice);
  long.set(tile);
  const view = new DataView(long.buffer);
  view.setUint32(fieldOf(view, 325) + 8, twice, true);
  const service = await downloads(long);
  const large =
    'Error: The service answered with more than 1048576 bytes, the most this request takes';
  assert.equal(await refusal(groundOf(service.origin, BOX)), `${large}: ${service.tile}`);
  assert.equal(service.asked.length, 4);
});
await it('reads a block within the bytes that its directory names, and no further', async () => {
  // Four blocks, and a box across the two southern ones, which lie side by side in the file:
  // one part. The directory names ten bytes fewer for the first than it has: the block is cut
  // off there, and refused - not read on into the bytes that follow it.
  const tile = tileOf({ cells: 256, northN: 1_200_128 });
  const across = { ...BOX, minE: 2_600_063.25, maxE: 2_600_064.75 };
  const whole = await groundOf((await downloads(tile)).origin, across);
  assert.deepEqual(whole.heightsM[0], [571.5, 571.75, 572, 572.25]);
  const sizes = (view) => view.getUint32(fieldOf(view, 325) + 8, true);
  const { byteCount } = readTileHead(tile).blocks[2];
  const short = changed(tile, (view) => view.setUint32(sizes(view) + 8, byteCount - 10, true));
  const service = await downloads(short);
  const said = await refusal(groundOf(service.origin, across));
  const stops =
    /block from column 0, row 128 cannot be read: .* it stops after \d+ of 65536 bytes, /;
  assert.ok(
    stops.test(said) && said.endsWith(`without the code for its end: ${service.tile}`),
    said,
  );
});

// What the catalogue says of its tiles, refused with the address that was asked - and nothing is
// asked after it: no file, and no link that an answer lists.
const REFUSED = "Error: The download service's answer was refused: ";
const day = (year) => `${String(year).padStart(4, '0')}-01-01T00:00:00Z`;
const span = (from, to) => ({ temporal: { interval: [[from, to]] } });
const spanning = (from, to) => ({ id: 'ch.swisstopo.swissalti3d', extent: span(from, to) });
const none = (items) => ({ ...items, features: [] });
const twice = (items) => ({ ...items, features: [...items.features, items.features[1]] });
const moved = (items) => {
  for (const { assets } of items.features) Object.values(assets)[0].href += '?v=2';
};
const NO_SQUARE = 'swissALTI3D has no tile for the square kilometre at E 2600 km, N 1200 km';
const LIES = `the file of ${NAME} does not lie where the pad asks for it, but at "http://127.0.0.1:`;
const [OPEN, ALL] = [{ collection: spanning(day(2019), null) }, spanning(day(1), day(9999))];
const ONE_SPAN = `it has to state one span of time, from a day to a later day, and states 1, the first from "${day(2019)}" to null`;
const MOST = 'its span of time holds the 9999 years from 1 to 9999, and 50 are read at most';
const CATALOGUE = [
  ['has no tile for the box', { items: none }, 'items', NO_SQUARE],
  ['lists an item twice', { items: twice }, 'items', `it lists "${NAME}" twice`],
  ['lists a file elsewhere than the pad asks for it', { items: moved }, 'items', LIES],
  ['does not say which years it has', OPEN, 'collection', ONE_SPAN],
  ['states a span from the year 1 to 9999', { collection: ALL }, 'collection', MOST],
];
for (const [what, other, which, reason] of CATALOGUE) {
  await it(`refuses a catalogue that ${what}, and asks no further`, async () => {
    const service = await downloads(tileOf(), other);
    const said = await refusal(groundOf(service.origin, BOX));
    assert.ok(said.startsWith(REFUSED + reason) && said.endsWith(`: ${service[which]}`), said);
    const asked = which === 'items' ? [service.collection, service.items] : [service.collection];
    assert.deepEqual(service.asked, asked);
  });
}

// The stand-in, on its made-up world: what it is asked for, and what it is not asked at all.
const standIn = spawn(process.execPath, [path.join(import.meta.dirname, 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const soon = { signal: globalThis.AbortSignal.timeout(20_000) };
const [, AT] = /^The stand-in for swisstopo: (\S+) - /.exec(
  await once(standIn.stdout, 'data', soon),
);
/** A box by the metres east and north of the origin that its edges lie at. */
const [E0, N0] = [2_600_000, 1_200_000];
const boxAt = (w, e, s, n) => ({ minE: E0 + w, maxE: E0 + e, minN: N0 + s, maxN: N0 + n });
const fileAt = (year, eastKm, northKm) => fileAddress(AT, tileName(year, eastKm, northKm));
await it('refuses a cell without a height, a tile that there is not, and a file that is no tile', async () => {
  // One cell of the made-up world has no height, 100.25 m south-west of the origin.
  const gap = await refusal(groundOf(AT, boxAt(-101, -100, -101, -100)));
  const height = 'Error: swissALTI3D states no height at E 2599899.75, N 1199899.75';
  assert.equal(gap, `${height}: ${fileAt(2025, 2599, 1199)}`);
  // East of the four tiles there is none: what a plot outside Switzerland gets.
  const outside = await refusal(groundOf(AT, boxAt(1010, 1020, 10, 20)));
  const square = 'swissALTI3D has no tile for the square kilometre at E 2601 km, N 1200 km';
  assert.equal(outside, `${REFUSED}${square}: ${itemsAddress(AT, namesOfTile(2601, 1200))}`);
  // And north of them, a tile whose file is a text.
  const text = await refusal(groundOf(AT, boxAt(10, 20, 1010, 1020)));
  const begins = 'it does not begin as one does, with 49 49 2a 00, but with 41 20 6d 61';
  assert.equal(text, `${NO_TILE}${begins}: ${fileAt(2025, 2600, 1201)}`);
  const asked = (await getJson(AT, '/asked')).map((one) => one.target.split('/')[1]).join(' ');
  assert.equal(
    asked.replaceAll('ch.swisstopo.swissalti3d', 'file'),
    'api api file file api api api api file',
  );
});
await it('refuses a box that makes no sense before anything is asked: the stand-in is asked nothing', async () => {
  await getJson(AT, '/asked?forget');
  const said = (box, origin = AT) => refusal(groundOf(origin, box));
  // No box, and no four numbers; no ground; cells that are no numbers that count; twelve tiles, ten.
  const NOT_FOUR = [undefined, null, {}, { ...BOX, minE: '2600000' }, { ...BOX, maxN: Number.NaN }];
  for (const box of [...NOT_FOUR, { ...BOX, maxE: Infinity }, { ...BOX, minN: undefined }]) {
    assert.equal(await said(box), 'RangeError: The box is no four numbers, so nothing was asked.');
  }
  const lies = (words, where) => `RangeError: The box ${words}: ${where}.`;
  const [E, N] = ['E 2600000.25 to 2600001.25', 'N 1200000.25 to 1200001.25'];
  assert.equal(
    await said({ ...BOX, maxE: BOX.minE }),
    lies('holds no ground', `E 2600000.25 to 2600000.25, ${N}`),
  );
  assert.equal(
    await said({ ...BOX, minN: 1_200_002 }),
    lies('holds no ground', `${E}, N 1200002 to 1200001.25`),
  );
  const nowhere = lies('lies where swissALTI3D names no tile', `E 2600000.25 to 1e+300, ${N}`);
  assert.equal(await said({ ...BOX, maxE: 1e300 }), nowhere);
  const most = (tiles) =>
    `RangeError: The box lies in ${tiles} tiles of a square kilometre, and 9 are read at most.`;
  const [twelve, ten] = [boxAt(-500, 2100, -100, 1100), boxAt(-7500, 1100, 1, 2)];
  assert.deepEqual([await said(twelve), await said(ten)], [most(12), most(10)]);
  const [nine, tiles] = [boxAt(-500, 1100, -100, 1100), (box) => tilesOf(cellsCovering(box))];
  assert.deepEqual(
    [twelve, ten, nine].map((box) => tiles(box).length),
    [12, 10, 9],
  );
  // A box whose kilometres no tile's name can hold - in the frame of old - is refused by grid.js,
  // in its own words: the very refusal that `tilesOf` raises of its cells.
  const old = { minE: 600_000.25, maxE: 600_001.25, minN: 200_000.25, maxN: 200_001.25 };
  const grids = await refusal(Promise.resolve(old).then((box) => tilesOf(cellsCovering(box))));
  const named = 'at the kilometres E 600 to 600, N 200 to 200: a name holds four figures each way.';
  assert.deepEqual(
    [await said(old), grids],
    Array(2).fill(`RangeError: No tile has a name where the cells lie, ${named}`),
  );
  // And an origin that the pad does not ask, put together here: nothing is asked of anybody. A
  // box in nine tiles is not refused for its tiles: it asks for the catalogue, which fails here.
  const [machines, elsewhere] = [globalThis.fetch, ['https:', '', 'example.org'].join('/')];
  globalThis.fetch = () => assert.fail('asked');
  const [notAsked, ofNine] = [await said(BOX, elsewhere), await said(nine)];
  globalThis.fetch = machines;
  assert.equal(ofNine, `Error: The service could not be reached: ${collectionAddress(AT)}`);
  assert.equal(
    notAsked,
    `Error: Not a host that the pad asks, so nothing was asked: "${elsewhere}"`,
  );
  assert.deepEqual(await getJson(AT, '/asked'), []);
});
await it('says that the service could not be reached, where the stand-in is stopped', async () => {
  await Promise.all([once(standIn, 'close'), standIn.kill()]);
  const said = await refusal(groundOf(AT, BOX));
  assert.equal(said, `Error: The service could not be reached: ${collectionAddress(AT)}`);
});

await Promise.all(servers.map(stopped));
assert.equal(cases, 19);
process.stdout.write(
  `tools/sketch/swisstopo: what the ground of a box refuses is said in its words, with the address that was asked - a tile of another form, a cell without a height, a catalogue that says another thing, a service that is not there - and a box that makes no sense is refused with nothing asked: ${cases} cases\n`,
);
