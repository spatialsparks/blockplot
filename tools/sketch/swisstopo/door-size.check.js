// The check of how much an answer may hold, asked through the pad's door (ST-031): what door.js
// takes, and what it refuses before it is read to its end - an answer that states its length,
// one that states none, one that never ends, one that stalls, and a packed one, which states
// less than it sends. They are the cases of the parked product's http.size.test.ts,
// packages/adapters/src/geodata/, case for case where they hold of this door: its limit is
// MAX_BYTES, a megabyte, where the parked one is 32 MiB, and the whole file that a service sends
// in the place of a part is refused where the parked plumbing takes it. Every answer is made up
// here, and sent by a server of this check's own on 127.0.0.1, at a port that the system picked:
// nothing is written to a disk, and nothing leaves this machine.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import { createServer } from 'node:http';
import process from 'node:process';
import { clearInterval, clearTimeout, setInterval, setTimeout } from 'node:timers';
import { gzipSync } from 'node:zlib';
import { MAX_BYTES, getBytes, getJson } from './door.js';

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
/** A server of this check's own that answers as `answer` says, and keeps what it was asked. */
async function serve(answer) {
  const asked = [];
  const server = createServer((request, response) => {
    asked.push(request.url);
    answer(request, response);
  });
  servers.push(server);
  await once(server.listen(0, '127.0.0.1'), 'listening');
  return { origin: `http://127.0.0.1:${server.address().port}`, asked };
}
const stopped = (server) =>
  [once(server, 'close'), server.close(), server.closeAllConnections()][0];
/**
 * A server whose answer never ends of itself. `left` is over once the client has gone: a client
 * that read on to the end would wait for it until its time is up, 30 seconds. And it fails where
 * the client has not gone within three: an answer that is dropped unread, and not let go of, is
 * let go of only when the machine tidies up, some seconds on.
 */
async function serveUnended(begin) {
  const gone = Promise.withResolvers();
  const server = await serve((_request, response) => {
    const late = setTimeout(gone.reject, 3000, new Error('The client did not go within 3 s.'));
    response.once('close', () => gone.resolve(clearTimeout(late)));
    begin(response);
  });
  return { ...server, left: gone.promise };
}
/** What a request was refused with - or that it was not. */
const worded = (error) => error.message;
const refusal = (request) => request.then(() => 'no error', worded);
const tooLarge = (limit, address) =>
  `The service answered with more than ${limit} bytes, the most this request takes: ${address}`;
/** That a request is refused for its size, by either of the door's two ways of asking. */
async function tooLargeBoth(limit, origin, target, how) {
  for (const get of [getJson, getBytes]) {
    assert.equal(await refusal(get(origin, target, how)), tooLarge(limit, `${origin}${target}`));
  }
}
// The limit that most cases state: their answers are as long, a byte shorter, or a byte longer.
const LIMIT = 20_000;
const AT_MOST = { maxBytes: LIMIT };
/** Bytes that each say where they are, so that one out of place shows: 0, 1, ... 250, 0, 1, ... */
const madeUp = (length) => Uint8Array.from({ length }, (_, index) => index % 251);
/** A JSON text of this many bytes: one string. */
const jsonText = (length) => `"${'a'.repeat(length - 2)}"`;
/** Answers with these bytes, by what the request names as its length: /20000, /19999, /20001. */
const sized = (bytesOf) => (request, response) =>
  response.end(bytesOf(Number(request.url.slice(1))));
const same = async (request, bytes) => assert.equal(Buffer.compare(await request, bytes), 0);

