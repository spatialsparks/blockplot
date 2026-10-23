// The check of the page of a new plot (ST-031), with no browser. Of the page, the text: every
// script a module named by `src`, every stylesheet a file, no script, no style and no handler
// written into a tag, no word of an address - and its parts by their ids, each once - and the
// page's own policy (ST-041, T-041.2): its two <meta> of the head to the letter, no referrer
// and a first policy that names no host. Every file that the page and its scripts name, read
// off their text, on the disk. Then page.js, on a made-up page that keeps what it is told and at
// an address of the check's own: whom the page asks, by that address - swisstopo, a stand-in,
// nobody - each in its line, to the letter, with nothing asked to know it; the policy that it
// puts into its head, and that its text puts it there before it opens the map; and a page that
// asks nobody opens no map, no Find and no marking. No server is started: none tells the page
// anything now. What the page does in a browser is tests/e2e/sketch-map.spec.ts's. Nothing of
// design/ is read. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { HOST, MAP_PAGE } from '../routes.js';
import { CADASTRE } from '../swisstopo/cadastre.js';
import { HOSTS, SEARCH_MAX, policyOf } from '../swisstopo/hosts.js';

const PAD = path.join(import.meta.dirname, '..');
const onDisk = (name) => fs.readFileSync(path.join(PAD, name), 'utf8');
const PAGE = onDisk(MAP_PAGE);
const count = (text, pattern) => (text.match(pattern) ?? []).length;

// Of the page, the text. Every script is a module that is named by `src`, a file of this folder
// in small letters, with nothing written into its tag: one, page.js, which loads the others.
const scripts = Array.from(PAGE.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g));
assert.deepEqual(
  scripts.map(([, said, held]) => [said.trim(), held]),
  [['type="module" src="page.js"', '']],
);
assert.equal(count(PAGE, /<script\b/gi), scripts.length);
// Every stylesheet is a file: the frame that the pad's pages share, then this page's own - and
// not the small drawings, which are pictures written out as data.
const sheets = Array.from(PAGE.matchAll(/<link\b([^>]*)\/>/g), ([, said]) => said.trim());
assert.deepEqual(sheets, [
  'rel="stylesheet" href="../frame.css"',
  'rel="stylesheet" href="map.css"',
]);
assert.equal(count(PAGE, /<link\b/gi), sheets.length);
// The page's own policy (T-041.2), for a plain file server sends no header: in its head, before
// all else that is asked, no referrer, and a first policy that names no host - in force from the
// first byte. page.js puts the second in beside it.
const metas = Array.from(PAGE.matchAll(/<meta\b([^>]*)\/>/g), ([, said]) =>
  said.replace(/\s+/g, ' ').trim(),
);
const FIRST =
  "script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
