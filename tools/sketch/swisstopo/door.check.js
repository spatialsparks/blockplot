// The check of the pad's door (ST-031, rule 1): door.js on servers of this check's own, each on
// 127.0.0.1 at a port that the system picked - whom it asks and whom it does not, what it takes
// for an answer, a redirect, and a service that does not answer. They are the cases of the parked
// product's http.test.ts, packages/adapters/src/geodata/, case for case where they hold of this
// door: where a parked case follows a redirect, this door refuses it, and a status is named in
// Node's words, never in the service's. Nothing here leaves this machine. Where a request must
// not be sent, or names one of the three hosts, an answer stands in the place of the machine's
// `fetch`: what is "sent" is noted, and goes nowhere - and the gate is loaded first, however this
// check is run. A host is taken from HOSTS, and what is no host of the pad's is put together: no
// host is typed here (named.check.js). A part of a file is door-parts.check.js's, and the size
// of an answer door-size.check.js's.
import '../offline.js';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import { createServer } from 'node:http';
import process from 'node:process';
import { MAX_BYTES, TIMEOUT_MS, getBytes, getJson } from './door.js';
import { HOSTS, collectionAddress, searchAddress } from './hosts.js';

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
const stopServers = () => Promise.all(servers.splice(0).map(stopped));
const answers =
  (status, headers, body = '') =>
  (_request, response) =>
    response.writeHead(status, headers).end(body);
/** What a request was refused with - or that it was not. */
const refusal = (request) =>
  request.then(
    () => 'no error',
    (error) => error.message,
  );
/** That the door refuses a request in these words, by either of its two ways of asking. */
async function refuses(words, origin, target, how) {
  for (const get of [getJson, getBytes]) {
    assert.equal(await refusal(get(origin, target, how)), words, `${origin} ${target}`);
  }
}
const { Response, URL } = globalThis;
const JSON_TYPE = { 'content-type': 'application/json' };
const json = (value) => new Response(JSON.stringify(value), { headers: JSON_TYPE });
/** An answer in the place of the machine's `fetch`, until `back()`: what was to be sent, noted. */
function insteadOfFetch(answer = () => json({})) {
  const [machines, sent] = [globalThis.fetch, []];
  globalThis.fetch = (to, how) => Promise.resolve(answer(sent.push({ to: String(to), how })));
  return { sent, back: () => (globalThis.fetch = machines) };
}
const to = (sent) => sent.map((one) => one.to);
// A host that the pad does not ask, put together here; and the three as origins.
const other = (host, scheme = 'https') => `${scheme}://${host}`;
const [MAP_AT, SEARCH_AT, TERRAIN_AT] = Object.values(HOSTS).map((host) => `https://${host}`);
const NOT_ASKED = 'Not a host that the pad asks, so nothing was asked: ';
const STAYS = `A request stays with the service it is for, ${SEARCH_AT}, so nothing was asked: `;
const sign = (number) => String.fromCharCode(number);

