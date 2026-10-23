// The check of Open plot (ST-030, ST-040): the first half of open-plot.js - the words of the
// window of the plots, with nothing of the page in them - by hand: the small words of each kind of
// entry, a held plot of the file way and of the folder way, the example and the one that shows;
// an area to a whole square metre; the order, newest first and the example last; every sentence
// the window says. What it states a second time - the two notes and the example's name - held
// against store/rules.js and demo-site.js. File's entries as the script makes them: New plot after
// Open plot where GET map/index.html, from where the page is, answers 200, and nowhere else - the
// made-up pad's 204 among them - and its click, with the page's word `asks` and nothing else of its address. A pick, as `go` makes it: both notes, the page loaded anew where it is, with what
// to say riding its history entry, which the page says once as it opens - as it says GONE. And of
// the two pages the text: which names which script, and where. The window and its two ways are a
// browser test's, tests/e2e/sketch-plots.spec.ts. Nothing is asked of any server. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';
import { pathToFileURL, URL } from 'node:url';
import { read } from './plot-file.js';
import { HOST, MAP_PAGE, route } from './routes.js';
import { heldOrder, LAST, recordOf, TAB, WAYS } from './store/rules.js';

const HERE = import.meta.dirname;
const FIXTURES = path.join(HERE, '..', '..', 'tests', '__fixtures__', 'plots');
const text = (file) => fs.readFileSync(path.join(HERE, file), 'utf8');

// A page that keeps what is made: each part an object that hears, holds its children and is put
// after another in the File menu. The five entries of File that are there before the script.
function pageOf({ plot, answer, state = null, gone, at = '/' }) {
  const [menu, went, notes, asked, replaced] = [[], [], {}, [], []];
  const part = (id) => {
    const one = { id, heard: {}, kids: [], textContent: '', open: false, attributes: {} };
    one.addEventListener = (word, hear) => void (one.heard[word] = hear);
    one.after = (next) => void menu.splice(menu.indexOf(one) + 1, 0, next);
    one.append = (...kids) => void one.kids.push(...kids);
    one.replaceChildren = (...kids) => void (one.kids = kids);
    one.setAttribute = (name, value) => void (one.attributes[name] = value);
    one.showModal = () => void (one.open = true);
    one.close = () => void (one.open = false);
    return one;
  };
  menu.push(...['open', 'open-kept', 'save', 'keep', 'picture'].map(part));
  const { pathname, search, hash, href } = new URL(at, `http://${HOST}:4765`);
  const location = {
    pathname,
    search,
    hash,
    href,
    assign: (to) => went.push(['assign', to]),
    reload: () => went.push(['reload']),
  };
  const history = {
    state,
    replaceState: (next, unused, to) => replaced.push([next, to]) && void (history.state = next),
  };
  const store = (name) => ({ setItem: (key, id) => void (notes[`${name} ${key}`] = id) });
  const byId = (id) => menu.find((one) => one.id === id);
  const document = {
    createElement: () => part(),
    getElementById: byId,
    body: part(),
    currentScript: { src: pathToFileURL(path.join(HERE, 'open-plot.js')).href },
  };
  const fetch = (to) => (
    asked.push(to),
    answer === null ? Promise.reject(new Error('none')) : Promise.resolve({ status: answer })
  );
  const given = { document, location, history, fetch, paper: { FAINT: '#52606d' } };
  Object.assign(globalThis, given, { PLOT: plot, GONE: gone, indexedDB: undefined });
  Object.assign(globalThis, { sessionStorage: store('tab'), localStorage: store('last') });
  return { menu, went, notes, asked, replaced, document };
}
let loads = 0;
async function load(given) {
  const page = pageOf(given);
  loads += 1;
  await import(`./open-plot.js?${loads}`);
  await globalThis.openPlot.asked;
  return { ...page, openPlot: globalThis.openPlot };
}

const first = await load({ plot: undefined });
const { said, order, says } = first.openPlot;
assert.deepEqual(Object.keys(first.openPlot), ['said', 'order', 'says', 'say', 'go', 'asked']);

