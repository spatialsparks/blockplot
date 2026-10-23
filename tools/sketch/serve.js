// The sketch pad's pages as plain files on this machine (ST-040, ST-041): its pages, scripts and
// stylesheets, and three.js for its 3D page under three/ - served to the browser on one port of
// 127.0.0.1 and to nobody else. It is a plain file server, and any other that holds the pad's
// folder and three/ serves the same pages: no plot is the server's - a page gets its plot from
// the browser (boot.js) - it makes none - New plot makes a plot in the page (map/make.js) - and it
// keeps no sketch: Keep keeps in the browser, or in a plot's folder that the browser was given. It
// reads nothing but the pad's own files, and writes nothing. From the repository root: pnpm
// sketch - or, on the made-up plot and on a port of its own, pnpm sketch --demo. Which path gets
// which file, in which mode and on which port, is said in routes.js.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { HOST, route, setting } from './routes.js';

// Never from a cache, so that a change shows on reload; and for this page alone: no other
// site's page may load a file of the pad, or show the pad in a frame.
const HEADERS = {
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};
const WORDS = 'text/plain; charset=utf-8';
const as = (type) => ({ 'Content-Type': type });
const ALONE = 'The sketch pad is for its own page alone.\n';
const NONE = [404, {}, 'No such file.\n'];

const { demo: DEMO, port: PORT, refused } = setting(process.argv.slice(2), process.env);
if (refused !== undefined) {
  process.stderr.write(`The sketch pad did not start: ${refused}\n`);
  process.exit(1);
}
const ORIGIN = `http://${HOST}:${PORT}`;

/**
 * The answer that the rule gives a path, from this folder on: a file, nothing where it gives
 * none, and an answer with no body where it gives one - the made-up pad's map's page.
 */
async function fileOf(given) {
  if (given === null) return NONE;
  if (given.status !== undefined) return [given.status, {}, ''];
  const content = await readFile(path.join(import.meta.dirname, given.file)).catch(() => null);
  return content === null ? NONE : [200, as(given.type), content];
}

const server = createServer((request, response) => {
  const send = (status, headers, body) => {
    response.writeHead(status, { ...HEADERS, ...headers });
    response.end(body);
  };
  const { host, 'sec-fetch-site': site, 'sec-fetch-mode': mode } = request.headers;
  // Asked for as localhost: the same pad, at the one address its sketch is kept under.
  if (host === `localhost:${PORT}`) return send(302, { Location: `${ORIGIN}${request.url}` });
  // Under any other name the request was sent by a page that should not have this machine's
  // files; so was one a page of another site makes, unless it only opens the pad. A file is
  // given by GET alone.
  const elsewhere = site !== undefined && site !== 'same-origin' && site !== 'none';
  const notItsPage = (elsewhere && mode !== 'navigate') || request.method !== 'GET';
  if (host !== `${HOST}:${PORT}` || notItsPage) return send(403, {}, ALONE);
  return fileOf(route(request.url, DEMO)).then(
    ([status, headers, body]) => send(status, headers, body),
    (error) => send(500, as(WORDS), `The pad's server failed: ${error.message}\n`),
  );
});

server.on('error', (error) => {
  const taken = error.code === 'EADDRINUSE' ? ': the pad may be running already' : '';
  process.stderr.write(`The sketch pad did not start on port ${PORT}${taken}. ${error.message}\n`);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => {
  const madeUp = DEMO ? ', on the made-up plot' : '';
  process.stdout.write(`The sketch pad${madeUp}: ${ORIGIN} - Ctrl+C stops it.\n`);
});
