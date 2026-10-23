// The stand-in for the three services of swisstopo (ST-031, rule 3): what every check and every
// browser test of a new plot asks in the place of the map service, the search and the downloads.
//
//   node tools/sketch/swisstopo/stand-in.js
//
// It listens on 127.0.0.1 and nowhere else - on PORT of the environment, and where none is named
// on a port that the operating system picks; named but empty is not named, as the pad has it -
// and says one line, with its address. A page is told it by ?asks=<its port> (hosts.js). It
// answers for all three hosts, each at the paths that hosts.js builds and at no path of its own
// making: a request is taken for what it asks only where hosts.js, handed the stand-in's own
// origin and the figures of the request, builds that very address. What it answers is the made-up
// world of made-up.js, and of its parcels made-up-parcels.js (ST-043): a parcel's search - with
// the pad's own limit alone - its find by an EGRID, and the parcel under a place; those two and
// parcels.js are loaded only where cadastre.js names a cadastre, and where it names none a parcel
// is a 404, as any address it does not know. It answers GET, and a page's preflight for one - an OPTIONS that asks for
// GET - as swisstopo answered the orchestrator's trial of 2026-10-20 (ST-041): every answer with
// Access-Control-Allow-Origin: *, a preflight with 204, GET and the one header that a page may
// send, Range; and no answer with Access-Control-Expose-Headers, so that a page of another origin
// reads no Content-Range of a part, as it reads none of swisstopo's. Any other method is refused
// with 405, and what it does not know is a 404. A request for the terrain - the
// catalogue or a file - is answered after 5 milliseconds, so that two that are sent at once are
// seen side by side. And at /asked it says what it was asked. stand-in.check.js is its proof.
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import process from 'node:process';
import { setTimeout } from 'node:timers';
import { URL } from 'node:url';
import { LAYERS, collectionAddress, fileAddress, itemsAddress } from './hosts.js';
import { searchAddress, tileAddress } from './hosts.js';
import { FILE_TYPE, collection, fileOf, itemsOf, pictureOf, placesFor } from './made-up.js';
import { CADASTRE } from './cadastre.js';

// The parcels' addresses and their made-up answers: the cadastre's, loaded where there is one.
const PARCELS = CADASTRE === null ? null : await import('./parcels.js');
const MADE_UP_PARCELS = CADASTRE === null ? null : await import('./made-up-parcels.js');

const HOST = '127.0.0.1';
// The last port that there is.
const LAST_PORT = 65_535;
// How long a request for the terrain waits for its answer, in milliseconds: long enough that a
// second request, sent at once with the first, comes before the first is answered.
const TERRAIN_MS = 5;
// Where the stand-in says what it was asked, and the word that has it forget.
const ASKED = '/asked';
const FORGET = '?forget';
// The types of its answers, and the three that are the same whatever was asked.
const [DATA, WORDS, PICTURE] = ['application/json', 'text/plain; charset=utf-8', 'image/svg+xml'];
const NOT_FOUND = [404, WORDS, 'The stand-in for swisstopo has nothing at this address.\n'];
const NO_METHOD = [405, WORDS, 'The stand-in for swisstopo is asked with GET.\n', { Allow: 'GET' }];
const NO_PART = [416, WORDS, 'The file ends before this part of it.\n'];
// A preflight's answer, with no type and no body: what a page may ask with - GET, and Range.
const ALLOWED = { 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'range' };
const PREFLIGHT = [204, null, null, ALLOWED];

/** What a request by a method that is no GET is answered with: a preflight for one, or 405. */
const otherThanGet = (method, header) =>
  method === 'OPTIONS' && header('access-control-request-method') === 'GET' ? PREFLIGHT : NO_METHOD;

/** The port that a text says - figures alone, 1 to 65535, as asks has it - or null: none. */
function portOf(text) {
  const port = /^\d+$/.test(text) ? Number(text) : 0;
  return port >= 1 && port <= LAST_PORT ? port : null;
}
// Named but empty is not named, and no port named is port 0: the operating system picks one.
const named = process.env.PORT || undefined;
const PORT = named === undefined ? 0 : portOf(named);
if (PORT === null) {
  process.stderr.write(`The stand-in for swisstopo did not start: PORT is "${named}", no port.\n`);
  process.exit(1);
}
// Its own origin, once it listens: what every address of hosts.js is built on.
let origin = null;

// Every request since it started or was told to forget, in their order; how many requests are
// not yet answered; and the files of the tiles, each written when it is first asked for.
let asked = [];
let open = 0;
const files = new Map();

/** A part of a file, as `Range` asks for it - or the whole file: no `Range`, or another form. */
function partOf(file, range) {
  if (file === null) return NOT_FOUND;
  const [first, last] = (/^bytes=(\d+)-(\d+)$/.exec(range ?? '') ?? []).slice(1).map(Number);
  if (first === undefined || first > last) return [200, FILE_TYPE, file];
  const whole = { 'Content-Range': `bytes */${file.length}` };
  if (first >= file.length) return [...NO_PART, whole];
  const end = Math.min(last, file.length - 1);
  const part = { 'Content-Range': `bytes ${first}-${end}/${file.length}` };
  return [206, FILE_TYPE, file.subarray(first, end + 1), part];
}

