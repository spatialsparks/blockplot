// The pad's door (ST-031, rule 1; ST-041): the pad's one way of asking another machine - its
// server's today and, from T-041.3, the map's page's - and the one script of the two that calls
// `fetch` for it: named.check.js holds that. It imports nothing of Node, so that a page of the
// browser loads it as the server does, and asks as the server asks. A request goes to an origin
// that `mayAsk` of hosts.js takes - one of the three hosts of swisstopo over https, or a stand-in
// on this machine - and to no other: said before anything is sent. It is one GET, with no header
// but `Range` and nothing of the person's: no cookie, no referrer, no name - in a browser too.
//
// It is the parked product's plumbing, packages/adapters/src/geodata/http.ts, written anew as
// the pad's, and another door in three things. A redirect is never followed, to whatever host:
// it is refused, with where it pointed where that can be read - a browser hides it from a page.
// A part is a part: status 206, and saying so in `Content-Range` - or, where that cannot be read,
// as a page of another origin reads no header that the service does not expose, exactly as long
// as was asked. A service that sends the whole file in the place of a part is refused, and no
// whole tile is ever read. And an answer holds a megabyte at the most, or a part its own length,
// where the parked one takes 32 MiB. What each costs: the decision records that
// docs/sketch/swisstopo.md names.
//
// Every error ends with the address that was asked, and repeats no word of a service but quoted,
// cut and with every sign that could steer a terminal written out. A status is named by its
// number and by the words that Node has for that number, `STATUS_WORDS` of statuses.js, never by
// the service's own. door.check.js, door-parts.check.js, door-size.check.js and
// door-browser.check.js are its proof.
import { mayAsk } from './hosts.js';
import { STATUS_WORDS } from './statuses.js';

const { AbortSignal, TextDecoder, URL } = globalThis;

/** How long a service has to answer, body included, unless the request says otherwise. */
export const TIMEOUT_MS = 30_000;
// The longest that a clock of this machine waits: beyond it, a timer is set to a millisecond.
const LONGEST_MS = 2 ** 31 - 1;

/**
 * How many bytes an answer may hold, unless the request says otherwise: a megabyte, the largest
 * part of a tile that blocks.js asks for - a row of blocks, of 64 kB each at the most, is asked
 * in parts that each stay within it. A larger answer is refused, not read.
 */
export const MAX_BYTES = 1024 * 1024;

// The statuses that send a request on, and the one that says "a part" - the one thing of a part
// that a page of another origin can always read, with its length.
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const PART = 206;
// What a browser hands a page for an answer that sends on, under `redirect: 'manual'`: status 0,
// no header and no body, so that where it points cannot be read. Node hands the answer itself.
const UNSEEN_REDIRECT = 'opaqueredirect';
// What every request says beside its signal and its one header: no redirect left to the machine,
// which would ask the other place before anyone refused; and nothing of the person's - no cookie,
// no credentials, no referrer - which a browser would send unless told. Node sends none either way.
const HOW = Object.freeze({
  redirect: 'manual',
  credentials: 'omit',
  referrerPolicy: 'no-referrer',
});
// How far into an answer an HTML page has to have begun, to be told by its beginning.
const HTML_BEGINS_WITHIN_BYTES = 64;
// How much of a word of a service an error repeats: "bytes 0-16383/15969669" is 22.
const REPEATED_CHARACTERS = 80;

/**
 * A word of a service, as an error repeats it: its beginning, quoted, and every sign of it that
 * is no plain letter, figure or mark written out by its number - so none of it steers a terminal.
 */
