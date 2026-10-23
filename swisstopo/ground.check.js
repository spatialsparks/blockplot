// The check of the ground of a box (ST-031): ground.js through the stand-in for swisstopo, which
// is started as a process of its own, on its made-up world at the origin of the Swiss grid in
// Bern - four tiles that meet there, a slope within 128 m of the origin and flat ground beyond
// it, a height a tile, and one tile of another year than its neighbours. Every height that
// comes is held to the rule of made-up.js, the 32-bit number, and some by hand: the slope is
// 560 - 0.076 east - 0.068 north, in metres from the origin. And what the stand-in was asked
// is held to its own account, /asked: which requests, in which order, each tile in parts and
// none whole, none beside another, none with a referrer or a cookie. They are the cases of the
// parked product's fetchTerrain.test.ts, packages/adapters/src/geodata/terrain/, where they hold
// of this reader and of this world - a source and a licence are a plot's file's to say - and
// the first hand case of the one computation of a plot (T-031.3). What is refused is
// ground-refused.check.js's, and a tile whose every cell differs ground-parts.check.js's.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { getJson } from './door.js';
import { middleOf } from './grid.js';
import { MAX_TILES, groundOf } from './ground.js';
import { collectionAddress, fileAddress, itemsAddress, tileName } from './hosts.js';
import { fileOf, heightAt } from './made-up.js';
import { readTileHead } from './tiff.js';
import { HEAD_BYTES } from './tile.js';

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
// The stand-in, on a port that the system picked: it says its address, and is asked there.
const standIn = spawn(process.execPath, [path.join(import.meta.dirname, 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const soon = { signal: globalThis.AbortSignal.timeout(20_000) };
const [, AT] = /^The stand-in for swisstopo: (\S+) - /.exec(
  await once(standIn.stdout, 'data', soon),
);
const target = (address) => address.slice(AT.length);

/** The ground of a box, with what the stand-in was asked for it: every request, in its order. */
async function read(box) {
  await getJson(AT, '/asked?forget');
  const ground = await groundOf(AT, box);
  return { ...ground, asked: await getJson(AT, '/asked') };
}
/** A box by the metres east and north of the origin that its edges lie at. */
const boxAt = (west, east, south, north) => ({
  minE: 2_600_000 + west,
  maxE: 2_600_000 + east,
  minN: 1_200_000 + south,
  maxN: 1_200_000 + north,
});
/** How many heights of a ground are not the rule's own number, of how many: `0 of 9996`. */
function amiss({ cells, heightsM }) {
  const rows = cells.north - cells.south + 1;
  const columns = cells.east - cells.west + 1;
  assert.deepEqual(
    [heightsM.length, new Set(heightsM.map((row) => row.length))],
    [rows, new Set([columns])],
  );
  const isOther = (height, row, column) =>
    !Object.is(height, heightAt(middleOf(cells.west + column), middleOf(cells.south + row)));
  const others = heightsM.flatMap((heights, row) =>
    heights.filter((one, column) => isOther(one, row, column)),
  );
  return `${others.length} of ${rows * columns}`;
}
/** A height of the slope, by hand: the 32-bit number nearest to it. */
const slope = (east, north) => Math.fround(560 - 0.076 * east - 0.068 * north);
/** What the stand-in was asked of a tile's file: its head, then its parts - never the file whole. */
const fileOfTile = (year, eastKm, northKm) =>
  target(fileAddress(AT, tileName(year, eastKm, northKm)));
/** A part of a tile, as it is asked for: the blocks from this one to that one, by their numbers. */
function part(name, first, last = first) {
  const { blocks } = readTileHead(fileOf(name).subarray(0, HEAD_BYTES));
  return `bytes=${blocks[first].offset}-${blocks[last].offset + blocks[last].byteCount - 1}`;
}
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const namesOfTile = (eastKm, northKm) => YEARS.map((year) => tileName(year, eastKm, northKm));
// What a request of the door's is, in the stand-in's account: a GET that says nothing of the pad,
// and comes when the one before it was answered.
const QUIET = { method: 'GET', referer: null, cookie: null, origin: null, beside: 0 };
const request = (asked, range = null) => ({ ...QUIET, target: asked, range });

await it('reads the heights of a box in one tile exactly: at its corner, on its edges and inside', async () => {
  // Three cells each way from the south-west corner of the tile north-east of the origin: the
  // middles of the cells are the grid points, a quarter metre in and then every half metre.
  const ground = await read(boxAt(0.25, 1.25, 0.25, 1.25));
  assert.deepEqual(ground.cells, {
    west: 5_200_000,
    east: 5_200_002,
    south: 2_400_000,
    north: 2_400_002,
  });
  // From south to north, in a row from west to east: 0.038 m lower with every cell eastward,
  // 0.034 m with every cell northward.
  assert.deepEqual(ground.heightsM, [
    [559.964, 559.926, 559.888].map(Math.fround),
    [559.93, 559.892, 559.854].map(Math.fround),
    [559.896, 559.858, 559.82].map(Math.fround),
  ]);
  assert.deepEqual(ground.tiles, [{ name: 'swissalti3d_2025_2600-1200', year: 2025 }]);
  // The collection; the items of the tile, by the eight names that it could have; its head; and
  // the one block that the box lies in - the first of the tile's last row of sixteen.
  const tile = fileOfTile(2025, 2600, 1200);
  assert.deepEqual(ground.asked, [
    request(target(collectionAddress(AT))),
    request(target(itemsAddress(AT, namesOfTile(2600, 1200)))),
    request(tile, 'bytes=0-16383'),
    request(tile, part('swissalti3d_2025_2600-1200', 240)),
  ]);
});
await it('reads a tile to its far corner, and the flat ground beyond the slope', async () => {
  // The last two cells each way of the same tile, a kilometre on: its north-east corner, in a
  // block whose 128 cells each way hold only 80 of the tile. The ground there is flat, 560 m.
  const corner = await read(boxAt(999.25, 999.75, 999.25, 999.75));
  assert.deepEqual(corner.heightsM, [
    [560, 560],
    [560, 560],
  ]);
  assert.equal(corner.asked.at(-1).range, part('swissalti3d_2025_2600-1200', 15));
  // And across the edge of the slope, 128 m from the origin each way: its last two cells, and
  // the first two of the flat ground - in two blocks that lie far apart in the file, for a
  // made-up tile writes its flat ground once: two parts.
  const edge = await read(boxAt(127.25, 128.75, 127.25, 128.75));
  assert.deepEqual(edge.heightsM, [
    [slope(127.25, 127.25), slope(127.75, 127.25), 560, 560],
    [slope(127.25, 127.75), 541.604, 560, 560].map(Math.fround),
    [560, 560, 560, 560],
    [560, 560, 560, 560],
  ]);
  assert.deepEqual([amiss(edge), edge.asked.length], ['0 of 16', 5]);
});
await it('gives one seamless ground where four tiles meet, out to the flat ground of each', async () => {
  // 130 m either side of the origin from west to east, and 2 m either side of it from south to
  // north: across the whole slope, and a cell or two of the flat ground of each of the four.
  const ground = await read(boxAt(-130, 130, -2, 2));
  assert.deepEqual(ground.cells, {
    west: 5_199_739,
    east: 5_200_260,
    south: 2_399_995,
    north: 2_400_004,
  });
  assert.equal(amiss(ground), '0 of 5220');
  // Its four corners are the four tiles' flat ground, and the four cells at the origin are on
  // the slope: 560 m there, 0.038 m and 0.034 m a cell.
  const at = (row, column) => ground.heightsM.at(row).at(column);
  assert.deepEqual([at(0, 0), at(0, -1), at(-1, 0), at(-1, -1)], [520, 530, 550, 560]);
  const origin = [at(4, 260), at(4, 261), at(5, 260), at(5, 261)];
  assert.deepEqual(origin, [560.036, 559.998, 560.002, 559.964].map(Math.fround));
  // From south to north and west to east, each in its newest state: one is of another year.
  assert.deepEqual(ground.tiles, [
    { name: 'swissalti3d_2025_2599-1199', year: 2025 },
    { name: 'swissalti3d_2025_2600-1199', year: 2025 },
    { name: 'swissalti3d_2021_2599-1200', year: 2021 },
    { name: 'swissalti3d_2025_2600-1200', year: 2025 },
  ]);
  // Ten requests, one after the other: the collection, the items by 32 names, and of each tile
  // its head and one part - a row of three blocks.
  const files = ground.tiles.map(({ name }) => target(fileAddress(AT, name)));
  const asked = ground.asked.slice(2).map((one) => one.target);
  assert.deepEqual(
    asked,
    files.flatMap((file) => [file, file]),
  );
  assert.equal(ground.asked[1].target.split(',').length, 32);
  assert.ok(ground.asked.every((one) => one.beside === 0 && one.method === 'GET'));
  assert.deepEqual([MAX_TILES, ground.asked.length], [9, 10]);
});
await it('reads the box of the first hand case of a plot: two tiles, of two years, in eight requests', async () => {
  // E 2 599 997 to 2 600 045, N 1 200 003 to 1 200 053 (T-031.3): 98 cells by 102, on the slope,
  // seven of its columns west of E 2 600 000 - in the tile whose newest state is of 2021.
  const ground = await read(boxAt(-3, 45, 3, 53));
  assert.deepEqual(ground.cells, {
    west: 5_199_993,
    east: 5_200_090,
    south: 2_400_005,
    north: 2_400_106,
  });
  assert.equal(amiss(ground), '0 of 9996');
  assert.deepEqual([ground.heightsM.length, ground.heightsM[0].length], [102, 98]);
  // By hand, its four corners: 3.25 m west and 45.25 m east of the origin, 2.75 m and 53.25 m
  // north of it.
  const corners = [
    ground.heightsM[0][0],
    ground.heightsM[0][97],
    ground.heightsM[101][0],
    ground.heightsM[101][97],
  ];
  assert.deepEqual(corners, [560.06, 556.374, 556.626, 552.94].map(Math.fround));
  const [west, east] = ['swissalti3d_2021_2599-1200', 'swissalti3d_2025_2600-1200'];
  assert.deepEqual(ground.tiles, [
    { name: west, year: 2021 },
    { name: east, year: 2025 },
  ]);
  // Eight things, in this order: the collection; the items, by sixteen names; the head of the
  // first tile and two parts of it - its last block of the row before the last, and of the last
  // row; the head of the second and two parts of it, the first block of the same two rows. Each
  // request for a tile comes with a Range; none is beside another, or says where it came from.
  const [first, second] = [fileOfTile(2021, 2599, 1200), fileOfTile(2025, 2600, 1200)];
  const names = [...namesOfTile(2599, 1200), ...namesOfTile(2600, 1200)];
  assert.deepEqual(ground.asked, [
    request(target(collectionAddress(AT))),
    request(target(itemsAddress(AT, names))),
    request(first, 'bytes=0-16383'),
    request(first, part(west, 239)),
    request(first, part(west, 255)),
    request(second, 'bytes=0-16383'),
    request(second, part(east, 224)),
    request(second, part(east, 240)),
  ]);
  assert.deepEqual([names.length, HEAD_BYTES], [16, 16_384]);
});
await it('gives the same ground however often it is asked, and remembers no tile', async () => {
  const [first, again] = [await read(boxAt(-3, 45, 3, 53)), await read(boxAt(-3, 45, 3, 53))];
  assert.deepEqual(again.heightsM, first.heightsM);
  assert.deepEqual([first.asked.length, again.asked], [8, first.asked]);
});
standIn.kill();

assert.equal(cases, 5);
process.stdout.write(
  `tools/sketch/swisstopo: the ground of a box is read off the stand-in's made-up world - in one tile, where four meet, and of the first hand case of a plot, 102 rows of 98 heights from two tiles of two years - every height the rule's, in eight requests, one after the other, every tile in parts: ${cases} cases\n`,
);