// The small words of each kind of entry, by hand. The terrace plot's file, read and held as
// store/rules.js makes a record of it: its area, the day it was opened, and this browser - or,
// as a folder, the folder by its name; the one that shows says so last.
const terrace = fs.readFileSync(path.join(FIXTURES, 'terrace', 'plot.json'), 'utf8');
const { site } = read(terrace);
const held = (way, folder) =>
  recordOf({ id: 'terrace', site, text: terrace, way, folder, day: '2026-10-20' });
const [byFile, byFolder] = [held(WAYS.file), held(WAYS.folder, { name: 'terrace' })];
assert.equal(said(byFile, 'example'), '336 m², opened 2026-10-20, this browser');
assert.equal(said(byFile, 'terrace'), '336 m², opened 2026-10-20, this browser, shows now');
assert.equal(said(byFolder, 'home'), '336 m², opened 2026-10-20, the folder terrace');
assert.equal(said(byFolder, 'terrace'), '336 m², opened 2026-10-20, the folder terrace, shows now');
// The example: that it is the example, and that it shows - no area, no day, no folder.
const [example] = order([]);
assert.deepEqual(example, { id: 'example', name: 'Made-up hillside plot', way: 'example' });
assert.equal(said(example, 'terrace'), 'the example');
assert.equal(said(example, 'example'), 'the example, shows now');
// An area is said to a whole square metre, whatever the outline encloses; and the plot that
// shows is the one of that id and no other.
const area = (areaM2) => said({ ...byFile, areaM2 }, 'home');
assert.deepEqual([300.4, 335.5, 0.6].map(area), [
  '300 m², opened 2026-10-20, this browser',
  '336 m², opened 2026-10-20, this browser',
  '1 m², opened 2026-10-20, this browser',
]);
for (const no of [null, 'Terrace', 'terrace ', '', undefined]) {
  assert.equal(said(byFile, no).includes('shows now'), false, String(no));
}

// The order: the newest opened first, of one day by the id, and the example last - as
// heldOrder of store/rules.js has the held plots. What it is handed stays as it was.
const day = (id, opened) => ({ id, name: id, areaM2: 1, way: WAYS.file, folder: null, opened });
const records = [day('b', '2026-10-19'), day('c', '2026-10-20'), day('a', '2026-10-20')];
const before = JSON.stringify(records);
const ids = (list) => list.map((one) => one.id);
assert.deepEqual(ids(order(records)), ['a', 'c', 'b', 'example']);
assert.deepEqual(ids(order(records)).slice(0, -1), ids(heldOrder(records)));
assert.deepEqual(ids(order([day('z', '2027-01-01'), day('y', '2026-12-31')])), [
  'z',
  'y',
  'example',
]);
assert.equal(JSON.stringify(records), before);

// What the window says, to the letter.
assert.equal(
  says.noFolder,
  "This browser cannot be given a folder — Chrome and Edge can. A plot's file opens here, and what is kept on it stays in this browser.",
);
assert.equal(
  says.persist,
  "This browser may clear what it holds when it is short of room: a plot's folder keeps its sketches; a sketch kept in the browser is safe once saved as a file.",
);
assert.equal(
  says.gone('terrace'),
  'The plot "terrace" that this browser showed last is no longer held here: the browser may have cleared what it held. Open its folder or its file again.',
);
assert.equal(
  says.refused('plot.json', 'It is no JSON.'),
  '"plot.json" cannot be opened: It is no JSON.',
);
assert.equal(
  says.unlisted('the store failed'),
  'The plots this browser holds cannot be listed: the store failed',
);
assert.equal(says.failed('the folder went'), 'Nothing was opened: the folder went');