// An answer that states its length.
await it('is handed over byte for byte as long as the limit, and a byte shorter', async () => {
  const { origin } = await serve(sized((length) => Buffer.from(madeUp(length))));
  await same(getBytes(origin, `/${LIMIT}`, AT_MOST), madeUp(LIMIT));
  await same(getBytes(origin, `/${LIMIT - 1}`, AT_MOST), madeUp(LIMIT - 1));
});
await it('a byte longer is refused with the address and the limit, and nothing of it', async () => {
  const { origin } = await serve(sized((length) => Buffer.from(madeUp(length))));
  const said = await refusal(getBytes(origin, `/${LIMIT + 1}`, AT_MOST));
  assert.equal(said, tooLarge(LIMIT, `${origin}/${LIMIT + 1}`));
});
await it('is held to the limit by getJson as well', async () => {
  const { origin } = await serve(sized(jsonText));
  assert.equal((await getJson(origin, `/${LIMIT}`, AT_MOST)).length, LIMIT - 2);
  await tooLargeBoth(LIMIT, origin, `/${LIMIT + 1}`, AT_MOST);
});
await it('longer than the limit is refused before a byte of it is read', async () => {
  // The head, and nothing after it: only the length that it states can refuse it. It stalls.
  const stalls = (response) =>
    response.writeHead(200, { 'content-length': LIMIT + 1 }).flushHeaders();
  const server = await serveUnended(stalls);
  await tooLargeBoth(LIMIT, server.origin, '/tile.tif', AT_MOST);
  await server.left;
});

// An answer that states no length.
await it('is counted as it comes: as long as the limit is taken, a byte longer refused', async () => {
  // A piece at a time: written all at once, the pieces would reach the client as one.
  const inPieces = (response, body, first = 0) => {
    if (response.destroyed) return response;
    if (first >= body.length) return response.end();
    response.write(body.subarray(first, first + 3000));
    return setTimeout(() => inPieces(response, body, first + 3000), 1);
  };
  const { origin } = await serve((request, response) => {
    response.writeHead(200, { 'content-type': 'application/octet-stream' });
    inPieces(response, madeUp(Number(request.url.slice(1))));
  });
  await same(getBytes(origin, `/${LIMIT}`, AT_MOST), madeUp(LIMIT));
  const said = await refusal(getBytes(origin, `/${LIMIT + 1}`, AT_MOST));
  assert.equal(said, tooLarge(LIMIT, `${origin}/${LIMIT + 1}`));
});
await it('that never ends is refused once it passes the limit, and is not read on', async () => {
  const server = await serveUnended((response) => {
    const sending = setInterval(() => response.destroyed || response.write(madeUp(16_384)), 1);
    response.writeHead(200).once('close', () => clearInterval(sending));
  });
  await tooLargeBoth(LIMIT, server.origin, '/endless', AT_MOST);
  await server.left;
});

// An answer that states less than it sends. Packed: the length that it states is of the packed
// bytes, and the machine hands them over unpacked.
const packedHead = (bytes) => ({ 'content-encoding': 'gzip', 'content-length': bytes.length });
await it('is counted unpacked: as long as the limit is taken, a byte longer refused', async () => {
  const { origin } = await serve((request, response) => {
    const bytes = gzipSync(madeUp(Number(request.url.slice(1))));
    response.writeHead(200, packedHead(bytes)).end(bytes);
  });
  await same(getBytes(origin, `/${LIMIT}`, AT_MOST), madeUp(LIMIT));
  const said = await refusal(getBytes(origin, `/${LIMIT + 1}`, AT_MOST));
  assert.equal(said, tooLarge(LIMIT, `${origin}/${LIMIT + 1}`));
});
await it('is refused once it unpacks past the limit, and the rest is not read', async () => {
  const bytes = gzipSync(madeUp(1024 * 1024));
  assert.ok(bytes.length < LIMIT);
  // A quarter of what it states, which unpacks to more than the limit - and then nothing.
  const server = await serveUnended((response) => {
    response
      .writeHead(200, packedHead(bytes))
      .write(bytes.subarray(0, Math.floor(bytes.length / 4)));
  });
  await tooLargeBoth(LIMIT, server.origin, '/packed', AT_MOST);
  await server.left;
});