const META = ['charset="utf-8"', 'name="referrer" content="no-referrer"'];
META.push(`http-equiv="Content-Security-Policy" content="${FIRST}"`);
assert.deepEqual([metas, count(PAGE, /<meta\b/gi)], [META, 3]);
assert.ok(
  PAGE.indexOf('<meta') < PAGE.indexOf('<link') &&
    PAGE.indexOf('</head>') > PAGE.lastIndexOf('<meta'),
);
// No style and no handler is written into a tag, no script is, and nothing names an address:
// the policy would refuse the first three, and the fourth is hosts.js's to build. The one `http`
// of the page is the name of the policy's attribute.
const NONE_IN = [/<style\b/i, /\sstyle\s*=/i, /\son\w+\s*=/i, /javascript:/i, /http(?!-equiv=)/i];
for (const none of [...NONE_IN, /\/\//]) {
  assert.ok(!none.test(PAGE), `${none}`);
}
// Its parts, each once: the way back, Find, the places, the map with what lies on it - the word
// of plain ground first, then the marks of the plot, over it and under all else - the plot's
// side, the parcel's part at its top (ST-043) - the cadastre's, hidden until page.js shows it -
// with what is said and pressed there, and the line of what the page asks.
const IDS = ['back', 'find', 'find-words', 'work', 'found', 'find-said', 'places', 'map', 'tiles'];
IDS.push('plain', 'marks', 'sheet', 'outline', 'along', 'dots');
IDS.push('said', 'photo', 'steps', 'nearer', 'further', 'credits', 'plot');
IDS.push('parcel-part', 'parcel', 'parcel-words', 'take-parcel', 'parcel-said', 'parcels');
IDS.push('corners-said', 'no-survey', 'undo-corner', 'start-again');
IDS.push('paper-said', 'side-before', 'side-next', 'around');
IDS.push('naming', 'name', 'folder', 'make', 'make-said', 'asks');
const ids = Array.from(PAGE.matchAll(/\sid="([^"]+)"/g), ([, id]) => id);
assert.deepEqual(ids, IDS);
assert.ok(PAGE.includes('<a id="back" href="../">Back to the pad</a>'));
// The word of plain ground (T-031.8), to the letter: a paragraph, its id alone in its tag.
const PLAIN =
  'Plain ground? The cadastral map has no picture here, or is not answering: the aerial photo shows the same ground.';
const [, plain = ''] = /<p id="plain">([^<]*)<\/p>/.exec(PAGE) ?? [];
assert.equal(plain.replace(/\s+/g, ' ').trim(), PLAIN);
// The plot's side: every button of it but the parcel's is off as the page comes - its script puts
// it on - and no limit of an order is written into the page: the one length that a tag states is
// Find's, and neither the parcel's field nor that of the ground around says one. The scripts take
// them from hosts.js and request.js.
assert.equal(count(PAGE, /\smaxlength="/g), 1);
assert.ok(PAGE.includes(`maxlength="${SEARCH_MAX}"`) && PAGE.includes('<aside id="plot">'));
assert.ok(PAGE.includes('<label><input id="around" type="number" /> m of ground around the plot'));
// The parcel's heading, form, field, button and switch, to the letter, at the top of the side,
// in its part - hidden as the page comes, and ended before Corners; the switch is off as the page
// comes. A comment of the markup is no part of it.
const PARCEL = `<aside id="plot"> <div id="parcel-part" hidden> <h2>Parcel</h2> <form id="parcel">
  <input id="parcel-words" type="text" autocomplete="off" spellcheck="false" aria-label="A
  municipality and a parcel number, or an EGRID" placeholder="Bern 1234, or CH…" /> <button
  type="submit">Find the parcel</button> </form> <label><input id="take-parcel" type="checkbox" />
  Take the parcel under a click</label> <p id="parcel-said" role="status"></p> <div
  id="parcels"></div> </div> <h2>Corners</h2>`;
const BARE = PAGE.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ');
assert.ok(BARE.includes(PARCEL.replace(/\s+/g, ' ')));
assert.equal(count(PAGE, /<div id="parcel-part" hidden>/g), 1);
assert.ok(!/\schecked\b/.test(PAGE));
const OFF = { 'undo-corner': 'Undo corner', 'start-again': 'Start again' };
Object.assign(OFF, { 'side-before': 'Side before', 'side-next': 'Next side' });
for (const [id, word] of Object.entries(OFF)) {
  assert.ok(PAGE.includes(`<button id="${id}" type="button" disabled>${word}</button>`), id);
}
assert.ok(PAGE.includes('<button id="make" type="submit" disabled>Make the plot</button>'));
// Ten buttons in all: Find's, the three on the map, the parcel's and those five. And the marks are
// a drawing that is read out to nobody: the sentences beside the map say what is marked.
assert.equal(count(PAGE, /<button\b/g), 10);
assert.ok(PAGE.includes('<svg id="marks" aria-hidden="true">'));
// Find and the map lie hidden until the page knows whom the pad asks.
assert.ok(
  PAGE.includes('<form id="find" role="search" hidden>') && PAGE.includes('<div id="work" hidden>'),
);
// And the stylesheet names no picture and no address: nothing of it is asked of anybody.
assert.ok(!/url\(|@import|http|\/\//i.test(onDisk('map/map.css')));

// Every file that the page and its scripts name, read off their text: a stylesheet by its `href`,
// a script by its `src`, a module by what it is imported from - each a name from where its file
// lies, in small letters, and so a file of the pad's own address, which both policies let the
// page load; each there, on the disk. A plain file server gives them as they lie.
const names = [...sheets, ...scripts.map(([, said]) => said)].map(
  (said) => /(?:href|src)="([^"]+)"/.exec(said)[1],
);
const ROOT = `http://${HOST}`;
const files = names.map((name) => new URL(name, `${ROOT}/${MAP_PAGE}`).pathname);
for (const file of files) {
  const body = onDisk(file.slice(1));
  for (const [, from] of body.matchAll(/\bfrom '([^']+)';/g)) {
    assert.ok(/^\.\.?\/[a-z-]+(\/[a-z-]+)?\.js$/.test(from), `${file} imports ${from}`);
    const next = new URL(from, `${ROOT}${file}`).pathname;
    if (!files.includes(next)) files.push(next);
  }
}
// Not take.js, new-plot/parcel.js nor swisstopo/parcels.js: the cadastre's, which page.js loads
// only where the pad offers it, by `import('./take.js')` - the one way in, and no `from`.
const LOADS = `frame.css map/map.css map/page.js swisstopo/cadastre.js swisstopo/hosts.js
  map/find.js map/make.js map/map.js map/marks.js new-plot/making.js new-plot/request.js
  plot-file.js store/held.js store/rules.js store/ways.js map/view.js map/marking.js
  swisstopo/ground.js new-plot/frame.js new-plot/plot.js routes.js swisstopo/catalogue.js
  swisstopo/door.js swisstopo/grid.js swisstopo/tile.js swisstopo/statuses.js swisstopo/blocks.js
  swisstopo/lzw.js swisstopo/tiff.js`.split(/\s+/);
assert.deepEqual(
  files,
  LOADS.map((name) => `/${name}`),
);

// A made-up page that keeps what it is told - its parts, and what is put into its head - at an
// address of the check's own, and a `fetch` of the check's that writes down whatever is asked:
// page.js is loaded on them, once for each address of a page that asks nobody.
const page = { parts: new Map(), body: { dataset: {} }, head: [] };
const partOf = (id) => page.parts.get(id) ?? page.parts.set(id, { hidden: true }).get(id);
const asked = [];
const where = { search: '' };
const fetch = (...how) => asked.push(how) && Promise.reject(new TypeError('Failed to fetch'));
const head = { append: (...parts) => void page.head.push(...parts) };
const createElement = (tag) => ({ tag });
const document = { body: page.body, head, getElementById: partOf, createElement };
Object.assign(globalThis, { document, location: where, fetch });
/** The page, loaded anew on the made-up page at an address: what it then shows, and what it asked. */
async function loaded(search, as) {
  page.parts.clear();
  page.head.length = 0;
  delete page.body.dataset.asks;
  asked.length = 0;
  where.search = search;
  const { toldOf, whom } = await import(`./page.js?${as}`);
  const parts = Object.fromEntries(page.parts);
  return { toldOf, whom, parts, head: [...page.head], asks: page.body.dataset.asks };
}

// What the page says of whom it asks, typed in, to the letter - swisstopo's line with a cadastre,
// and without one, where it names no parcel (T-044.10) - and the policy it puts in.
const SWISSTOPO =
  'This page asks swisstopo, the Federal Office of Topography, for the pictures of the map that it shows, for the places that you search for, and for the parcel whose number or EGRID you type, or that you click with "Take the parcel under a click" on: the words that you typed, or the place that you clicked, are all that goes for it. When you make the plot, this page asks it for the heights of the ground under the plot. Nothing else goes out: no name, no sketch, nothing of your design.';
const ALONE =
  'This page asks swisstopo, the Federal Office of Topography, for the pictures of the map that it shows and for the places that you search for: the words that you typed are all that goes for it. When you make the plot, this page asks it for the heights of the ground under the plot. Nothing else goes out: no name, no sketch, nothing of your design.';
const STAND_IN =
  'This page asks a stand-in on this machine, http://127.0.0.1:5123, in the place of swisstopo: its map, its places and its ground are made up.';
const NONE = 'It shows no map and makes no plot.';
const refusal = (told) =>
  `This page was told to ask "${told}": a port of this machine, for a stand-in, or nothing, for swisstopo. ${NONE}`;
const policyFor = (at) =>
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'${at.img}; connect-src 'self'${at.connect}; base-uri 'none'; form-action 'none'`;
const put = (content) => ({ tag: 'meta', httpEquiv: 'Content-Security-Policy', content });
const NOBODY_POLICY = policyFor({ img: '', connect: '' });
// A page told what is no word of whom asks nobody: its policy, put into its head, names no host;
// then its line - the refusal, then that it shows nothing - the body's word, and nothing else: no
// part of the map and none of Find was so much as looked for. And it asked nothing to know it.
const NO_ASKS = { '': '', 0: '0', 65536: '65536', '05123': '05123', swisstopo: 'swisstopo' };
Object.assign(NO_ASKS, { 'localhost:5123': 'localhost:5123', '5123&asks=5124': '5123, 5124' });
for (const [index, [word, told]] of Object.entries(NO_ASKS).entries()) {
  const shown = await loaded(`?asks=${word}`, `nobody-${index}`);
  const says = { asks: { hidden: true, textContent: refusal(told) } };
  assert.deepEqual([shown.parts, shown.head, shown.asks], [says, [put(NOBODY_POLICY)], 'nobody']);
  assert.deepEqual(asked, [], word);
}
const { toldOf, whom } = await loaded('?asks=nobody', 'nobody');

// Whom the page asks, of its address - every kind of Do 1 - asking nothing to know it. swisstopo
// is the three origins of its services, each put together here of its host's name; a stand-in
// one origin of this machine for all three; and the policy of each, as page.js puts it in.
const of = (host) => `https://${host}`;
const [map, search, terrain] = [HOSTS.map, HOSTS.search, HOSTS.terrain].map(of);
const standIn = 'http://127.0.0.1:5123';
const twice = (at) => ({ map: at, search: at, terrain: at });
const swisstopo = { asks: 'swisstopo', map, search, terrain, says: SWISSTOPO };
const alone = { ...swisstopo, says: ALONE };
const told = (at) => ({ asks: 'stand-in', ...twice(at), says: STAND_IN.replace(standIn, at) });
const ADDRESSES = [
  ['', CADASTRE === null ? alone : swisstopo],
  ['?asks=5123', told(standIn)],
];
ADDRESSES.push(['?asks=1', told('http://127.0.0.1:1')]);
ADDRESSES.push(['?asks=65535', told('http://127.0.0.1:65535')]);
for (const [at, expected] of ADDRESSES) {
  where.search = at;
  assert.deepEqual(whom(), expected, at);
}
assert.deepEqual(asked, []);
assert.equal(policyOf(swisstopo), policyFor({ img: ` ${map}`, connect: ` ${search} ${terrain}` }));
assert.equal(policyOf(told(standIn)), policyFor({ img: ` ${standIn}`, connect: ` ${standIn}` }));
// Whatever else is nobody: no origin, one of three, origins that may not be asked - each with
// no refusal to say, so its line is that it shows nothing.
const nobody = { asks: 'nobody', map: null, search: null, terrain: null, says: NONE };
const NO_WORD = [null, undefined, 7, 'swisstopo', [], {}, { map, search }, { map: null }];
NO_WORD.push({ map: search, search: map, terrain }, { map: terrain, search: terrain, terrain });
NO_WORD.push({ map, search: standIn, terrain }, { map: standIn, search: standIn, terrain });
NO_WORD.push({ map: standIn, search: standIn }, { map: standIn, search: 'http://127.0.0.1:5124' });
NO_WORD.push(twice(`${standIn}/`), twice('http://127.0.0.1:0'), twice(of('example.org')));
NO_WORD.push(twice([standIn]), { refused: 7 });
for (const no of NO_WORD) assert.deepEqual(toldOf(no), nobody, JSON.stringify(no));
assert.deepEqual(toldOf({ refused: 'Told so.' }), { ...nobody, says: `Told so. ${NONE}` });
// swisstopo's line with a cadastre - any - is the one that names the parcel; without one it names
// none, to the letter (docs/sketch/cadastre.md). A stand-in and nobody say the same either way. Without
// a cadastre given it is the switch's, CADASTRE.
const three = { map, search, terrain };
assert.deepEqual(toldOf(three, { layer: 'made-up' }), swisstopo);
assert.deepEqual(toldOf(three, null), alone);
assert.deepEqual(toldOf(three), toldOf(three, CADASTRE));
assert.deepEqual(toldOf(three), CADASTRE === null ? alone : swisstopo);
for (const cadastre of [null, {}]) {
  assert.deepEqual(toldOf(twice(standIn), cadastre), told(standIn));
  assert.deepEqual(toldOf({ refused: 'Told so.' }, cadastre).says, `Told so. ${NONE}`);
}
// Of the script, the text: it asks nobody to learn whom it asks; it puts the policy in before it
// opens the map on the origin of the map service and Find on the search's - which a stand-in
// cannot tell apart: it is one for all three - and on that map the marking, opened once, and on
// the marking, where the pad offers the cadastre, the parcel's part shown and the parcel loaded
// and opened on the search's origin, and then the making - in that order.
const SCRIPT = onDisk('map/page.js');
assert.equal(count(SCRIPT, /\bfetch\b/g), 0);
const PUT = 'document.head.append(policy);';
assert.ok(SCRIPT.includes(`\n${PUT}\n`) && SCRIPT.indexOf(PUT) < SCRIPT.indexOf('openMap('));
// And the line that says whom it asks is set before the map, Find or the parcel asks anything.
assert.ok(SCRIPT.indexOf("$('asks').textContent = told.says;") < SCRIPT.indexOf('openMap('));
const OPENS = ['  const map = openMap(told.map);', '  openFind(told.search, map);'];
OPENS.push('  const marks = openMarks(map);', '  if (CADASTRE !== null) {');
OPENS.push(
  "    $('parcel-part').hidden = false;",
  "    const { openTake } = await import('./take.js');",
);
OPENS.push(
  '    openTake(told.search, map, marks);',
  '  }',
  '  void openMake(marks, told.terrain);',
);
assert.equal(count(SCRIPT, /\bopenMarks\(/g), 1);
assert.ok(!SCRIPT.includes("from './take.js'"));
assert.equal(count(SCRIPT, /import\('\.\/take\.js'\)/g), 1);
assert.ok(SCRIPT.includes(`\n${OPENS.join('\n')}\n`), OPENS.join('\n'));
assert.ok(SCRIPT.includes("\nimport { CADASTRE } from '../swisstopo/cadastre.js';\n"));

process.stdout.write(
  'tools/sketch/map: the page of a new plot names modules and files alone, brings its own two policies, and says whom its address asks - swisstopo, a stand-in, nobody - each in its line, asking nobody to know it\n',
);
