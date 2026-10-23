// The check of a part of a file, asked through the pad's door (ST-031): what door.js sends for
// `{ range }`, and what it takes for the part - on servers of this check's own, each on
// 127.0.0.1 at a port that the system picked, which say what a service would: the part, the
// whole file, or neither; and on the stand-in for swisstopo, started as a process of its own.
// They are the cases of the parked product's http.range.test.ts, packages/adapters/src/geodata/,
// case for case where they hold of this door. Where a parked case takes the whole file for a
// part, this door refuses it - and the server sees the client go before it has sent the file;
// where one follows a redirect, this door refuses that. And a part is held to its own length,
// which the parked plumbing does not do: an answer that is longer is refused for its size, so
// what a longer answer calls itself is tried with a `maxBytes` that has room for it. Nothing
// here leaves this machine, and no host is typed (named.check.js).
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { clearInterval, clearTimeout, setInterval, setTimeout } from 'node:timers';
import { MAX_BYTES, getBytes, getJson } from './door.js';
import { collectionAddress, fileAddress, tileName } from './hosts.js';
import { collection, fileOf } from './made-up.js';

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
const servers = [];
/**
 * A server of this check's own that answers as `answer` says, and keeps what it was asked: the
 * path, the part, the names of every header that came, in the order of their letters, and what
 * two of them said - which packing is taken, and who asks.
 */
async function serve(answer) {
  const asked = [];
  const server = createServer((request, response) => {
    const names = request.rawHeaders.filter((_, index) => index % 2 === 0).sort();
    const { range, 'accept-encoding': packing, 'user-agent': agent } = request.headers;
    asked.push({ url: request.url, range, names: names.join(' '), packing, agent });
    answer(request, response);
  });
  servers.push(server);
  await once(server.listen(0, '127.0.0.1'), 'listening');
  return { origin: `http://127.0.0.1:${server.address().port}`, asked };
}
const stopped = (server) =>
  [once(server, 'close'), server.close(), server.closeAllConnections()][0];
/** What a request was refused with - or that it was not. */
const worded = (error) => error.message;
const refusal = (request) => request.then(() => 'no error', worded);
const part = (first, last, more) => ({ range: { first, last }, ...more });
/** The bytes of /tile.tif from `first` to `last`, as the door gives them: `2,3,4,5`. */
const bytesOf = async ({ origin }, first, last) =>
  (await getBytes(origin, '/tile.tif', part(first, last))).join();
/** What a request for a part of /tile.tif was refused with: the words before its address. */
const refused = async ({ origin }, first, last, more) => {
  const words = await refusal(getBytes(origin, '/tile.tif', part(first, last, more)));
  assert.ok(words.endsWith(`: ${origin}/tile.tif`), words);
  return words.slice(0, -`: ${origin}/tile.tif`.length);
};
const WHOLE = 'The service sent the whole file where a part was asked for';
const tooLarge = (most) =>
  `The service answered with more than ${most} bytes, the most this request takes`;

// A file of sixteen bytes, each of them its own number: byte 5 is a 5.
const FILE = Uint8Array.from({ length: 16 }, (_, index) => index);
const TIFF = { 'content-type': 'image/tiff' };
/** Answers with status 206 and these bytes, called what `says` says - or nothing. */
const called = (says) => (says === undefined ? TIFF : { ...TIFF, 'content-range': says });
const aPart = (says, bytes) => (_request, response) =>
  response.writeHead(206, called(says)).end(bytes);
/** Answers as a service that knows `Range` does: with the part of FILE that was asked for. */
const theFileInParts = (request, response) => {
  const asked = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range ?? '');
  if (asked === null) return response.writeHead(200, TIFF).end(FILE);
  const [first, last] = [Number(asked[1]), Math.min(Number(asked[2]), FILE.length - 1)];
  const beyond = { 'content-range': `bytes */${FILE.length}` };
  if (first >= FILE.length) return response.writeHead(416, beyond).end();
  const send = aPart(`bytes ${first}-${last}/${FILE.length}`, FILE.subarray(first, last + 1));
  return send(request, response);
};
/** Answers as a service that ignores `Range` does: with the whole file, and this status. */
const wholeFile = (status) => (_request, response) => response.writeHead(status, TIFF).end(FILE);
/** A server whose answer never ends of itself: `left` is over once the client has gone, and
 * fails where it has not gone within three seconds - dropped unread, and not let go of. */