// The hosts that may be asked.
await it('are a list that nothing adds to while the pad runs', () => {
  assert.ok(Object.isFrozen(HOSTS) && Object.keys(HOSTS).length === 3);
});
await it('include each of the three, over https, with no redirect left to the machine', async () => {
  const { sent, back } = insteadOfFetch(() => json({ height: '555.5' }));
  for (const origin of [MAP_AT, SEARCH_AT, TERRAIN_AT]) {
    assert.deepEqual(await getJson(origin, '/rest/height?sr=2056'), { height: '555.5' });
    // One GET, with no header and nothing of the person's, in a browser too, under the one clock.
    const { to: asked, how } = sent.pop();
    assert.equal(asked, `${origin}/rest/height?sr=2056`);
    const asks = { redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer' };
    assert.deepEqual({ ...how, signal: 0 }, { ...asks, headers: {}, signal: 0 });
    assert.ok(how.signal instanceof globalThis.AbortSignal);
  }
  back();
});
await it('leave out every other: it throws, and nothing is sent', async () => {
  // A fourth host; one that only begins like one of the three, or only ends like it; one of the
  // three that is only a user name, without https, by another protocol, on another port; this
  // machine under another name, at another address, over https, with no port; and a file.
  const [search, none] = [HOSTS.search, [other('example.org')]];
  none.push(other(`${search}.example.org`), other(`x${search}`), other(`${search}@example.org`));
  none.push(other(search, 'http'), other(search, 'ftp'), other(`${search}:8443`));
  none.push(other('localhost:8080', 'http'), other('127.0.0.2:8080', 'http'));
  none.push('https://127.0.0.1:8443', 'http://127.0.0.1', 'file:///C:/site.json');
  const { sent, back } = insteadOfFetch();
  for (const origin of none)
    await refuses(`${NOT_ASKED}${new URL('/x', origin).href}`, origin, '/x');
  // And what is no address at all, or no text: quoted, for no address writes itself of it - with
  // a sign of it that is no plain one, 127, by its number.
  const words = `${NOT_ASKED}"the height service/height\\u007f"`;
  await refuses(words, 'the height service', `/height${sign(0x7f)}`);
  await refuses(`${NOT_ASKED}"undefined/x"`, undefined, '/x');
  assert.deepEqual([none.length, back(), sent], [12, globalThis.fetch, []]);
});
await it('leave out a link that leaves the service the request is for', async () => {
  const { sent, back } = insteadOfFetch();
  // A whole address of another of the three; a path with two slashes, which names a host; and a
  // slash that leans the other way, which a link takes for the second of two. Then what stays,
  // and is no path that begins with one slash: a whole address of the service itself, with its
  // host alone, a name, a query alone, and nothing. And what is no text, or no address.
  const leave = [`${TERRAIN_AT}/t.tif`, '//example.org/t.tif', '/\\example.org/t.tif'];
  const stay = [`${SEARCH_AT}/t.tif`, `//${HOSTS.search}/t.tif`, 't.tif', '?x=1', ''];
  for (const target of [...leave, ...stay]) {
    const address = new URL(target, SEARCH_AT);
    assert.equal(address.origin === SEARCH_AT, stay.includes(target), target);
    await refuses(`${STAYS}${address.href}`, SEARCH_AT, target);
  }
  for (const target of [undefined, null, 5, other('[/height')]) {
    await refuses(`${STAYS}"${SEARCH_AT}${target}"`, SEARCH_AT, target);
  }
  assert.deepEqual([back(), sent], [globalThis.fetch, []]);
});
await it('include a path at the service, with its query, as hosts.js builds one', async () => {
  const { sent, back } = insteadOfFetch();
  const built = [collectionAddress(TERRAIN_AT), searchAddress(SEARCH_AT, 'Bern & more')];
  await getJson(TERRAIN_AT, built[0].slice(TERRAIN_AT.length));
  await getJson(SEARCH_AT, built[1].slice(SEARCH_AT.length));
  await getBytes(TERRAIN_AT, '/ch.swisstopo.swissalti3d/tile.json?v=2');
  assert.deepEqual(to(sent), [...built, `${TERRAIN_AT}/ch.swisstopo.swissalti3d/tile.json?v=2`]);
  back();
});
await it('are not left for another one of them by a redirect', async () => {
  const location = `${TERRAIN_AT}/elsewhere`;
  const moved = () => new Response(null, { status: 302, headers: { location } });
  const { sent, back } = insteadOfFetch(moved);
  const words = `The service sends on to "${location}", and was not followed: ${SEARCH_AT}/moved`;
  assert.equal(await refusal(getJson(SEARCH_AT, '/moved')), words);
  assert.deepEqual([back(), to(sent)], [globalThis.fetch, [`${SEARCH_AT}/moved`]]);
});

// An answer.
await it('is read as JSON', async () => {
  const text = `{"name":"K${sign(0xf6)}niz","heights":[1.5,null]}`;
  const server = await serve(answers(200, JSON_TYPE, text));
  const read = await getJson(server.origin, '/data?x=1');
  assert.deepEqual(read, { name: `K${sign(0xf6)}niz`, heights: [1.5, null] });
  assert.deepEqual(server.asked, ['/data?x=1']);
});
await it('is handed over byte for byte', async () => {
  const bytes = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff);
  // It names a place, as an answer may that sends nobody on: it is data all the same.
  const says = { 'content-type': 'image/png', location: '/elsewhere' };
  const server = await serve(answers(200, says, bytes));
  assert.deepEqual(await getBytes(server.origin, '/image'), bytes);
});
await it('with a status that is not of the 200s is an error that names the address', async () => {
  const STATUSES = ['404 Not Found', '500 Internal Server Error', '304 Not Modified'];
  for (const status of [...STATUSES, '416 Range Not Satisfiable', '204 No Content']) {
    const body = status.startsWith('304') || status.startsWith('204') ? '' : '{"detail":"no"}';
    const { origin } = await serve(answers(Number.parseInt(status, 10), JSON_TYPE, body));
    const words = `The service answered ${status}: ${origin}/data`;
    if (!status.startsWith('204')) await refuses(words, origin, '/data');
    else assert.deepEqual(await getBytes(origin, '/data'), new Uint8Array());
  }
});
await it('is named in words of the door, never of the service - or by the number alone', async () => {
  // A service that says another thing of its 404, with a sign that steers a terminal in it; and
  // a status that Node has no words for.
  const server = await serve((request, response) => {
    if (request.url === '/own') response.writeHead(404, `Gone fishing ${sign(0x9b)}[2J`).end();
    else response.writeHead(599).end();
  });
  await refuses(`The service answered 404 Not Found: ${server.origin}/own`, server.origin, '/own');
  await refuses(`The service answered 599: ${server.origin}/none`, server.origin, '/none');
});
await it('that is an HTML page is an error with status 200, not data', async () => {
  // Called HTML, called XHTML, and beginning as HTML whatever it is called - within 64 bytes.
  const PAGES = { 'text/html ; charset=utf-8': '<p>Maintenance</p>' };
  PAGES['text/plain'] = `${' '.repeat(59)}<html>`;
  PAGES['Application/XHTML+XML'] = '<p>Maintenance</p>';
  PAGES['application/json'] = '\n <!DOCTYPE HTML><html></html>';
  PAGES['application/octet-stream'] = '<html>';
  for (const [type, page] of Object.entries(PAGES)) {
    const { origin } = await serve(answers(200, { 'content-type': type }, page));
    const words = 'The service answered with an HTML page where data was expected: ';
    await refuses(`${words}${origin}/data`, origin, '/data');
  }
});
await it('that is neither HTML nor what was asked for is the reader’s to refuse', async () => {
  // A report in XML; and a page that has not begun as HTML within its first 64 bytes.
  const late = `${' '.repeat(60)}<html>`;
  for (const body of ['<?xml version="1.0"?><ServiceExceptionReport/>', late]) {
    const server = await serve(answers(200, { 'content-type': 'text/xml' }, body));
    assert.equal(`${Buffer.from(await getBytes(server.origin, '/map'))}`, body);
  }
});
await it('that is no JSON is an error for getJson', async () => {
  // A text that is none, nothing at all, and JSON that is not UTF-8.
  for (const body of [Buffer.from('height: 555.5'), Buffer.alloc(0), Buffer.of(0x22, 0xe4, 0x22)]) {
    const server = await serve(answers(200, JSON_TYPE, body));
    const words = `The service did not answer with JSON: ${server.origin}/data`;
    assert.equal(await refusal(getJson(server.origin, '/data')), words);
    assert.equal(Buffer.compare(await getBytes(server.origin, '/data'), body), 0);
  }
});