// What the script states a second time: the two notes of store/rules.js, and the example's
// name, as the made-up plot's own script says it.
const code = text('open-plot.js').replace(/^\s*\/\/.*$/gm, '');
assert.match(code, /const \[TAB, LAST\] = \['([^']+)', '([^']+)'\];/);
assert.deepEqual(/const \[TAB, LAST\] = \['([^']+)', '([^']+)'\];/.exec(code).slice(1), [
  TAB,
  LAST,
]);
await import('./demo-site.js');
assert.equal(example.name, globalThis.SITE.name);

// File's entries. Whatever plot shows, the page of a new plot is asked for once, GET
// map/index.html from where the page is, and its 200 puts "New plot" after "Open plot". The
// made-up pad's 204, a 404, no answer: no entry.
const entries = (page) => page.menu.map(({ id }) => id).join(' ');
const ONE = 'open open-kept open-plot save keep picture';
const NEW = 'open open-kept open-plot new-plot save keep picture';
const owner = await load({ plot: { id: 'home', key: 'blockplot/sketch/space' }, answer: 200 });
assert.equal(entries(owner), NEW);
assert.deepEqual(owner.asked, [MAP_PAGE]);
assert.deepEqual([owner.menu[2].textContent, owner.menu[3].textContent], ['Open plot', 'New plot']);
for (const answer of [204, 404, 403, 500, null]) {
  const page = await load({ plot: { id: 'home', key: 'k' }, answer });
  assert.deepEqual([entries(page), page.asked], [ONE, [MAP_PAGE]], String(answer));
}
for (const plot of [
  { id: 'terrace', key: 'k', way: 'file' },
  { id: 'example', key: 'k', way: 'example' },
]) {
  for (const [answer, menu] of [
    [200, NEW],
    [204, ONE],
  ]) {
    const page = await load({ plot, answer });
    const said = `${JSON.stringify(plot)} ${answer}`;
    assert.deepEqual([entries(page), page.asked], [menu, [MAP_PAGE]], said);
  }
}
// Asked from where the page is: a pad served under a path of its own - a project's page of
// GitHub's - asks its own folder, and no address from the root.
for (const [at, to] of [
  ['/', '/map/index.html'],
  ['/3d.html#side', '/map/index.html'],
  ['/blockplot/index.html?asks=5123#top', '/blockplot/map/index.html'],
  ['/blockplot/', '/blockplot/map/index.html'],
]) {
  const page = await load({ plot: { id: 'home', key: 'k' }, answer: 200, at });
  assert.equal(new URL(page.asked[0], `http://${HOST}:4765${at}`).pathname, to, at);
}
// A click on "New plot" goes to the map's page from where the page is: by the server's own rule
// the page of a new plot - with the page's word `asks`, whom the map's page asks, where it has
// one, as encodeURIComponent writes it, and nothing else of its address (T-041.2).
owner.menu[3].heard.click();
assert.deepEqual(owner.went, [['assign', MAP_PAGE]]);
const there = new URL(MAP_PAGE, `http://${HOST}:4764/#side`);
assert.equal(there.pathname, '/map/index.html');
assert.equal(route(there.pathname, false)?.file, MAP_PAGE);
for (const [at, to] of [
  ['/?asks=5123#side', '?asks=5123'],
  ['/?plot=home&asks=a%20b&asks=5123#top', '?asks=a%20b&asks=5123'],
  ['/?asks=#side', '?asks='],
  ['/?plot=home#side', ''],
]) {
  const told = await load({ plot: { id: 'home', key: 'k' }, answer: 200, at });
  told.menu[3].heard.click();
  assert.deepEqual(told.went, [['assign', `${MAP_PAGE}${to}`]], at);
}

// A pick: both notes the id, and the page loaded anew where it is - with the view's hash - and,
// where there is something to say, that riding the history entry. The address is not touched.
const pick = await load({ plot: undefined, state: { kept: 1 }, at: '/#side' });
pick.openPlot.go('terrace');
assert.deepEqual(pick.notes, { [`tab ${TAB}`]: 'terrace', [`last ${LAST}`]: 'terrace' });
assert.deepEqual([pick.replaced, pick.went], [[[{ kept: 1 }, undefined]], [['reload']]]);
const told = await load({ plot: { id: 'terrace', key: 'k' }, answer: 404, at: '/#top' });
told.openPlot.go('example', says.persist);
assert.deepEqual(told.replaced, [[{ plotSaid: says.persist }, undefined]]);
assert.deepEqual(told.went, [['reload']]);