// The limit.
await it('is MAX_BYTES, a megabyte, where the request states none', async () => {
  assert.equal(MAX_BYTES, 1024 * 1024);
  const server = await serve((request, response) => {
    const over = request.url === '/over';
    response.writeHead(200, { 'content-length': MAX_BYTES + Number(over) });
    if (over) response.flushHeaders();
    else response.end(new Uint8Array(MAX_BYTES));
  });
  assert.equal((await getBytes(server.origin, '/at')).length, MAX_BYTES);
  await tooLargeBoth(MAX_BYTES, server.origin, '/over');
});
await it('that is no number of bytes is refused, and nothing is asked', async () => {
  const server = await serve((_request, response) => response.end('{}'));
  for (const maxBytes of [Number.NaN, Infinity, -1, 0.5, 2 ** 53, '5']) {
    const words = `Not a number of bytes an answer may hold, so nothing was asked: ${maxBytes} for `;
    for (const get of [getJson, getBytes]) {
      const said = await refusal(get(server.origin, '/x', { maxBytes }));
      assert.equal(said, `${words}${server.origin}/x`);
    }
  }
  assert.deepEqual(server.asked, []);
});
await it('may be no bytes at all', async () => {
  const { origin } = await serve((request, response) => {
    if (request.url === '/x') response.end('x');
    // 204: an answer that has no body at all, where the others have one of no bytes.
    else response.writeHead(request.url === '/none' ? 204 : 200).end();
  });
  const none = { maxBytes: 0 };
  assert.deepEqual(await getBytes(origin, '/nothing', none), new Uint8Array());
  assert.deepEqual(await getBytes(origin, '/none', none), new Uint8Array());
  assert.equal(await refusal(getBytes(origin, '/x', none)), tooLarge(0, `${origin}/x`));
});
await it('holds a part as well - and the whole file in its place is no part, whatever it holds', async () => {
  const file = madeUp(16);
  const { origin } = await serve((request, response) => {
    if (request.url === '/whole.tif') response.writeHead(200).end(file);
    else response.writeHead(206, { 'content-range': 'bytes 2-5/16' }).end(file.subarray(2, 6));
  });
  const range = { first: 2, last: 5 };
  const asked = (target, maxBytes) => refusal(getBytes(origin, target, { range, maxBytes }));
  // A part is held to its own length where the request names no limit, and else to that limit.
  await same(getBytes(origin, '/part.tif', { range }), file.subarray(2, 6));
  await same(getBytes(origin, '/part.tif', { range, maxBytes: 4 }), file.subarray(2, 6));
  assert.equal(await asked('/part.tif', 3), tooLarge(3, `${origin}/part.tif`));
  // The whole file: refused for its size where the limit is less, and for what it is where not.
  assert.equal(await asked('/whole.tif'), tooLarge(4, `${origin}/whole.tif`));
  assert.equal(await asked('/whole.tif', 15), tooLarge(15, `${origin}/whole.tif`));
  const whole = `The service sent the whole file where a part was asked for: ${origin}/whole.tif`;
  assert.equal(await asked('/whole.tif', 16), whole);
});
await it('holds an answer whatever its status: a redirect, or an error page, longer is refused', async () => {
  const { origin, asked } = await serve((request, response) => {
    const body = madeUp(Number(request.url.slice(-5)));
    if (request.url.startsWith('/moved'))
      response.writeHead(302, { location: '/elsewhere' }).end(body);
    else response.writeHead(404).end(body);
  });
  await tooLargeBoth(LIMIT, origin, `/moved/${LIMIT + 1}`, AT_MOST);
  await tooLargeBoth(LIMIT, origin, `/gone/${LIMIT + 1}`, AT_MOST);
  // One that the limit holds is named by what it is - and so, held to a part's own length, an
  // error page that is longer than the part is refused for its size, and its status is not said.
  const gone = `The service answered 404 Not Found: ${origin}/gone/${LIMIT}`;
  assert.equal(await refusal(getBytes(origin, `/gone/${LIMIT}`, AT_MOST)), gone);
  const part = { range: { first: 0, last: 9_999 } };
  const said = await refusal(getBytes(origin, `/gone/${LIMIT}`, part));
  assert.equal(said, tooLarge(10_000, `${origin}/gone/${LIMIT}`));
  assert.equal(asked.length, 6);
});

await Promise.all(servers.map(stopped));
assert.equal(cases, 13);
process.stdout.write(
  `tools/sketch/swisstopo: an answer holds a megabyte at the most, or what its request states, and a larger one is refused before it is read to its end - by the length it states, and else at the first byte too many, unpacked - with the client gone: ${cases} cases\n`,
);