// A redirect: where the parked plumbing follows one within its service, this door follows none.
await it('within the service is refused, with where it pointed, and the place is not asked', async () => {
  for (const status of [301, 302, 303, 307, 308]) {
    const server = await serve((request, response) => {
      if (request.url === '/old') response.writeHead(status, { location: '/new?x=1' }).end();
      else response.writeHead(200, JSON_TYPE).end('{"moved":true}');
    });
    const words = `The service sends on to "/new?x=1", and was not followed: ${server.origin}/old`;
    await refuses(words, server.origin, '/old');
    assert.deepEqual(server.asked, ['/old', '/old']);
  }
});
await it('to another host is an error, and the other host is not asked', async () => {
  const elsewhere = await serve(answers(200, JSON_TYPE, '{}'));
  const location = `${elsewhere.origin}/elsewhere`;
  const server = await serve(answers(307, { location }));
  const words = `The service sends on to "${location}", and was not followed: ${server.origin}/moved`;
  assert.equal(await refusal(getBytes(server.origin, '/moved')), words);
  assert.deepEqual([server.asked, elsewhere.asked], [['/moved'], []]);
});
await it('that never ends is asked once; its place is quoted, cut and written out', async () => {
  const again = await serve(answers(301, { location: '/again' }));
  assert.match(
    await refusal(getJson(again.origin, '/again')),
    /^The service sends on to "\/again", /,
  );
  assert.equal(again.asked.length, 1);
  // Eighty characters of a hundred; a quote, and signs that are no plain ones, each by its number.
  const places = { ['x'.repeat(100)]: 'x'.repeat(80) };
  places[`/a"${sign(0x9b)}[2J\t${sign(0xfc)}`] = '/a\\"\\u009b[2J\\t\\u00fc';
  for (const [location, written] of Object.entries(places)) {
    const { origin } = await serve(answers(302, { location }));
    const words = `The service sends on to "${written}", and was not followed: ${origin}/x`;
    await refuses(words, origin, '/x');
  }
  // And one that names no place is named by its status, as every answer that failed.
  const nowhere = await serve(answers(302, {}));
  await refuses(`The service answered 302 Found: ${nowhere.origin}/x`, nowhere.origin, '/x');
});