const quoted = (word) =>
  JSON.stringify(word.slice(0, REPEATED_CHARACTERS)).replace(
    /[^\x20-\x7e]/g,
    (sign) => `\\u${sign.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );

// A count of bytes: a whole number from 0 on. And a time: one that a clock of this machine waits.
const isCount = (count) => Number.isSafeInteger(count) && count >= 0;
const isTime = (ms) => isCount(ms) && ms <= LONGEST_MS;
// A part of a file, `{ first, last }`: two bytes counted from 0, both of them included.
const isRange = (range) =>
  isCount(range?.first) && isCount(range?.last) && range.last >= range.first;

/**
 * Asks the service at `origin` for `target`, a path with its query, and reads the answer as JSON:
 * UTF-8, strictly. `options` are `{ timeoutMs, maxBytes }`, each in the place of its constant.
 */
export async function getJson(origin, target, options = {}) {
  const { address, body } = await get(origin, target, options);
  try {
    // Fatal: bytes that are not UTF-8 are refused, never replaced by a sign that fits.
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  } catch (cause) {
    throw new Error(`The service did not answer with JSON: ${address}`, { cause });
  }
}

/**
 * Asks the service at `origin` for `target`, and gives the answer byte for byte - or, with
 * `{ range: { first, last } }`, that part of the file, which is shorter than was asked for only
 * where the file ends before `last`: the caller counts what came. A part is held to its own
 * length, and to `MAX_BYTES` where it is longer than that, unless the request names `maxBytes`.
 */
export async function getBytes(origin, target, options = {}) {
  return (await get(origin, target, options)).body;
}

/**
 * The address that a request goes to - or the reason why nothing is asked: an origin that the
 * pad does not ask, or a target that is no path of that origin. A target begins with one `/`,
 * and stays with the origin when the two are put together as a link is: `//host/x` does not, and
 * neither does a slash that leans the other way.
 */
function addressOf(origin, target) {
  const url = typeof target === 'string' ? URL.parse(target, origin) : null;
  // As an address writes itself, no sign of it steers a terminal; and what is none is quoted.
  const address = url?.href ?? quoted(`${origin}${target}`);
  if (!mayAsk(origin)) {
    throw new Error(`Not a host that the pad asks, so nothing was asked: ${address}`);
  }
  if (!/^\/(?!\/)/.test(target) || url?.origin !== origin) {
    throw new Error(
      `A request stays with the service it is for, ${origin}, so nothing was asked: ${address}`,
    );
  }
  return url;
}

/** One GET: the body of an answer that the door takes, or an error that ends with the address. */
async function get(origin, target, options) {
  const url = addressOf(origin, target);
  const address = url.href;
  const { range } = options;
  if (range !== undefined && !isRange(range)) {
    throw new RangeError(
      `Not a range of bytes, so nothing was asked: ${range?.first} to ${range?.last} of ${address}`,
    );
  }
  const whole = range === undefined ? MAX_BYTES : range.last - range.first + 1;
  const maxBytes = options.maxBytes ?? Math.min(whole, MAX_BYTES);
  if (!isCount(maxBytes)) {
    throw new RangeError(
      `Not a number of bytes an answer may hold, so nothing was asked: ${maxBytes} for ${address}`,
    );
  }
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  if (!isTime(timeoutMs)) {
    throw new RangeError(
      `Not a time in milliseconds an answer may take, so nothing was asked: ${timeoutMs} for ${address}`,
    );
  }
  // With a `Range`, the machine itself asks for the file as it is stored, not for a packed copy:
  // a part is counted in the bytes of the file.
  const headers = range === undefined ? {} : { range: `bytes=${range.first}-${range.last}` };
  // One clock for the whole exchange: the answer's head, and its body to the last byte.
  const signal = AbortSignal.timeout(timeoutMs);
  let response;
  let body;
  try {
    response = await globalThis.fetch(url, { ...HOW, signal, headers });
    body = await readAtMost(response, maxBytes);
  } catch (cause) {
    const what = signal.aborted ? `did not answer within ${timeoutMs} ms` : 'could not be reached';
    throw new Error(`The service ${what}: ${address}`, { cause });
  }
  // Whatever its status: an error page and a redirect are held to the limit as data is.
  if (body === null) {
    throw new Error(
      `The service answered with more than ${maxBytes} bytes, the most this request takes: ${address}`,
    );
  }
  check(address, response, body);
  return { address, body: range === undefined ? body : partOf(address, response, body, range) };
}

/**
 * The body to its last byte - or null once it holds more than `maxBytes`, and no more of it is
 * read: before its first byte where it states a longer length, else at the first byte too many.
 * Then the connection is let go. A stated length is of the bytes as they are sent, packed where
 * a service packs them, so the bytes are counted as they are handed over, unpacked: a packed
 * answer may state a few and unpack to any number.
 */
async function readAtMost(response, maxBytes) {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel();
    return null;
  }
  if (response.body === null) return new Uint8Array();
  const reader = response.body.getReader();
  const pieces = [];
  let length = 0;
  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    length += read.value.length;
    if (length > maxBytes) {
      await reader.cancel();
      return null;
    }
    pieces.push(read.value);
  }
  const body = new Uint8Array(length);
  let at = 0;
  for (const piece of pieces) {
    body.set(piece, at);
    at += piece.length;
  }
  return body;
}