async function serveUnended(begin) {
  const gone = Promise.withResolvers();
  const server = await serve((_request, response) => {
    const late = setTimeout(gone.reject, 3000, new Error('The client did not go within 3 s.'));
    response.once('close', () => gone.resolve(clearTimeout(late)));
    begin(response);
  });
  return { ...server, left: gone.promise };
}
// What a request of the machine's own carries, by the names of its headers - with a part, `range`
// among them and no other: no cookie, no referrer, no origin, and no name but the machine's.
const HEADERS = 'accept accept-encoding accept-language connection host sec-fetch-mode user-agent';
const WITH_RANGE = HEADERS.replace('host', 'host range');
const ASKED = { range: 'bytes=2-5', names: WITH_RANGE, packing: 'identity', agent: 'node' };

await it('is asked for with Range, of the file as it is stored, and handed over as it came', async () => {
  const server = await serve(theFileInParts);
  assert.equal(await bytesOf(server, 2, 5), '2,3,4,5');
  // No packing, which the machine sees to itself once there is a `Range`: a part is counted in
  // the bytes of the file. And of who asks it says what the machine says of itself, `node`.
  assert.deepEqual(server.asked, [{ url: '/tile.tif', ...ASKED }]);
});
await it('is one byte where the first and the last are the same', async () => {
  const server = await serve(theFileInParts);
  assert.deepEqual([await bytesOf(server, 0, 0), await bytesOf(server, 15, 15)], ['0', '15']);
});
await it('is shorter than was asked for where the file ends first, and the caller counts', async () => {
  const server = await serve(theFileInParts);
  assert.equal(await bytesOf(server, 12, 40), '12,13,14,15');
  // A part far longer than an answer may be is asked for all the same: the file may end first.
  assert.equal(await bytesOf(server, 0, 10 * MAX_BYTES - 1), FILE.join());
});
await it('is taken from a part whose file states no length, if it is as long as was asked for', async () => {
  const server = await serve(aPart('bytes 2-5/*', FILE.subarray(2, 6)));
  assert.equal(await bytesOf(server, 2, 5), '2,3,4,5');
});
await it('is never cut out of the whole file where the service ignores Range', async () => {
  // Held to its own four bytes, the whole file is refused by the sixteen that it states; with
  // room for all of it, it is read and refused as what it is - and so the file asked for as one
  // part, to its last byte. Only 206 says "a part": 203 is the whole file too.
  const whole = await serve(wholeFile(200));
  assert.equal(await refused(whole, 2, 5), tooLarge(4));
  assert.equal(await refused(whole, 2, 5, { maxBytes: 16 }), WHOLE);
  assert.equal(await refused(whole, 0, 15), WHOLE);
  assert.equal(await refused(await serve(wholeFile(203)), 0, 15), WHOLE);
  const ranges = whole.asked.map((one) => one.range).join(' ');
  assert.equal(ranges, 'bytes=2-5 bytes=2-5 bytes=0-15');
});
await it('lets go of a whole tile before the server has sent it', async () => {
  // A tile's head is asked for, and the service begins to send the tile whole: 16 MB, stated.
  // It is refused by that length, unread, and the server sees the client go - with the first
  // 4096 bytes written, and no more.
  const written = [];
  const stated = await serveUnended((response) => {
    const head = response.writeHead(200, { ...TIFF, 'content-length': '15969669' });
    written.push(head.write(Buffer.alloc(4096)));
  });
  assert.equal(await refused(stated, 0, 16_383), tooLarge(16_384));
  await stated.left;
  assert.equal(written.length, 1);
  // And one that states no length, and never ends, is let go of at the first byte too many.
  const unstated = await serveUnended((response) => {
    const sending = setInterval(() => response.write(Buffer.alloc(16_384)), 1);
    response.writeHead(200, TIFF).once('close', () => clearInterval(sending));
  });
  assert.equal(await refused(unstated, 0, 16_383), tooLarge(16_384));
  await unstated.left;
});
await it('that is another part is an error that names the address, never the part', async () => {
  // What it says of itself, which bytes of FILE it holds, and what the door says of it. Begins
  // later, earlier; goes on for longer, and to the file's end; stops before the file does, of a
  // stated length and of none; holds fewer bytes than it says, and more; says it in other words,
  // or not at all and is shorter or longer than was asked for - of exactly that length, a part
  // that says nothing is taken (door-browser.check.js).
  const CSI = String.fromCharCode(0x9b);
  const PARTS = [
    ['bytes 3-5/16', 3, 6, '3 bytes, called "bytes 3-5/16"'],
    ['bytes 1-5/16', 1, 6, '5 bytes, called "bytes 1-5/16"'],
    ['bytes 2-7/16', 2, 8, '6 bytes, called "bytes 2-7/16"'],
    ['bytes 2-15/16', 2, 16, '14 bytes, called "bytes 2-15/16"'],
    ['bytes 2-3/16', 2, 4, '2 bytes, called "bytes 2-3/16"'],
    ['bytes 2-3/*', 2, 4, '2 bytes, called "bytes 2-3/*"'],
    ['bytes 2-5/16', 2, 5, '3 bytes, called "bytes 2-5/16"'],
    ['bytes 2-5/16', 2, 8, '6 bytes, called "bytes 2-5/16"'],
    ['2-5/16', 2, 6, '4 bytes, called "2-5/16"'],
    [undefined, 2, 5, '3 bytes, called nothing'],
    [undefined, 2, 8, '6 bytes, called nothing'],
    // What it says is repeated as a quotation, eighty characters of it, with a sign written out.
    ['bytes "2-5"/16', 2, 6, '4 bytes, called "bytes \\"2-5\\"/16"'],
    ['x'.repeat(100), 2, 6, `4 bytes, called "${'x'.repeat(80)}"`],
    [`bytes 2-5/16 ${CSI}[2J`, 2, 6, '4 bytes, called "bytes 2-5/16 \\u009b[2J"'],
  ];
  for (const [says, first, end, found] of PARTS) {
    const server = await serve(aPart(says, FILE.subarray(first, end)));
    const words = `The service answered with another part than bytes 2 to 5 - ${found}`;
    assert.equal(await refused(server, 2, 5, { maxBytes: 16 }), words);
    // Held to its own length, a part of more than the four bytes is refused for its size.
    assert.equal(await refused(server, 2, 5), end - first > 4 ? tooLarge(4) : words);
  }
});
await it('that begins beyond the end of the file is an error, however the service says so', async () => {
  const status = 'The service answered 416 Range Not Satisfiable';
  assert.equal(await refused(await serve(theFileInParts), 16, 20), status);
  const whole = await serve(wholeFile(200));
  assert.equal(await refused(whole, 16, 20), tooLarge(5));
  assert.equal(await refused(whole, 16, 20, { maxBytes: 16 }), WHOLE);
});
await it('that is no range is refused, and nothing is asked', async () => {
  // Ends before it begins; begins before the file does, within a byte, at no number; ends
  // within a byte, nowhere - and what is no pair of numbers that count at all.
  const NONE = [part(5, 2), part(-1, 5), part(0.5, 5), part(Number.NaN, 5), part(0, 5.5)];
  NONE.push(part(0, Infinity), part('0', 5), part(2 ** 53, 2 ** 53), { range: null }, { range: 5 });
  const server = await serve(theFileInParts);
  for (const { range } of NONE) {
    const words = `Not a range of bytes, so nothing was asked: ${range?.first} to ${range?.last} of `;
    const said = await refusal(getBytes(server.origin, '/tile.tif', { range }));
    assert.equal(said, `${words}${server.origin}/tile.tif`);
  }
  assert.deepEqual([NONE.length, server.asked], [10, []]);
});
await it('is still refused where the answer is an HTML page', async () => {
  const page = (_request, response) => response.writeHead(200, { 'content-type': 'text/html' });
  const server = await serve((request, response) => page(request, response).end('<html>No</html>'));
  const words = 'The service answered with an HTML page where data was expected';
  assert.equal(await refused(server, 0, 99), words);
});
await it('is not asked for again where the service redirects within itself', async () => {
  const server = await serve((request, response) => {
    if (request.url === '/tile.tif') response.writeHead(302, { location: '/new.tif' }).end();
    else theFileInParts(request, response);
  });
  assert.equal(
    await refused(server, 2, 5),
    'The service sends on to "/new.tif", and was not followed',
  );
  assert.deepEqual(server.asked, [{ url: '/tile.tif', ...ASKED }]);
});
await it('is held to MAX_BYTES where it is longer: a block of ten megabytes gets none', async () => {
  // A directory names a block of ten megabytes, and the service has it: refused by the length
  // that the part states, unread, and the server sees the client go.
  const [last, written] = [10 * MAX_BYTES - 1, []];
  const server = await serveUnended((response) => {
    const says = { 'content-range': `bytes 0-${last}/15969669`, 'content-length': last + 1 };
    written.push(response.writeHead(206, says).write(Buffer.alloc(4096)));
  });
  assert.equal(await refused(server, 0, last), tooLarge(1_048_576));
  await server.left;
  assert.deepEqual([MAX_BYTES, written.length], [1_048_576, 1]);
});