// As the page opens: what rode the history entry is said once - taken out of it, and what else
// it held left - after GONE's sentence; the window opens, and lists what the store gives. Here
// there is no store: that is said too. Neither: no window.
const opened = await load({
  plot: undefined,
  state: { plotSaid: says.persist, kept: 1 },
  gone: 'x',
});
const dialog = opened.document.body.kids[0];
assert.equal(dialog.open, true);
assert.deepEqual(opened.replaced, [[{ kept: 1 }, undefined]]);
await setTimeout(50);
const words = dialog.kids.find((one) => one.id === 'plot-said').textContent;
assert.ok(words.startsWith(`${says.gone('x')} ${says.persist} ${says.unlisted('')}`), words);
assert.deepEqual(dialog.kids.find((one) => one.id === 'plot-list').kids.length, 1);
const quiet = await load({ plot: undefined, state: { kept: 1 } });
assert.deepEqual([quiet.document.body.kids[0].open, quiet.replaced], [false, []]);

// Of the two pages, the text. Each has the plot's place, site.js, first in its template, and
// boot.js once, last (T-040.2); the pad's page names open-plot.js once, in the line after kept.js, and
// open-plot-ways.js once, in the line after it; the 3D page names neither, and asks nobody.
const scripts = (file) =>
  [...text(file).matchAll(/<script\b[^>]*?\ssrc="([^"]+)"/g)].map((one) => one[1]);
const [flat, solid] = [scripts('index.html'), scripts('3d.html')];
const named = (list, name) => list.filter((one) => one === name).length;
const ends = (list) => [list[0], list.at(-1), named(list, 'boot.js')];
assert.deepEqual(
  [...ends(flat), ...ends(solid)],
  ['site.js', 'boot.js', 1, 'site.js', 'boot.js', 1],
);
const after = (name) => flat[flat.indexOf(name) + 1];
assert.deepEqual(
  [
    named(flat, 'open-plot.js'),
    named(flat, 'open-plot-ways.js'),
    after('kept.js'),
    after('open-plot.js'),
  ],
  [1, 1, 'open-plot.js', 'open-plot-ways.js'],
);
for (const [file, lines] of Object.entries({ 'index.html': 1, '3d.html': 0, 'info.html': 0 })) {
  for (const script of ['open-plot', 'open-plot-ways']) {
    const own = text(file).match(new RegExp(`^ {6}<script src="${script}\\.js"></script>$`, 'gm'));
    assert.equal(own?.length ?? 0, lines, `${file} names ${script}.js in another way`);
  }
}
assert.equal(/open-plot/.test(text('3d.html')), false);
// And of the two scripts, the text: open-plot.js asks in one place, for the page of a new plot,
// and names neither the server's list of the plots nor /new-plot/; the ways ask nobody; neither
// takes a note away.
const ways = text('open-plot-ways.js').replace(/^\s*\/\/.*$/gm, '');
assert.deepEqual(code.match(/\bfetch\([^)]*\)/g), ['fetch(NEW_PLOT)']);
assert.match(code, /const NEW_PLOT = 'map\/index\.html';/);
assert.equal(/\/plots\/|new-plot\//.test(code), false);
assert.equal(/\bfetch\b|XMLHttp/.test(ways), false);
assert.equal(/removeItem|\.clear\(|delete\(/.test(code + ways), false);

process.stdout.write(
  "tools/sketch: Open plot's words by hand - each kind of entry, the order, every sentence - File has New plot where the page of a new plot answers 200, a pick notes the plot and loads the page anew, and the pages name open-plot.js and open-plot-ways.js where they belong\n",
);
