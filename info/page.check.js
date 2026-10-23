// The check of the Info page (ST-032, T-032.5, info/page.js), by hand on the made-up house, with
// the pad's scripts, the sections, the rates, the sums and the page on a made-up store, plot and
// page that keeps what is made: every cell of the three tables and the whole house's line, typed
// in, each total the sum of its rows as they stand; how a figure is shown; a cost in each of its
// four readings; a rate typed, refused, emptied and set to 0 - beside a category too - with the
// sketch that the store then holds; the fields off over a text that cannot be read; another
// window's change; an empty sketch; blocks through more than one level; and of info.html the text.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/info/page.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { golden, VERSION } from '../check-golden.js';

// A browser's two stores, the window's listeners, and A MADE-UP PAGE: a part keeps its text, its
// children, what it is marked with and who listens to it - a field what it holds too.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const heard = {};
globalThis.addEventListener = (type, hear) => void (heard[type] = hear);
function part(tag = 'p') {
  const made = { tagName: tag.toUpperCase(), children: [], hears: {}, dataset: {}, said: {} };
  Object.assign(made, { textContent: '', hidden: false }, tag === 'input' ? { value: '' } : {});
  made.append = (...more) => void made.children.push(...more);
  made.replaceChildren = (...all) => void (made.children = all);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (name, value) => void (made.said[name] = value);
  return made;
}
let page = {};
globalThis.document = { getElementById: (id) => (page[id] ??= part()), createElement: part };

// The sections, the rates, the sums and the made-up plot, once; the pad's scripts as info.html
// names them - but views.js, which the page asks nothing of - and the page last, each time anew.
for (const file of ['sections/model', 'info/rates', 'info/sums', 'demo-site', 'categories']) {
  await import(`../${file}.js`);
}
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'info/page'];
let [loads, sketch] = [0, null];
/** The Info page, loaded anew on a store that holds this text. */
async function open(text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  [page, globalThis.location, loads] = [{}, { hash: '' }, loads + 1];
  for (const file of SCRIPTS) await import(`../${file}.js?${loads}`);
  sketch = globalThis.sketch;
}
/** Every part under a part, itself first; and a field of a rate by its id, wherever it stands. */
const under = (one) => (typeof one === 'string' ? [] : [one, ...one.children.flatMap(under)]);
const every = () => Object.values(page).flatMap(under);
const field = (id) => every().find((one) => one.id === id);
/** What a part says, as a browser's text of it - and a field, what it holds. */
const text = (one) =>
  [one.value ?? one.textContent ?? one, ...(one.children ?? []).map(text)].join('');
const said = (id) => (page[id].hidden ? null : text(page[id]));
/** A table as it reads: its caption, then a line a row, each cell's text - a field's in brackets. */
const table = (id) => page[id].children.map((row) => row.textContent || row.children.map(cell));
const cell = (one) => {
  const input = under(one).find((some) => some.tagName === 'INPUT');
  return input ? text(one).replace(`CHF ${input.value}`, `CHF [${input.value}]`) : text(one);
};
const costs = (id) => table(id).flatMap((row, at) => (at > 1 ? [row[4]] : []));
/** A text typed into a field, which is left: the sketch that the store then holds, and the pad's steps. */
function typed(id, words) {
  Object.assign(field(id), { value: words }).hears.change();
  return [local.held.get(KEY), sketch.past.length];
}

// THE MADE-UP HOUSE, tests/__fixtures__/sketch/made-up.json, with two sections and four rates:
// "Upper home", the night rooms, the bath and the roof terrace; "Lower home", the day rooms, the
// porch and the garden; 900 francs a cubic metre of rooms, 600 of glass, 350 a square metre of
// open air, and 1200 a cubic metre of a Bathroom (T-032.2).
let homes = golden('made-up');
for (const [at, names] of [
  'Night rooms|Bath|Roof terrace',
  'Day rooms|Glass porch|Garden',
].entries()) {
  for (const name of names.split('|'))
    homes = homes.replaceAll(`"name":"${name}"`, `$&,"section":${at + 1}`);
}
const LISTED = '"sections":[{"id":1,"name":"Upper home"},{"id":2,"name":"Lower home"}]';
const rated = (as, category = '') =>
  `"rates":{"as":{${as}}${category === '' ? '' : `,"category":{${category}}`}}`;
