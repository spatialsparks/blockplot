// What a browser shows a page of another origin of the answers that it asked for (ST-041), for
// the checks. Test support: no page and no module of the pad loads it - the checks do, as they
// load made-up-tile.js. It imports nothing.
//
// `asABrowser(ask)` takes a way of asking - the machine's own, or a check's - and gives one that
// asks by it and hands on each answer as Chromium hands it to a page of another origin, where the
// service says `Access-Control-Allow-Origin: *` and no `Access-Control-Expose-Headers`, as
// swisstopo answered the orchestrator's trial of 2026-10-20:
//
// - the headers cut to the ones that the Fetch standard lets every page read, the CORS-safelisted
//   response headers - so no `Content-Range`, and no `Location`;
// - an answer that sends on, asked for under `redirect: 'manual'`, as an answer of type
//   `opaqueredirect`: status 0, not ok, no header and no body - where it points is not shown;
// - an answer without `Access-Control-Allow-Origin` as no answer at all: the promise is rejected
//   with a `TypeError`, as a browser rejects a request that failed, and its body let go.
//
// What it does not show: the preflight, which the browser asks and the page never sees - the
// stand-in's answer to one is held in its own right - and a body that a browser unpacks. It
// calls what it is handed under a name of its own: named.check.js lets the word for the
// machine's way of asking stand in a few scripts alone.

/** The headers of an answer that a page of another origin may read, unexposed (Fetch). */
export const SAFELISTED = Object.freeze([
  'cache-control',
  'content-language',
  'content-length',
  'content-type',
  'expires',
  'last-modified',
  'pragma',
]);
// The statuses that send a request on, as the Fetch standard names them.
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
// What a page is told of a request that failed: Chromium's words.
const FAILED = 'Failed to fetch';

const { Headers, Response, TypeError } = globalThis;

/** An answer as a page sees one that sends on: what `Response.error()` is, of another type. */
function unseenRedirect() {
  const answer = Response.error();
  Object.defineProperty(answer, 'type', { value: 'opaqueredirect' });
  return answer;
}

/** The answer itself, with the headers that a page may read alone, of type `cors`. */
function cut(answer) {
  const headers = new Headers();
  for (const name of SAFELISTED) {
    const value = answer.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const { status, statusText } = answer;
  const seen = new Response(answer.body, { status, statusText, headers });
  Object.defineProperty(seen, 'type', { value: 'cors' });
  return seen;
}

/** A way of asking that asks by `ask`, and shows each answer as a page of another origin sees it. */
export function asABrowser(ask) {
  return async (to, how = {}) => {
    const answer = await ask(to, how);
    if (answer.headers.get('access-control-allow-origin') === null) {
      await answer.body?.cancel();
      throw new TypeError(FAILED);
    }
    if (how.redirect === 'manual' && REDIRECTS.has(answer.status)) {
      await answer.body?.cancel();
      return unseenRedirect();
    }
    return cut(answer);
  };
}