/**
 * Refuses an answer that is no data: one that sends on - with where to, where that can be read -
 * one that failed, and an HTML page.
 */
function check(address, response, body) {
  const { status, headers } = response;
  if (response.type === UNSEEN_REDIRECT) {
    throw new Error(`The service sends on elsewhere, and was not followed: ${address}`);
  }
  const where = REDIRECTS.has(status) ? headers.get('location') : null;
  if (where !== null) {
    throw new Error(`The service sends on to ${quoted(where)}, and was not followed: ${address}`);
  }
  if (!response.ok) {
    const named = [status, STATUS_WORDS[status]].filter((word) => word !== undefined).join(' ');
    throw new Error(`The service answered ${named}: ${address}`);
  }
  if (isHtml(headers.get('content-type'), body)) {
    throw new Error(`The service answered with an HTML page where data was expected: ${address}`);
  }
}

/** An HTML page, by what the service calls it or by how it begins: an error page sent as 200. */
function isHtml(contentType, body) {
  const mediaType = contentType?.split(';', 1)[0].trim().toLowerCase();
  if (mediaType === 'text/html' || mediaType === 'application/xhtml+xml') return true;
  const start = new TextDecoder().decode(body.subarray(0, HTML_BEGINS_WITHIN_BYTES));
  const begins = start.trimStart().toLowerCase();
  return begins.startsWith('<!doctype html') || begins.startsWith('<html');
}

/**
 * The part that was asked for, out of the answer to a request with a `Range` - or the reason why
 * the answer is none. A part has status 206. Where its `Content-Range` can be read - by Node, or
 * from a service that exposes it to a page - it says that the part begins at `first`, and the
 * part is as long as it says: to `last`, or to the end of the file where that comes first. Where
 * it cannot - a page of another origin reads no header that the service keeps from it, and
 * swisstopo exposes none - the part is held to its status and its length alone: exactly the bytes
 * asked for. A shorter one cannot be told from another part there, and is refused; so is one that
 * a browser unpacked, whose length is another. Any other answer that succeeded is the whole file,
 * which is never taken for a part.
 */
function partOf(address, response, body, range) {
  if (response.status !== PART) {
    throw new Error(`The service sent the whole file where a part was asked for: ${address}`);
  }
  const says = response.headers.get('content-range');
  const stated = /^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(says ?? '');
  const [first, last] = [Number(stated?.[1]), Number(stated?.[2])];
  const isThePart =
    says === null
      ? body.length === range.last - range.first + 1
      : first === range.first &&
        body.length === last - first + 1 &&
        // Shorter than was asked for only where the file ends: its length is the next byte's.
        (last === range.last || (last < range.last && Number(stated?.[3]) === last + 1));
  if (!isThePart) {
    const called = says === null ? 'nothing' : quoted(says);
    throw new Error(
      `The service answered with another part than bytes ${range.first} to ${range.last} - ${body.length} bytes, called ${called}: ${address}`,
    );
  }
  return body;
}