// A service that does not answer.
await it('at all, or to the end, in time is an error that names the address and the time', async () => {
  const server = await serve((request, response) => {
    if (request.url === '/half') response.writeHead(200, JSON_TYPE).write('{"half":');
  });
  for (const target of ['/never', '/half']) {
    const words = `The service did not answer within 60 ms: ${server.origin}${target}`;
    assert.equal(await refusal(getJson(server.origin, target, { timeoutMs: 60 })), words);
  }
});
await it('has TIMEOUT_MS, unless the request says otherwise - a time that a clock waits', async () => {
  const [clocks, times] = [globalThis.AbortSignal, []];
  const machines = clocks.timeout;
  clocks.timeout = (ms) => machines.call(clocks, ms, times.push(ms));
  const server = await serve(answers(200, JSON_TYPE, '{}'));
  await getJson(server.origin, '/data');
  await getBytes(server.origin, '/data', { timeoutMs: 1234 });
  clocks.timeout = machines;
  assert.deepEqual([TIMEOUT_MS, MAX_BYTES, times], [30_000, 1_048_576, [30_000, 1234]]);
  // What is no time is refused, and nothing is asked: beyond 2^31 a clock would wait a millisecond.
  for (const timeoutMs of [Number.NaN, Infinity, -1, 0.5, 2 ** 31, '60']) {
    const words = `Not a time in milliseconds an answer may take, so nothing was asked: ${timeoutMs} for `;
    await refuses(`${words}${server.origin}/x`, server.origin, '/x', { timeoutMs });
  }
  await getJson(server.origin, '/last', { timeoutMs: 2 ** 31 - 1 });
  assert.deepEqual(server.asked, ['/data', '/data', '/last']);
});
await it('because it is not there is an error that names the address', async () => {
  const server = await serve(answers(200, JSON_TYPE, '{}'));
  await stopServers();
  const failed = await getJson(server.origin, '/data').catch((error) => error);
  assert.equal(failed.message, `The service could not be reached: ${server.origin}/data`);
  assert.ok(failed.cause instanceof Error);
});

await stopServers();
assert.equal(cases, 19);
process.stdout.write(
  `tools/sketch/swisstopo: the pad's door asks the three hosts and a stand-in, and no other - nothing is sent for another origin or for a target that leaves its service - follows no redirect, names a status in its own words and says what did not answer, with the address: ${cases} cases\n`,
);
