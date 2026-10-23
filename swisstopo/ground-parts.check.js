// The check of a tile read in parts (ST-031): ground.js and tile.js on servers of this check's
// own, each on 127.0.0.1 at a port that the system picked, which give the catalogue of
// made-up.js and, for one tile, a file that this check makes up - in parts, as a service gives
// one: status 206, and saying which bytes these are. The stand-in's tiles are flat but for their
// slope, so a reader that took a cell from the wrong block of one could still read the right
// height. Here are the tiles that would catch it: every cell with a height of its own, in blocks
// that are not square, and tiles that are not square, read whole - the cases of the parked
// product's fetchTerrain.blocks.test.ts, packages/adapters/src/geodata/terrain/. Then what a
// tile costs in parts, and what is refused of such a file, of its fetchTerrain.parts.test.ts,
// fetchTerrain.refusals.test.ts and tile.test.ts: where a parked case takes a whole tile for a
// part, this reader refuses it. Nothing here leaves this machine.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import { createServer } from 'node:http';
import process from 'node:process';
import { groundOf } from './ground.js';
import { collectionAddress, fileAddress, itemsAddress, tileName } from './hosts.js';
import { changed, fieldOf, madeUpTile, packLzw } from './made-up-tile.js';
import { collection, itemsOf } from './made-up.js';
import { readTileHead } from './tiff.js';
import { HEAD_BYTES, readTile } from './tile.js';

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
/** What a request was refused with - or that it was not. */
const worded = (error) => error.message;
const refusal = (request) => request.then(() => 'no error', worded);
const NAME = tileName(2025, 2600, 1200);
const [JSON_TYPE, TIFF] = [
  { 'content-type': 'application/json' },
  { 'content-type': 'image/tiff' },
];
const servers = [];
/**
 * The downloads, made up, on a server of this check's own: the catalogue of made-up.js, and for
 * the tile north-east of the origin, in its state of 2025, `file` - in parts, as a service gives
 * one; with `how.status` that status in its place, and with `how.whole` the file whatever part
 * is asked for. It keeps which parts of the file it was asked for, and how many bytes went back.
 */
