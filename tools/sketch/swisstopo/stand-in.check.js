// The check of the stand-in for swisstopo (ST-031, rule 3): stand-in.js as a process of its own,
// on a port that the operating system picked, asked by node:http over 127.0.0.1 - every row of
// what it answers, and its made-up world, made-up.js, by hand; and a made-up tile read back in
// parts - its first 16 384 bytes, then one block - by the pad's own reader, to heights that a
// hand works out. An address is built by hosts.js on the stand-in's own origin: no host is
// typed here. Nothing is written, nothing is left running, and nobody else is asked.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { connect } from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { blocksOf, rangesOf, windowOf } from './blocks.js';
import { CELL_M, tilesOf } from './grid.js';
import { LAYERS, collectionAddress, fileAddress, itemsAddress, mayAsk } from './hosts.js';
import { searchAddress, tileAddress, tileName } from './hosts.js';
import { decodeLzw } from './lzw.js';
import { madeUpTile } from './made-up-tile.js';
import { TILES, heightAt as ground } from './made-up.js';
import { readTileHead } from './tiff.js';

const HOST = '127.0.0.1';
const SAID =
  /^The stand-in for swisstopo: (\S+) - made-up pictures, places and ground\. Ctrl\+C stops it\.\n$/;

// The stand-in as a process of its own, told `port` as PORT: itself, and what it says. It has
// started once it says its line, and has not where it ends first - or says nothing in the 20
// seconds that it has, of which it takes a tenth of one.
async function start(port) {
  const how = { env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe'] };
  const standIn = spawn(process.execPath, [path.join(import.meta.dirname, 'stand-in.js')], how);
  // However this check ends, nothing it started outlives it.
  process.once('exit', () => standIn.kill());
  const heard = { out: '', err: '' };
  standIn.stdout.on('data', (text) => (heard.out += text));
  standIn.stderr.on('data', (text) => (heard.err += text));
  const limit = { signal: globalThis.AbortSignal.timeout(20_000) };
  await Promise.race([once(standIn.stdout, 'data', limit), once(standIn, 'close', limit)]);
  return { standIn, heard };
}
/** Stops a stand-in that runs, and is over when it has stopped. */
const stop = (running) => Promise.all([once(running, 'close'), running.kill()]);

// Named but empty is not named: the operating system picks the port, and the line says which.
const { standIn, heard } = await start('');
const [, origin] = SAID.exec(heard.out + heard.err) ?? assert.fail(heard.out + heard.err);
const port = Number(origin.slice(`http://${HOST}:`.length));
assert.ok(origin === `http://${HOST}:${port}` && mayAsk(origin), origin);
// On 127.0.0.1, and nowhere else: at another address of this machine that port is nobody's.
const knock = connect(port, '127.0.0.2');
assert.equal((await Promise.allSettled([once(knock, 'connect')]))[0].status, 'rejected');
knock.destroy();

// What a request names: an address of the stand-in's own origin without that origin, or a path.
const targetOf = (asked) => (asked.startsWith(origin) ? asked.slice(origin.length) : asked);
// What the stand-in answers at an address of its own origin, or at a path - by GET, unless told
// another method - with these headers: `said` is its status, its type and its body as text.
// Every answer allows every origin, and says how long it is.
async function ask(address, { method = 'GET', ...headers } = {}) {
  const how = { host: HOST, port, path: targetOf(address), method, headers, agent: false };
  const [answer] = await once(request(how).end(), 'response');
  const body = Buffer.concat(await Array.fromAsync(answer));
  const { headers: says, statusCode: status } = answer;
  assert.equal(says['access-control-allow-origin'], '*', address);
  assert.equal(says['content-length'], String(body.length), address);
  const [type, text] = [says['content-type'], `${body}`];
  return { status, says, type, body, text, said: [status, type, text] };
}
const statusOf = async (address, how) => (await ask(address, how)).status;
const listOf = async (address) => JSON.parse((await ask(address)).text);
const [DATA, WORDS] = ['application/json', 'text/plain; charset=utf-8'];
// What gets no answer, 404, gathered as the check goes - the last of these a whole address
// where a path stands, as a proxy is asked.
const NOTHING = ['/', '/asked/', '/asked?', '/asked?forget=1', '/index.html', `http://${HOST}:1/`];

// A picture of each layer, of what its address says - the one that the origin of the Swiss grid
// lies in, at 128 m a picture: column 1406, row 1171. A tint a layer, and no two the same.
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" ';
const EDGE = '<rect x="0.5" y="0.5" width="255" height="255" fill="none" ';
const tints = new Set();
for (const [layer, { id }] of Object.entries(LAYERS)) {
  const { status, type, text } = await ask(tileAddress(origin, layer, 26, 1406, 1171));
  assert.deepEqual([status, type, text.startsWith(SVG)], [200, 'image/svg+xml', true], layer);
  for (const word of [layer, id, 'level 26', 'column 1406', 'row 1171']) {
    assert.ok(text.includes(`>${word}</text>`) && text.includes(EDGE), `${layer}: ${word}`);
  }
  tints.add(text.match(/<rect width="256" height="256" fill="(#[0-9a-f]{6})"\/>/)[1]);
}
assert.equal(tints.size, Object.keys(LAYERS).length);
// And none for a level that the layer has not, a column or a row beyond the level, another
// ending, or a figure written otherwise: the level's last picture is there, and the next is not.
const national = tileAddress(origin, 'national', 27, 0, 0);
const last = tileAddress(origin, 'photo', 26, 3749, 2499);
const deepest = tileAddress(origin, 'photo', 28, 0, 0);
for (const address of [national, last, deepest]) assert.equal(await statusOf(address), 200);
NOTHING.push(national.replace('/27/0/0.', '/28/0/0.'), national.replace(/jpeg$/, 'png'));
NOTHING.push(last.replace('/3749/', '/3750/'), last.replace('/2499.', '/2500.'));
NOTHING.push(last.replace('/26/', '/026/'), `${last}?`, last.replace('/1.0.0/', '/1.0.1/'));

// The places: what the search finds, by the words it is asked - four, each with the fields that
// the real search answers with and no other, `y` the easting and `x` the northing.
const SQUARE =
  '<img src="x" onerror="globalThis.RAN = 1">Made-up <i>square</i> <b>0000 Madeupville</b>';
const PLACES = [
  ['Made-up lane 1 <b>0000 Madeupville</b>', 2_600_020, 1_200_010],
  [SQUARE, 2_600_038, 1_200_034],
  [`Made-up place with a long name${' long'.repeat(60)}`, 2_600_300, 1_200_300],
  ['Made-up place off the map', 0, 0],
];
const FIELDS = 'detail,featureId,geom_st_box2d,label,lat,lon,num,origin,rank,x,y,zoomlevel';
const search = (words) => searchAddress(origin, words);
const { results } = await listOf(search('Made-up lane & more'));
const placed = results.map(({ attrs }) => [attrs.label, attrs.y, attrs.x]);
assert.deepEqual(placed, PLACES);
for (const place of results) {
  assert.equal(`${Object.keys(place)} ${Object.keys(place.attrs)}`, `attrs,id,weight ${FIELDS}`);
}
// No more than `limit`; nothing for `nowhere`; a failure for `fails`; no JSON for `garbage`; and
// no answer for what is no search of the pad's: in WGS84, with no limit, with a plus for a blank.
const limited = search('lane').replace(/limit=\d+$/, 'limit=2');
assert.deepEqual((await listOf(limited)).results, results.slice(0, 2));
assert.deepEqual((await ask(search('a place nowhere'))).said, [200, DATA, '{"results":[]}']);
const FAILED = 'A made-up failure of the search <b>with markup</b>';
assert.deepEqual((await ask(search('it fails'))).said, [500, WORDS, FAILED]);
assert.deepEqual((await ask(search('garbage'))).said, [200, DATA, 'no JSON at all']);
NOTHING.push(limited.replace('sr=2056', 'sr=4326'), limited.replace('limit=2', 'limit='));
NOTHING.push(limited.replace('lane', 'a+lane'), limited.replace('&limit=2', ''));

// The terrain. The collection, to the letter; and the items for the eight names of a tile, its
// two: each lists its file of half a metre at the pad's address for it, then its file of 2 m.
const MODEL = 'ch.swisstopo.swissalti3d';
const COLLECTION = `{"stac_version":"1.0.0","id":"${MODEL}","type":"Collection","extent":{"temporal":{"interval":[["2019-01-01T00:00:00Z","2026-01-01T00:00:00Z"]]}}}`;
assert.deepEqual((await ask(collectionAddress(origin))).said, [200, DATA, COLLECTION]);
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const TIFF = 'image/tiff; application=geotiff; profile=cloud-optimized';
/** The items that the catalogue has of one tile, asked by its eight names: each by its year. */
async function statesOf(eastKm, northKm) {
  const names = YEARS.map((year) => tileName(year, eastKm, northKm));
  const asked = itemsAddress(origin, names);
  const { type, features, links, ...more } = await listOf(asked);
  const self = [{ rel: 'self', href: asked.split('?')[0] }];
  assert.deepEqual([type, links, more], ['FeatureCollection', self, {}]);
  return features.map(({ assets, ...item }) => {
    const year = Number(item.properties.datetime.slice(0, 4));
    const id = tileName(year, eastKm, northKm);
    const properties = { datetime: `${year}-01-01T00:00:00Z` };
    const stated = { id, collection: MODEL, type: 'Feature', stac_version: '1.0.0', properties };
    assert.deepEqual(item, stated);
    const half = fileAddress(origin, id);
    const files = [`${id}_0.5_2056_5728.tif`, `${id}_2_2056_5728.tif`];
    const hrefs = [half, half.replace(files[0], files[1])];
    const file = (index, gsd) => ({ type: TIFF, href: hrefs[index], gsd, 'proj:epsg': 2056 });
    const listed = { [files[0]]: file(0, 0.5), [files[1]]: file(1, 2) };
    assert.equal(JSON.stringify(assets), JSON.stringify(listed));
    NOTHING.push(hrefs[1]);
    return year;
  });
}
assert.deepEqual(await statesOf(2600, 1200), [2019, 2025]);
assert.deepEqual(await statesOf(2599, 1200), [2019, 2021]);
assert.deepEqual(await statesOf(2600, 1199), [2019, 2025]);
assert.deepEqual(await statesOf(2599, 1199), [2019, 2025]);
assert.deepEqual([await statesOf(2600, 1201), await statesOf(2601, 1200)], [[2025], []]);

// A made-up tile, read back in parts as the pad's reader reads a real one: its first 16 384
// bytes, then the block of one cell - by the metres east and north of the origin, and its year.
const heads = new Map();
async function readAt(e, n, year) {
  const column = Math.floor((2_600_000 + e) / CELL_M);
  const row = Math.floor((1_200_000 + n) / CELL_M);
  const cells = { west: column, east: column, south: row, north: row };
  const [{ eastKm, northKm }] = tilesOf(cells);
  const file = fileAddress(origin, tileName(year, eastKm, northKm));
  if (!heads.has(file)) {
    const first = await ask(file, { range: 'bytes=0-16383' });
    assert.deepEqual([first.status, first.type, first.body.length], [206, TIFF, 16_384]);
    heads.set(file, readTileHead(first.body));
  }
  const head = heads.get(file);
  const window = windowOf(head, cells);
  const [block, ...others] = blocksOf(head, window);
  const [part] = rangesOf([block]);
  const packed = await ask(file, { range: `bytes=${part.first}-${part.last}` });
  assert.deepEqual([packed.status, packed.body.length, others.length], [206, block.byteCount, 0]);
  assert.ok(packed.says['content-range'].startsWith(`bytes ${part.first}-${part.last}/`));
  const unpacked = decodeLzw(packed.body, head.blockColumns * head.blockRows * 4);
  const [right, down] = [window.firstColumn - block.firstColumn, window.firstRow - block.firstRow];
  return new DataView(unpacked.buffer).getFloat32((down * head.blockColumns + right) * 4, true);
}
// On the slope, 560 - 0.076 e - 0.068 n, cells by hand, each the 32-bit number nearest to it:
// two north-east of the origin, one north-west of it, in the tile of another year, the slope's
// last and its first. Flat ground a cell beyond it, a height a tile. One cell with no height,
// of three.
assert.equal(await readAt(0.25, 0.25, 2025), Math.fround(559.964));
assert.equal(await readAt(20.25, 10.25, 2025), Math.fround(557.764));
assert.equal(await readAt(-0.25, 0.25, 2021), Math.fround(560.002));
assert.equal(await readAt(127.75, 127.75, 2025), Math.fround(541.604));
assert.equal(await readAt(-127.75, -127.75, 2025), Math.fround(578.396));
assert.equal(await readAt(128.25, 127.75, 2025), 560);
assert.equal(await readAt(-128.25, 0.25, 2021), 550);
assert.equal(await readAt(0.25, -128.25, 2025), 530);
assert.equal(await readAt(-128.25, -0.25, 2025), 520);
assert.equal(await readAt(-100.25, -100.75, 2025), Math.fround(574.47));
assert.equal(await readAt(-100.75, -100.25, 2025), Math.fround(574.474));
assert.equal(await readAt(-100.25, -100.25, 2025), -9999);
// And each tile says what is so: written cell by cell, the slow way, it is the bytes that came.
for (const { eastKm, northKm, years } of TILES.slice(0, 4)) {
  const came = await ask(fileAddress(origin, tileName(Math.max(...years), eastKm, northKm)));
  assert.equal(Buffer.compare(came.body, madeUpTile({ eastKm, northKm, heightAt: ground })), 0);
}

// A file whole and in parts. With no Range, or one in another form, the whole file; a part of
// one byte; a part that reaches beyond the file's end, shorter; none from the file's end on.
const north = fileAddress(origin, tileName(2025, 2600, 1200));
const whole = await ask(north);
const size = whole.body.length;
assert.deepEqual([whole.status, whole.type, whole.says['content-range']], [200, TIFF, undefined]);
for (const range of ['bytes=0-', 'bytes=-500', 'bytes=5-2', 'bytes=0-9,20-29', 'megabytes=0-9']) {
  const answer = await ask(north, { range });
  assert.deepEqual([answer.status, answer.body.length, range], [200, size, range]);
}
assert.equal(await statusOf(north, { range: 'bytes=7-7' }), 206);
const end = await ask(north, { range: `bytes=${size - 10}-${size + 99}` });
assert.equal(end.says['content-range'], `bytes ${size - 10}-${size - 1}/${size}`);
assert.deepEqual([end.status, Buffer.compare(end.body, whole.body.subarray(size - 10))], [206, 0]);
const beyond = await ask(north, { range: `bytes=${size}-${size + 9}` });
assert.deepEqual([beyond.status, beyond.says['content-range']], [416, `bytes */${size}`]);
// A tile of an older state, a tile that there is not, and what is no file of a tile: 404. And
// the file that is no tile: a text, which the pad's reader refuses by its first bytes.
const older = fileAddress(origin, tileName(2019, 2600, 1200));
NOTHING.push(older, `${north}.aux`, fileAddress(origin, tileName(2025, 2601, 1200)));
NOTHING.push(`/nowhere?ids=${tileName(2025, 2600, 1200)}`);
const noTile = fileAddress(origin, tileName(2025, 2600, 1201));
assert.deepEqual((await ask(noTile)).said, [200, TIFF, 'A made-up answer that is no tile.']);
const noHead = await ask(noTile, { range: 'bytes=0-16383' });
assert.deepEqual([noHead.status, noHead.says['content-range']], [206, 'bytes 0-32/33']);
const refusal = /: it does not begin as one does, with 49 49 2a 00, but with 41 20 6d 61$/;
assert.throws(() => readTileHead(noHead.body), { message: refusal });

// It answers GET alone, and what it does not know with 404: everything that was gathered.
const refused = await ask(national, { method: 'POST' });
assert.deepEqual([refused.status, refused.says.allow], [405, 'GET']);
assert.equal(NOTHING.length, 30);
for (const address of NOTHING) assert.equal(await statusOf(address), 404, address);

// /asked: every request since it was told to forget, in their order, each as it came - and
// /asked is no part of its own list, by whatever method. A header that did not come is null.
assert.deepEqual((await ask('/asked?forget')).said, [200, DATA, '[]']);
const page = 'http://127.0.0.1:4999';
const came = { referer: `${page}/map/index.html`, cookie: 'made-up=1', origin: page };
const ASKED = [
  ['GET', national, {}],
  ['GET', north, { ...came, range: 'bytes=0-16383' }],
  ['PUT', '/nowhere?at=all', { range: 'bytes=43086-91635' }],
];
for (const [method, address, its] of ASKED) await ask(address, { method, ...its });
assert.equal(await statusOf('/asked', { method: 'POST' }), 405);
const none = { range: null, referer: null, cookie: null, origin: null, beside: 0 };
const record = ([method, address, its]) => ({ method, target: targetOf(address), ...none, ...its });
assert.deepEqual(await listOf('/asked'), ASKED.map(record));
assert.deepEqual(await listOf('/asked'), ASKED.map(record));
assert.deepEqual([await listOf('/asked?forget'), await listOf('/asked')], [[], []]);

// The terrain - the catalogue, a file, one that is not there - is answered after a while, so
// that two requests sent at once are seen side by side: tried five times at the most, for a busy
// machine may send the second late. A picture is answered at once: none is beside another.
const besides = async (address) => {
  await ask('/asked?forget');
  await Promise.all([ask(address), ask(address)]);
  return (await listOf('/asked')).map((one) => one.beside);
};
assert.deepEqual(await besides(national), [0, 0]);
const items = itemsAddress(origin, [tileName(2025, 2600, 1200)]);
for (const at of [collectionAddress(origin), items, north, older]) {
  let seen = [];
  for (let tries = 0; tries < 5 && seen.join() !== '0,1'; tries += 1) seen = await besides(at);
  assert.deepEqual(seen, [0, 1], at);
}

// It listens where PORT says: stopped, and started anew on the port that it had - which so is
// free again. And what is no port is none: it says so, and does not start.
await stop(standIn);
const second = await start(String(port));
assert.equal(SAID.exec(second.heard.out + second.heard.err)?.[1], origin);
await stop(second.standIn);
for (const named of ['4x', '0', '65536', '1e3']) {
  const { standIn: ended, heard: its } = await start(named);
  const words = `The stand-in for swisstopo did not start: PORT is "${named}", no port.\n`;
  assert.deepEqual([ended.exitCode, its.out, its.err], [1, '', words]);
}

process.stdout.write(
  'tools/sketch/swisstopo: the stand-in answers for the three services on 127.0.0.1 alone - a picture of each layer, the made-up places, the collection, the items of a tile, a tile whole and in parts - and a made-up tile read back in parts gives the heights of its rule; it says what it was asked, and forgets\n',
);