const ALL = rated('"room":900,"glass":600,"open":350', '"bathroom":1200');
const sketched = (...more) => homes.replace(/\}\s*$/, `,${more.join(',')}}`);
await open(sketched(LISTED, ALL));
const HEAD = ['Floor', 'Open air', 'Volume', 'Rough cost'];
const TOTAL = ['Total', '188 m²', '28 m²', '520 m³', "CHF 469'400"];
assert.deepEqual(table('info-sections'), [
  'By section',
  ['Section', ...HEAD],
  ['Upper home', '68 m²', '12 m²', '200 m³', "CHF 190'200"],
  ['Lower home', '104 m²', '16 m²', '288 m³', "CHF 250'400"],
  ['No section', '16 m²', '0 m²', '32 m³', "CHF 28'800"],
  TOTAL,
]);
assert.deepEqual(table('info-levels'), [
  'By level',
  ['Level', ...HEAD],
  ['Level 817 m', '68 m²', '12 m²', '200 m³', "CHF 190'200"],
  ['Level 814 m', '120 m²', '16 m²', '320 m³', "CHF 279'200"],
  TOTAL,
]);
// A category's own rate: a field, with the unit that the category is costed by.
assert.deepEqual(table('info-categories'), [
  'By category',
  ['Category', ...HEAD, 'Its own rate'],
  ['Bathroom', '8 m²', '0 m²', '20 m³', "CHF 24'000", 'CHF [1200] per m³'],
  ['Garden', '0 m²', '16 m²', '0 m³', "CHF 5'600", 'CHF [] per m²'],
  ['Roof', '0 m²', '12 m²', '0 m³', "CHF 4'200", 'CHF [] per m²'],
  ['No category', '180 m²', '0 m²', '500 m³', "CHF 435'600", ''],
  [...TOTAL, ''],
]);
// The whole house in a line, the rates and what each multiplies, what is not counted - and no
// word of floor counted twice, of a block through more than one level, of nothing drawn, or in
// the page's line. And the last row of each table is its total.
const HOUSE = 'The whole house: 188 m² of floor, 28 m² of open air, 520 m³';
const SENTENCES = ['info-house', 'info-apart', 'info-twice', 'info-through', 'info-none'];
const ON_THE_PAGE = [...SENTENCES, 'info-said', 'info-is'].map(said);
const APART = 'Not counted: 1 block of ground and 1 cut.';
assert.deepEqual(ON_THE_PAGE, [`${HOUSE} — CHF 469'400.`, APART, null, null, null, null, '']);
const RATES = ['A cubic metre of roomsCHF 900', 'A cubic metre under glassCHF 600'];
assert.deepEqual(page.rates.children.map(text), [...RATES, 'A square metre of open airCHF 350']);
const MULTIPLIES = 'Rooms and glass are costed by their volume, open air by its area;';
const OWN = 'a category with a rate of its own is costed by that one.';
const NO_RATE = 'The pad picks no rate: what has none has no cost.';
assert.equal(said('rates-are'), `${NO_RATE} ${MULTIPLIES} ${OWN}`);
const TABLES = ['info-sections', 'info-levels', 'info-categories'];
assert.ok(TABLES.every((id) => page[id].children.at(-1).className === 'total'));
// EVERY TOTAL READS AS THE SUM OF THE ROWS ABOVE IT, as they stand: of floor, open air, volume
// and cost, each figure as the page writes it, read back - an apostrophe of the francs passed over.
const figure = (words) => Number(words.replace(/^CHF |'| .*$/g, ''));
for (const id of TABLES) {
  const [, , ...rows] = table(id);
  const total = rows.pop();
  for (const at of [1, 2, 3, 4]) {
    const sum = rows.reduce((all, row) => all + figure(row[at]), 0);
    assert.equal(Number(sum.toFixed(3)), figure(total[at]), `${id}, column ${at}`);
  }
}

// HOW A FIGURE IS SHOWN, by the three functions - square metres to two decimals, cubic metres to
// three, francs to the whole franc in threes - and a cost in each of its four readings.
const { area, volume, francs, cost } = globalThis.infoPage;
const SHOWN = [volume(5.625), area(0.25), volume(17.86666), francs(5062.5), francs(1234567.4)];
assert.deepEqual(SHOWN, ['5.625 m³', '0.25 m²', '17.867 m³', "CHF 5'063", "CHF 1'234'567"]);
const WHOLE = [area(188), area(8.25), area(0.125), volume(0), francs(0)];
assert.deepEqual(WHOLE, ['188 m²', '8.25 m²', '0.13 m²', '0 m³', 'CHF 0']);
const row = (blocks, chf, without = []) => ({ blocks, cost: chf, without });
const FOUR = [row(3, 469400), row(7, 424800, ['glass', 'open']), row(2, null, ['room'])];
const READINGS = ["CHF 469'400", "CHF 424'800 without glass and open air", 'no cost', '–'];
assert.deepEqual([...FOUR, row(0, null)].map(cost), READINGS);
const THREE = ['room', 'glass', 'open'];
assert.equal(cost(row(1, 18000, THREE)), "CHF 18'000 without rooms, glass and open air");

// NO RATE: every cost reads "no cost", and the whole house says so.
await open(sketched(LISTED));
assert.equal(said('info-house'), `${HOUSE} — no cost.`);
assert.ok(TABLES.every((id) => costs(id).every((one) => one === 'no cost')));
// 900 TYPED FOR ROOMS: kept in the sketch, one step, and every cost follows - with what it leaves out.
const ROOM = rated('"room":900');
assert.deepEqual(typed('rate-room', '900'), [sketched(LISTED, ROOM), 1]);
assert.equal(said('info-house'), `${HOUSE} — CHF 424'800 without glass and open air.`);
const BY_SECTION = ["CHF 180'000 without open air", "CHF 216'000 without glass and open air"];
const ROOMS_ALONE = [...BY_SECTION, "CHF 28'800", "CHF 424'800 without glass and open air"];
assert.deepEqual(costs('info-sections'), ROOMS_ALONE);
// "x" AND "-5" are refused in words, under their field: nothing is written, the text stays.
for (const words of ['x', '-5']) {
  assert.deepEqual(typed('rate-glass', words), [sketched(LISTED, ROOM), 1]);
  const why = page.rates.children[1].children.at(-1);
  const refused = `A rate is a number from 0 to 1000000, in francs: "${words}" is none.`;
  assert.deepEqual([field('rate-glass').value, why.hidden, text(why)], [words, false, refused]);
}
// The page shown anew meanwhile - another window was heard - leaves the owner's text in its field.
heard.storage({ key: KEY });
assert.equal(field('rate-glass').value, '-5');
// 600, 350, and 1'200 BESIDE "BATHROOM", typed with its apostrophe: kept as 1200, which its
// field shows; the refusal is gone, and every cost is the card's.
typed('rate-glass', '600');
typed('rate-open', '350');
assert.deepEqual(typed('rate-bathroom', "1'200"), [sketched(LISTED, ALL), 4]);
assert.equal(field('rate-bathroom').value, '1200');
assert.equal(said('info-house'), `${HOUSE} — CHF 469'400.`);
assert.deepEqual(page.rates.children.map(text).slice(0, 2), RATES);
// 0 FOR OPEN AIR is a rate: the two terraces cost "CHF 0". And 0 BESIDE "BATHROOM": its field
// shows 0, and not nothing, and its row costs "CHF 0".
assert.deepEqual(costs('info-categories').slice(1, 3), ["CHF 5'600", "CHF 4'200"]);
typed('rate-open', '0');
assert.deepEqual(costs('info-categories').slice(1, 3), ['CHF 0', 'CHF 0']);
const ZERO = rated('"room":900,"glass":600,"open":0', '"bathroom":0');
assert.deepEqual(typed('rate-bathroom', '0'), [sketched(LISTED, ZERO), 6]);
assert.deepEqual([field('rate-bathroom').value, costs('info-categories')[0]], ['0', 'CHF 0']);
assert.equal(said('info-house'), `${HOUSE} — CHF 435'600.`);
// EMPTIED, the rate is gone from the kept sketch, and what has none has no cost again.
const EMPTIED = rated('"room":900,"glass":600', '"bathroom":0');
assert.deepEqual(typed('rate-open', ''), [sketched(LISTED, EMPTIED), 7]);
assert.deepEqual(costs('info-categories').slice(1, 3), ['no cost', 'no cost']);

// ANOTHER WINDOW: the browser tells this page that the sketch's key holds another text, and the
// page shows it, with no reload; of another key, nothing. And the whole store emptied: nothing.
local.held.set(KEY, sketched(LISTED, ALL));
heard.storage({ key: 'blockplot/sketch/seen' });
assert.equal(said('info-house'), `${HOUSE} — CHF 435'600 without open air.`);
heard.storage({ key: KEY });
assert.equal(said('info-house'), `${HOUSE} — CHF 469'400.`);
assert.equal(field('rate-open').value, '350');
// A RATE IS WRITTEN INTO THE SKETCH THAT THE BROWSER KEEPS AT THAT MOMENT: another window took
// the rates away, unheard here - and 650 for glass is written into that sketch, and not over it.
local.held.set(KEY, sketched(LISTED));
assert.deepEqual(typed('rate-glass', '650'), [sketched(LISTED, rated('"glass":650')), 8]);
local.held.clear();
heard.storage({ key: null });
assert.deepEqual([said('info-none'), said('info-house'), said('info-sections')], ['', null, null]);

// AN EMPTY SKETCH: "Nothing is drawn yet.", and nothing else shows but the rates.
const EMPTY = { floors: [], notes: [], on: {}, show: { top: {} } };
const drawn = (things, more) => JSON.stringify({ space: VERSION, things, ...EMPTY, ...more });
await open(drawn([]));
const NOTHING = [...SENTENCES, ...TABLES, 'info-is'].map((id) => page[id].hidden);
assert.deepEqual(NOTHING, [true, true, true, true, false, true, true, true, true]);
assert.equal(page.rates.children.length, 3);
// A ROW THAT COUNTS NO BLOCK has a dash in every cell: a section that holds none, and 500 francs
// for a Garage, which no block is. And a category whose rate would multiply nothing - a block
// that C made a room, whose category is a Ground cut - has no field of its own.
const CUT_ROOM = { x: [30, 34], y: [22, 26], z: [18, 24], colour: 1, category: 'ground-cut' };
const GARAGE = { sections: [{ id: 1, name: 'Garage' }], rates: { category: { garage: 500 } } };
await open(drawn([{ ...CUT_ROOM, is: 'room' }], GARAGE));
const DASHES = Array(4).fill('–');
assert.deepEqual(table('info-sections')[2], ['Garage', ...DASHES]);
assert.deepEqual(table('info-categories')[2], ['Garage', ...DASHES, 'CHF [500] per m³']);
assert.deepEqual(table('info-categories')[3], [
  'Ground cut',
  '4 m²',
  '0 m²',
  '12 m³',
  'no cost',
  '',
]);

// A TEXT THAT CANNOT BE READ: as the page opens, the fields are off and empty, no figure shows,
// and the line says so. And where another window wrote one, unheard here, a rate typed all the
// same writes nothing and sets nothing aside - the text is as it was - and no rate shows either.
const UNREAD = homes.slice(0, 40);
await open(UNREAD);
const LINE =
  'What this browser keeps as the sketch cannot be read, so nothing of it is counted, and no rate is taken. Nothing was changed.';
assert.deepEqual([said('info-said'), said('info-none'), said('info-house')], [LINE, null, null]);
assert.ok(['room', 'glass', 'open'].every((as) => field(`rate-${as}`).disabled));
await open(sketched(LISTED, ALL));
local.held.set(KEY, UNREAD);
assert.deepEqual(typed('rate-room', '700'), [UNREAD, 0]);
assert.deepEqual([said('info-said'), said('info-house'), ...local.held.keys()], [LINE, null, KEY]);
assert.deepEqual([field('rate-glass').value, field('rate-room').disabled], ['', true]);

// BLOCKS THROUGH MORE THAN ONE LEVEL: a tower of two boxes, one over the other, is one; three
// such towers are three. Neither has a word of it on the made-up house, above.
const box = (group, z) => ({ x: [group * 6, group * 6 + 4], y: [12, 16], z, colour: 3, group });
const tower = (group) => [box(group, [18, 24]), box(group, [12, 18])];
const THROUGH = 'through more than one level:';
const ROOM_SAID =
  'counted as one room, by the floor that it covers seen from above, on its lowest level.';
await open(drawn(tower(1)));
assert.equal(said('info-through'), `1 block reaches ${THROUGH} it is ${ROOM_SAID}`);
await open(drawn([1, 2, 3].flatMap(tower)));
assert.equal(said('info-through'), `3 blocks reach ${THROUGH} each is ${ROOM_SAID}`);
// And a kitchen over the day rooms and the porch, on their level: 6 m² of floor counted twice.
const KITCHEN = '{"x":[46,54],"y":[18,26],"z":[18,24],"colour":2,"name":"Kitchen"}';
await open(sketched(LISTED).replace('"things":[', `$&${KITCHEN},`));
const TWICE = 'On Level 814 m, 6 m² of floor are counted twice: blocks lie over each other there.';
assert.equal(said('info-twice'), TWICE);

// OF INFO.HTML THE TEXT: its policy asks nobody; its stylesheets; File, not seen; the switch told it
// is the seventh view; the sentence of the figures; its scripts in order, in its template, then boot.js.
const HTML = readFileSync(`${import.meta.dirname}/../info.html`, 'utf8');
const lines = HTML.split('\n').map((line) => line.trim());
const POLICY = `<meta http-equiv="Content-Security-Policy" content="connect-src 'none'" />`;
const GROUP = '<span class="group away" id="file-group" role="group" aria-labelledby="file-menu">';
const SWITCH = '<nav class="group" id="views" data-view="info"></nav>';
assert.ok([POLICY, GROUP, SWITCH].every((line) => lines.includes(line)));
const [linked, scripts] = ['<link', '<script'].map((tag) => lines.filter((l) => l.startsWith(tag)));
const sheet = (name) => `<link rel="stylesheet" href="${name}" />`;
assert.deepEqual(linked, ['frame.css', 'icons.css', 'info/info.css'].map(sheet));
const IS =
  "These figures are the sketch's own: the floor of a block as it is drawn, its walls included, and what the block encloses from its floor to its top. They are not the areas or the volumes that the building law counts.";
assert.ok(HTML.replace(/\s+/g, ' ').includes(`<p id="info-is" hidden> ${IS} </p>`));
const PAD = 'site squares paper figures shapes categories blocks legacy'.split(' ');
const NAMED = [...PAD, 'sketch', 'views', 'sections/model', 'info/rates', 'info/sums', 'info/page'];
const script = (name) => `<script src="${name}.js"></script>`;
assert.deepEqual(scripts, [...NAMED.map(script), '<script']);
const [opens, shuts] = ['<template id="scripts">', '</template>'].map((l) => lines.indexOf(l));
assert.deepEqual([lines[opens + 1], lines[shuts + 2]], [scripts[0], 'src="boot.js"']);

process.stdout.write(
  'tools/sketch/info: the Info page shows what the made-up house adds up to, cell for cell, takes a rate as it is typed, refuses what is none, and follows another window\n',
);