async function downloads(file, how = {}) {
  const [parts, sent] = [[], []];
  const server = createServer((request, response) => {
    const [address, { range }] = [`${origin}${request.url}`, request.headers];
    const json = (value) => response.writeHead(200, JSON_TYPE).end(JSON.stringify(value));
    if (address === collectionAddress(origin)) return json(collection(origin));
    const names = (new globalThis.URL(address).searchParams.get('ids') ?? '').split(',');
    if (address === itemsAddress(origin, names)) return json(itemsOf(origin, names));
    parts.push(range);
    if (address !== tile || how.status) return response.writeHead(how.status ?? 404).end();
    const [first, last] = (/^bytes=(\d+)-(\d+)$/.exec(range ?? '') ?? []).slice(1).map(Number);
    if (how.whole || first === undefined) return response.writeHead(200, TIFF).end(file);
    const says = (part) => ({ ...TIFF, 'content-range': `bytes ${part}/${file.length}` });
    if (first >= file.length) return response.writeHead(416, says('*')).end();
    const end = Math.min(last, file.length - 1);
    sent.push(end - first + 1);
    return response.writeHead(206, says(`${first}-${end}`)).end(file.subarray(first, end + 1));
  });
  servers.push(server);
  await once(server.listen(0, '127.0.0.1'), 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const tile = fileAddress(origin, NAME);
  return { origin, tile, parts, sent };
}
const stopped = (server) =>
  [once(server, 'close'), server.close(), server.closeAllConnections()][0];
/** A part of a tile, as it is asked for: its blocks from this one to that one, by their numbers. */
function part(tile, first, last = first) {
  const { blocks } = readTileHead(tile.subarray(0, HEAD_BYTES));
  return `bytes=${blocks[first].offset}-${blocks[last].offset + blocks[last].byteCount - 1}`;
}

// The made-up height of a cell, in metres: 512, an eighth of a metre for every row of cells
// north of N 1 200 000, and a 16 384th of a metre for every column east of E 2 600 000 - the
// first row and the first column counting as none. 512 columns raise it by less than one row
// does, so no two cells share a height, and 32 bits hold every one exactly.
const heightOf = (column, row) => 512 + row / 8 + column / 16_384;
const madeUp = (e, n) => heightOf((e - 2_600_000.25) / 0.5, (n - 1_200_000.25) / 0.5);
/** A tile of so many cells from E 2 600 000, N 1 200 000 north-eastward, in blocks of this size. */
const tileOf = (columns, rows, blockColumns = 128, blockRows = 128, heightAt = madeUp) => {
  const size = { columns, rows, northN: 1_200_000 + rows / 2, blockColumns, blockRows };
  return madeUpTile({ eastKm: 2600, northKm: 1200, ...size, heightAt });
};
/** What came, said: so many rows of so many heights, and how many of them are not the cell's own,
 * counted from this column and this row of the tile - `201 rows of 201, 0 amiss`. */
const said = (heightsM, column, row) => {
  const isOwn = (height, east, north) => height === heightOf(column + east, row + north);
  const own = (heights, north) => heights.filter((one, east) => isOwn(one, east, north)).length;
  const others =
    heightsM.length * heightsM[0].length - heightsM.map(own).reduce((sum, n) => sum + n);
  return `${heightsM.length} rows of ${heightsM[0].length}, ${others} amiss`;
};
// Columns 100 to 300 and rows 100 to 300 from the tile's south-west corner, across block edges.
const ACROSS = { minE: 2_600_050.25, maxE: 2_600_150.25, minN: 1_200_050.25, maxN: 1_200_150.25 };

await it('takes each cell from its own place, across the blocks of the tile', async () => {
  // 512 by 512 cells in sixteen blocks, four to a row.
  const tile = tileOf(512, 512);
  const service = await downloads(tile);
  const { cells, heightsM } = await groundOf(service.origin, ACROSS);
  assert.deepEqual(cells, { west: 5_200_100, east: 5_200_300, south: 2_400_100, north: 2_400_300 });
  assert.equal(said(heightsM, 100, 100), '201 rows of 201, 0 amiss');
  // By hand: the south-west grid point is column 100 of row 100, 512 + 12.5 + 100 / 16 384;
  // either side of the block edge at column 128, in row 127, and of the one at row 128, in
  // column 127; and the north-east grid point, column 300 of row 300.
  assert.equal(heightsM[0][0], 524.506103515625);
  // In 16 384ths of a metre over 512 m, a row is 2048 and a column 1.
  const edges = [heightsM[27][27], heightsM[27][28], heightsM[28][27], heightsM[200][200]];
  const steps = edges.map((height) => (height - 512) * 16_384);
  assert.deepEqual(steps, [127 * 2048 + 127, 127 * 2048 + 128, 128 * 2048 + 127, 300 * 2048 + 300]);
  // The box crosses the first three blocks of the second, the third and the fourth row - blocks
  // 4 to 6, 8 to 10 and 12 to 14, counted from 0 - and each row is one part, after the head: the
  // fourth block of a row lies between two parts, and is never asked for.
  const rows = [4, 8, 12].map((first) => part(tile, first, first + 2));
  assert.deepEqual(service.parts, ['bytes=0-16383', ...rows]);
});
// Two blocks to a row, eight rows: the box's columns lie in both blocks of a row, its rows - 211
// to 411 from the tile's north edge - in rows of blocks 3 to 6: blocks 6 to 13 follow each other
// in the file, one part. And eight blocks to a row, two rows: the box's columns lie in blocks 1
// to 4 of a row, its rows in both rows - blocks 1 to 4 and 9 to 12, with four between: two parts.
const NOT_SQUARE = {
  'wider than high': [256, 64, 6, 13],
  'higher than wide': [64, 256, 1, 4, 9, 12],
};
for (const [what, [blockColumns, blockRows, ...ends]] of Object.entries(NOT_SQUARE)) {
  await it(`takes each cell from its own place, in blocks ${what}`, async () => {
    const tile = tileOf(512, 512, blockColumns, blockRows);
    const service = await downloads(tile);
    const { heightsM } = await groundOf(service.origin, ACROSS);
    assert.equal(said(heightsM, 100, 100), '201 rows of 201, 0 amiss');
    const head = readTileHead(tile.subarray(0, HEAD_BYTES));
    assert.deepEqual([head.blockColumns, head.blockRows], [blockColumns, blockRows]);
    const parts = ends.map((first, at) => (at % 2 === 0 ? part(tile, first, ends[at + 1]) : null));
    assert.deepEqual(service.parts, ['bytes=0-16383', ...parts.filter(Boolean)]);
  });
}

// A tile that is not square, 500 cells by 300 or 300 by 500, read whole. Neither side is a
// multiple of a block's, so the last block of a row and of a column are filled up. Its blocks
// across are counted by its columns, and down by its rows: taken for each other, a cell comes
// from another block, or the tile is refused for a block that it does not list.
const WHOLE = {
  'wider than high, in blocks of 128 by 128': [500, 300, 128, 128, 12],
  'higher than wide, in blocks of 128 by 128': [300, 500, 128, 128, 12],
  'wider than high, in blocks wider than high': [500, 300, 128, 64, 20],
  'higher than wide, in blocks higher than wide': [300, 500, 64, 128, 20],
  'wider than high, in blocks higher than wide': [500, 300, 64, 128, 24],
  'higher than wide, in blocks wider than high': [300, 500, 128, 64, 24],
};
for (const [what, [columns, rows, blockColumns, blockRows, blocks]] of Object.entries(WHOLE)) {
  await it(`reads a tile ${what}`, async () => {
    const tile = tileOf(columns, rows, blockColumns, blockRows);
    assert.equal(readTileHead(tile.subarray(0, HEAD_BYTES)).blocks.length, blocks);
    const service = await downloads(tile);
    // From the middle of its south-west cell to the middle of its north-east one.
    const [east, north] = [2_600_000 + columns / 2 - 0.25, 1_200_000 + rows / 2 - 0.25];
    const box = { minE: 2_600_000.25, maxE: east, minN: 1_200_000.25, maxN: north };
    const { cells, heightsM } = await groundOf(service.origin, box);
    assert.deepEqual([cells.west, cells.south], [5_200_000, 2_400_000]);
    assert.equal(said(heightsM, 0, 0), `${rows} rows of ${columns}, 0 amiss`);
    // By hand: the south-east grid point, in the last block that the tile lists, is the last
    // column of row 0 - 512, and a 16 384th of a metre a column. And all of it came in one part.
    assert.equal(heightsM[0].at(-1), 512 + (columns - 1) / 16_384);
    assert.deepEqual(service.parts, ['bytes=0-16383', part(tile, 0, blocks - 1)]);
  });
}

// What a tile costs in parts, and a file that is not as its directory says. Three cells each way
// from the tile's south-west corner, on a slope: 540 m there, 0.25 m a cell east, 2 m north.
const BOX = { minE: 2_600_000.25, maxE: 2_600_001.25, minN: 1_200_000.25, maxN: 1_200_001.25 };
const CELLS = { west: 5_200_000, east: 5_200_002, south: 2_400_000, north: 2_400_002 };
const SLOPE = [540, 540.25, 540.5, 542, 542.25, 542.5, 544, 544.25, 544.5];
const slope = (e, n) => 540 + (e - 2_600_000.25) / 2 + (n - 1_200_000.25) * 4;
/** The slope, but for one cell of the box, at E 2 600 000.75, N 1 200 001.25. */
const butAt = (value) => (e, n) => (e === 2_600_000.75 && n === 1_200_001.25 ? value : slope(e, n));
const sloping = (heightAt = slope, cells = 256) => tileOf(cells, cells, 128, 128, heightAt);
// Of 256 cells each way in four blocks, the box lies in the third: the south-west one.
const SOUTH_WEST = readTileHead(sloping()).blocks[2];
await it('asks a tile for its head and for the one block a small box lies in - never for the tile', async () => {
  const tile = sloping();
  const service = await downloads(tile);
  const { heightsM, tiles } = await groundOf(service.origin, BOX);
  assert.deepEqual([heightsM.flat(), tiles], [SLOPE, [{ name: NAME, year: 2025 }]]);
  assert.deepEqual(service.parts, ['bytes=0-16383', part(tile, 2)]);
  // The head is the first HEAD_BYTES of the file, and the block as long as its directory says.
  assert.deepEqual(service.sent, [HEAD_BYTES, SOUTH_WEST.byteCount]);
  assert.ok(tile.length > 4 * HEAD_BYTES && SOUTH_WEST.byteCount < tile.length / 4);
});
/** That the ground of BOX is refused in these words and the tile's address, and what was asked. */
async function refuses(file, reason, how) {
  const service = await downloads(file, how);
  assert.equal(await refusal(groundOf(service.origin, BOX)), `${reason}: ${service.tile}`);
  return service.parts;
}
await it('refuses a tile that ends before a block its directory names, wherever it ends', async () => {
  // Ten bytes into the block: the part that comes back is those ten, and says so truthfully.
  const { offset, byteCount } = SOUTH_WEST;
  const ends = `The tile ends 10 bytes into the ${byteCount} its directory names from byte ${offset} on`;
  const asked = await refuses(sloping().subarray(0, offset + 10), ends);
  assert.deepEqual(asked, ['bytes=0-16383', `bytes=${offset}-${offset + byteCount - 1}`]);
  // Where it ends before the block begins, a service says so with 416.
  const none = 'The service answered 416 Range Not Satisfiable';
  assert.equal((await refuses(sloping().subarray(0, offset), none)).length, 2);
});
await it('refuses a tile that a service sends whole, and reads none of it', async () => {
  // The parked plumbing cuts the part out of the whole tile. Here the tile is refused by the
  // length that it states, at its head, and no block is asked for; and a tile that is shorter
  // than its head - flat ground, some kilobytes - is refused as what it is: the whole file.
  const large = 'The service answered with more than 16384 bytes, the most this request takes';
  assert.deepEqual(await refuses(sloping(), large, { whole: true }), ['bytes=0-16383']);
  const flat = sloping(() => 540);
  const whole = 'The service sent the whole file where a part was asked for';
  assert.ok(flat.length < HEAD_BYTES);
  assert.deepEqual(await refuses(flat, whole, { whole: true }), ['bytes=0-16383']);
});
await it('refuses a tile with a block that is not what its directory says', async () => {
  // Sixteen bytes packed as a block of their own, where 128 by 128 cells have to be.
  const tile = sloping();
  tile.set(packLzw(new Uint8Array(16)), SOUTH_WEST.offset);
  const lzw = 'Not a block of LZW as TIFF has it: it ends after 16 of 65536 bytes';
  await refuses(tile, `The tile's block from column 0, row 128 cannot be read: ${lzw}`);
});
await it('refuses a tile that the service does not have, or does not send', async () => {
  const gone = await refuses(sloping(), 'The service answered 404 Not Found', { status: 404 });
  await refuses(sloping(), 'The service answered 503 Service Unavailable', { status: 503 });
  assert.deepEqual(gone, ['bytes=0-16383']);
});

// readTile, of a block larger than the ceiling, and of a cell without a height.
/** That the cells of BOX are refused of `tile` in these words, and which parts were asked for. */
async function refusesCells(tile, reason) {
  const { origin, tile: address, parts } = await downloads(tile);
  assert.equal(await refusal(readTile(origin, NAME, CELLS)), `${reason}: ${address}`);
  return parts;
}
for (const side of [8192, 4_000_000_000]) {
  await it(`refuses a block of ${side} cells each way with the address, and asks for no block`, async () => {
    // 8192 by 8192 cells in one block, as the directory states: the head, and nothing after it.
    const tile = changed(sloping(slope, 128), (view) => {
      for (const tag of [256, 257]) view.setUint16(fieldOf(view, tag) + 8, 8192, true);
      for (const tag of [322, 323]) {
        view.setUint16(fieldOf(view, tag) + 2, 4, true);
        view.setUint32(fieldOf(view, tag) + 8, side, true);
      }
    });
    const blocks = `it states blocks of ${side} by ${side} cells, and a block of more than 262144 cells is not read`;
    const reason = `Not a tile of swissALTI3D as swisstopo publishes it: ${blocks}`;
    assert.deepEqual(await refusesCells(tile, reason), ['bytes=0-16383']);
  });
}
const NO_HEIGHT = 'swissALTI3D states no height at E 2600000.75, N 1200001.25';
/** A copy of a tile that names no number for no height - and one that names -32768 for it. */
const namingNone = (tile) =>
  changed(tile, (view) => view.setUint16(fieldOf(view, 42113), 65_000, true));
const naming32768 = (tile) =>
  changed(tile, (view) => {
    const at = view.getUint32(fieldOf(view, 42113) + 8, true);
    new Uint8Array(view.buffer).set(Buffer.from('-32768'), at);
  });
await it('refuses a cell of the box that holds no finite number', async () => {
  for (const value of [Number.NaN, Infinity, -Infinity]) {
    assert.equal((await refusesCells(sloping(butAt(value)), NO_HEIGHT)).length, 2);
  }
});
await it('refuses -9999 in a tile that names no number for no height', async () => {
  // Stated or not, -9999 is swissALTI3D's number for none: no ground lies 9999 m below the sea.
  await refusesCells(sloping(butAt(-9999)), NO_HEIGHT);
  await refusesCells(namingNone(sloping(butAt(-9999))), NO_HEIGHT);
  // The same tile without that cell is read: what is refused is the cell, not the tile.
  const service = await downloads(namingNone(sloping()));
  assert.deepEqual((await readTile(service.origin, NAME, CELLS)).flat(), SLOPE);
});
await it('refuses the number a tile names for no height, and -9999 where it names another', async () => {
  await refusesCells(naming32768(sloping(butAt(-32_768))), NO_HEIGHT);
  await refusesCells(naming32768(sloping(butAt(-9999))), NO_HEIGHT);
  const service = await downloads(naming32768(sloping()));
  assert.deepEqual((await readTile(service.origin, NAME, CELLS)).flat(), SLOPE);
});
await it('asks for no tile whose file hosts.js builds no address for', async () => {
  const none = 'No file of a tile at a host that the pad asks, so nothing was asked: ';
  const [AT, NO_PORT] = ['http://127.0.0.1:1', 'http://127.0.0.1'];
  const asked = (origin, name) => refusal(readTile(origin, name, CELLS));
  assert.equal(await asked(AT, 'tile_2025'), `${none}"tile_2025" at "${AT}"`);
  assert.equal(await asked(NO_PORT, NAME), `${none}"${NAME}" at "${NO_PORT}"`);
});

await Promise.all(servers.map(stopped));
assert.equal(cases, 20);
process.stdout.write(
  `tools/sketch/swisstopo: a tile is read in parts, its head and the blocks that a box needs - every cell from its own place, in blocks and in tiles that are not square - and a tile that ends short, comes whole, holds a block that is none or a cell without a height is refused with its address: ${cases} cases\n`,
);