/**
 * What a request for a parcel is answered with - the status, the type and the body - or null: the
 * address is none of a parcel's.
 */
function parcelAnswerTo(address, query) {
  const { PARCELS_MOST, parcelAddress, parcelAtAddress, parcelSearchAddress } = PARCELS;
  const { parcelOf, parcelsAt, parcelsFor } = MADE_UP_PARCELS;
  const said = ({ status, type, body }) => [status, type, body];
  const words = query.get('searchText');
  if (parcelSearchAddress(origin, words) === address) return said(parcelsFor(words, PARCELS_MOST));
  if (parcelAddress(origin, words) === address) return said(parcelOf(words));
  const [e, n] = (query.get('geometry') ?? '').split(',').map(Number);
  if (parcelAtAddress(origin, { e, n }) === address) return said(parcelsAt({ e, n }));
  return null;
}

/**
 * What a request by GET is answered with - `{ sent, terrain }`: the status, the type, the body
 * and what the answer says beside them, and whether it is a request for the terrain. `target` is
 * the request's path and query as it came, `range` its `Range`, or null.
 */
function answerTo(target, range) {
  const address = `${origin}${target}`;
  if (!target.startsWith('/') || !URL.canParse(address)) return { sent: NOT_FOUND };
  const query = new URL(address).searchParams;
  // A picture of the map: the three figures that the address ends in, of the layer whose address
  // they make.
  const figures = (/\/(\d+)\/(\d+)\/(\d+)\.\w+$/.exec(target) ?? []).slice(1).map(Number);
  const isAt = (layer) => tileAddress(origin, layer, ...figures) === address;
  const layer = Object.keys(LAYERS).find(isAt);
  if (layer !== undefined) return { sent: [200, PICTURE, pictureOf(layer, ...figures)] };
  // A search: the address of its words, with whatever limit it names in the place of the pad's.
  const [words, limit] = [query.get('searchText'), query.get('limit') ?? ''];
  const search = /^\d+$/.test(limit) ? searchAddress(origin, words) : null;
  if (search?.replace(/\d+$/, limit) === address) {
    const { status, type, body } = placesFor(words, Number(limit));
    return { sent: [status, type, body] };
  }
  // A parcel: a search with the pad's own limit, its find by the EGRID, and the parcel under a
  // place - the figures of `geometry`, of which the address that they build holds two.
  const parcel = PARCELS === null ? null : parcelAnswerTo(address, query);
  if (parcel !== null) return { sent: parcel };
  // The terrain: the collection, the tiles by their names, and a tile's file.
  if (address === collectionAddress(origin)) {
    return { terrain: true, sent: [200, DATA, JSON.stringify(collection(origin))] };
  }
  const names = (query.get('ids') ?? '').split(',');
  if (address === itemsAddress(origin, names)) {
    return { terrain: true, sent: [200, DATA, JSON.stringify(itemsOf(origin, names))] };
  }
  const name = target.split('/')[2];
  if (address !== fileAddress(origin, name)) return { sent: NOT_FOUND };
  if (!files.has(name)) files.set(name, fileOf(name));
  return { terrain: true, sent: partOf(files.get(name), range) };
}

/** What a request at /asked is answered with: the list, and after `?forget` the empty one. */
function listed(method, target) {
  if (method !== 'GET') return NO_METHOD;
  if (target === `${ASKED}${FORGET}`) asked = [];
  else if (target !== ASKED) return NOT_FOUND;
  return [200, DATA, JSON.stringify(asked)];
}

const server = createServer((request, response) => {
  const { method, url: target } = request;
  // Every answer allows every origin, and exposes no header to it. One with no body - a
  // preflight's - says neither its type nor its length.
  const send = ([status, type, body, more = {}]) => {
    const allows = { 'Access-Control-Allow-Origin': '*', ...more };
    if (body === null) return response.writeHead(status, allows).end();
    const bytes = typeof body === 'string' ? Buffer.from(body) : body;
    const says = { ...allows, 'Content-Type': type, 'Content-Length': bytes.length };
    return response.writeHead(status, says).end(bytes);
  };
  // /asked is no part of its own list.
  if (target.split('?')[0] === ASKED) {
    send(listed(method, target));
    return;
  }
  // A header that did not come is null. `beside` is how many requests were not yet answered when
  // this one came: a request is answered once the stand-in has sent its answer.
  const header = (name) => request.headers[name] ?? null;
  const [range, referer, cookie] = ['range', 'referer', 'cookie'].map(header);
  asked.push({ method, target, range, referer, cookie, origin: header('origin'), beside: open });
  open += 1;
  const { sent, terrain } =
    method === 'GET' ? answerTo(target, range) : { sent: otherThanGet(method, header) };
  const answer = () => {
    open -= 1;
    send(sent);
  };
  if (terrain) setTimeout(answer, TERRAIN_MS);
  else answer();
});

server.on('error', (error) => {
  process.stderr.write(
    `The stand-in for swisstopo did not start on port ${PORT}. ${error.message}\n`,
  );
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => {
  origin = `http://${HOST}:${server.address().port}`;
  process.stdout.write(
    `The stand-in for swisstopo: ${origin} - made-up pictures, places and ground. Ctrl+C stops it.\n`,
  );
});