// A whole file.
await it('is asked for as before: without Range, and in whatever packing the service offers', async () => {
  const server = await serve((request, response) => {
    if (request.url !== '/data.json') return theFileInParts(request, response);
    return response.writeHead(200, { 'content-type': 'application/json' }).end('{}');
  });
  assert.deepEqual(await getBytes(server.origin, '/tile.tif'), FILE);
  assert.deepEqual(await getBytes(server.origin, '/tile.tif', { timeoutMs: 5000 }), FILE);
  assert.deepEqual(await getJson(server.origin, '/data.json'), {});
  for (const { range, names, packing, agent } of server.asked) {
    assert.equal([range, names, packing === 'identity', agent].join(), `,${HEADERS},false,node`);
  }
  assert.equal(server.asked.map((one) => one.url).join(' '), '/tile.tif /tile.tif /data.json');
});

// The stand-in for swisstopo, as a process of its own: asked at the addresses of hosts.js.
const standIn = spawn(process.execPath, [path.join(import.meta.dirname, 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const soon = { signal: globalThis.AbortSignal.timeout(20_000) };
const [, STAND_IN] = /^The stand-in for swisstopo: (\S+) - /.exec(
  await once(standIn.stdout, 'data', soon),
);
const at = (address) => address.slice(STAND_IN.length);
const same = (bytes, others) => Buffer.compare(bytes, others) === 0;
await it('is what the stand-in gives of a tile: its head, its end, and nothing beyond it', async () => {
  const name = tileName(2025, 2600, 1200);
  const [tile, file] = [at(fileAddress(STAND_IN, name)), fileOf(name)];
  const head = await getBytes(STAND_IN, tile, part(0, 16_383));
  assert.ok(head.length === 16_384 && same(head, file.subarray(0, 16_384)));
  const end = await getBytes(STAND_IN, tile, part(file.length - 10, file.length + 99));
  assert.ok(end.length === 10 && same(end, file.subarray(-10)));
  const answered = (status, target) => `The service answered ${status}: ${STAND_IN}${target}`;
  const beyond = getBytes(STAND_IN, tile, part(file.length, file.length + 99));
  assert.equal(await refusal(beyond), answered('416 Range Not Satisfiable', tile));
  // The file of an older state is not there; the one that is no tile comes as its part; and the
  // catalogue is read as JSON.
  const older = at(fileAddress(STAND_IN, tileName(2019, 2600, 1200)));
  const gone = await refusal(getBytes(STAND_IN, older, part(0, 16_383)));
  assert.equal(gone, answered('404 Not Found', older));
  const noTile = at(fileAddress(STAND_IN, tileName(2025, 2600, 1201)));
  const text = Buffer.from(await getBytes(STAND_IN, noTile, part(0, 16_383)));
  assert.equal(`${text}`, 'A made-up answer that is no tile.');
  assert.deepEqual(await getJson(STAND_IN, at(collectionAddress(STAND_IN))), collection(STAND_IN));
});
standIn.kill();

await Promise.all(servers.map(stopped));
assert.equal(cases, 14);
process.stdout.write(
  `tools/sketch/swisstopo: a part of a file is asked for with Range and nothing else of the pad's, and is that part or is refused - the whole file in its place, another part, a part longer than it may be - with the client gone before a whole tile is sent: ${cases} cases\n`,
);
