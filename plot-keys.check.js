// The check of what a browser keeps by plot (ST-030): the pad's own scripts on made-up stores
// and a made-up page, loaded anew as a page of a plot loads them - with the plot and its key
// (`PLOT`) set before them, as boot.js sets it, and with none, as in every check that loads
// demo-site.js. By hand: the whole store after a change, a plot's
// sketch and what is set aside for it under the plot's own key, and the first key with what is
// set aside under it untouched; the tab's steps and what it showed, what each writes on either
// key and what a page takes up; the sketches of before, the first key's alone; a plot with no
// area, in the toolbar's words and in the page's check of its site. The kept sketches go by the
// page's plot too: kept.check.js holds it. No browser, no server, and no plot but made-up
// ones. Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/plot-keys.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runInNewContext } from 'node:vm';
import { VERSION } from './check-golden.js';
import { read } from './plot-file.js';

// A browser's two stores, each with what it holds, and counting how often it was asked to write.
const store = () => {
  const one = { kept: new Map(), writes: 0, getItem: (key) => one.kept.get(key) ?? null };
  one.setItem = (key, text) => (one.writes += 1) && one.kept.set(key, text);
  return one;
};
const [local, session] = [store(), store()];
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const held = (one) => Object.fromEntries(one.kept);

// A made-up page: the parts that the switch of views writes into keep what they are told, and
// whoever is to hear that the page goes is called by hand, as a browser calls them.
const parts = {};
const part = () => ({ dataset: {}, append() {}, setAttribute() {} });
const document = { getElementById: (id) => parts[id], createElement: part, addEventListener() {} };
const location = { hash: '', assign() {}, reload() {} };
let going = [];
const addEventListener = (type, hear) => type === 'pagehide' && going.push(hear);
Object.assign(globalThis, { document, location, addEventListener });

// The made-up plots: the pad's own example, as the made-up pad's script says it, and the two of
// the tests that read, each as the one reader gives it - and as a page gets it, from boot.js.
const HERE = import.meta.dirname;
const plots = path.join(HERE, '..', '..', 'tests', '__fixtures__', 'plots');
const siteOf = (id) => read(readFileSync(path.join(plots, id, 'plot.json'), 'utf8')).site;
const SITES = { home: siteOf('home'), terrace: siteOf('terrace') };
await import('./demo-site.js');
const MADE_UP = globalThis.SITE;
// The first key, and the keys of two plots; home's is the first.
const SPACE = 'blockplot/sketch/space';
const [STEPS, SEEN] = [`${SPACE}/steps`, 'blockplot/sketch/seen'];
const HOME = { id: 'home', key: SPACE };
const TERRACE = { id: 'terrace', key: 'blockplot/sketch/plot/terrace/space' };
const SECOND = { id: 'second', key: 'blockplot/sketch/plot/second/space' };

let loads = 0;
/**
 * The pad's scripts, loaded anew on what the two stores are to hold: with a plot's PLOT set
 * before them, as boot.js sets it - or with none, on the made-up site. It
 * gives the sketch, the paper, the switch's own, the words of the toolbar, and what the page
 * does as it goes. `view` is what the switch says of itself: `3d` on the 3D page.
 */
async function page({ plot = null, site = MADE_UP, hash = '', view } = {}, kept = {}, tab = {}) {
  Object.assign(local, { kept: new Map(Object.entries(kept)), writes: 0 });
  Object.assign(session, { kept: new Map(Object.entries(tab)), writes: 0 });
  delete globalThis.PLOT;
  globalThis.SITE = site;
  if (plot) globalThis.PLOT = { ...plot };
  assert.deepEqual(globalThis.PLOT, plot ?? undefined);
  Object.assign(parts, { views: part(), title: part(), paper: part() });
  Object.assign(parts.views.dataset, { view });
  [location.hash, going, loads] = [hash, [], loads + 1];
  const scripts = 'paper figures shapes categories blocks legacy sketch views'.split(' ');
  for (const script of scripts) await import(`./${script}.js?${loads}`);
  const { sketch, paper, views } = globalThis;
  const leave = () => going.forEach((go) => go());
  return { sketch, paper, views, title: parts.title.textContent, leave };
}

// A sketch as the pad writes one, a text that it cannot read, and an old sketch of the top view.
const box = (column) => ({ x: [column, column + 4], y: [10, 14], z: [30, 36], colour: 1 });
const draw = (column) => (doc) => doc.things.push(box(column));
const rest = () => ({ floors: [], notes: [], on: {}, show: { top: {} } });
const asDoc = (things) => ({ space: VERSION, things, ...rest() });
const drawn = (...columns) => JSON.stringify(asDoc(columns.map(box)));
const CUT_SHORT = '{"space":7,"things":[{"x":[10,14],"y":[10,14],"z":[30,3';
const sheet = { name: 'Level 817 m', level: 817, blocks: [[52, 32, 60, 40, 4]] };
const old = { view: 'top', current: 0, sheets: [{ ...sheet, lines: [], labels: [] }] };
const BEFORE = { 'blockplot/sketch/top': JSON.stringify(old) };

// With no PLOT the sketch is kept under the first key, as it was: one write for a change, the
// whole store what it was but for that key - and what a plot keeps is not touched. A plot whose
// key is the first, home, is kept so too.
const OTHERS = { [TERRACE.key]: drawn(70), [`${TERRACE.key}/unread/1`]: CUT_SHORT };
for (const plot of [null, HOME]) {
  const { sketch } = await page({ plot, site: SITES.home }, { [SPACE]: drawn(40), ...OTHERS });
  assert.deepEqual([sketch.KEY, JSON.stringify(sketch.doc), local.writes], [SPACE, drawn(40), 0]);
  sketch.change(draw(10));
  assert.deepEqual([held(local), local.writes], [{ ...OTHERS, [SPACE]: drawn(40, 10) }, 1]);
  local.kept.set(SPACE, CUT_SHORT);
  sketch.change(draw(20));
  const aside = { [`${SPACE}/unread/1`]: CUT_SHORT, [SPACE]: drawn(40, 10, 20) };
  assert.deepEqual(held(local), { ...OTHERS, ...aside });
}
// A plot's sketch is kept under the plot's own key. The page opens on what that key holds - on
// nothing, where it holds nothing: not on the first key's sketch, and not on a sketch of before
// - and a change writes that key alone: the first key, what is set aside under it and the
// sketches of before are as they were, to the byte.
const FIRST = { [SPACE]: drawn(40), [`${SPACE}/unread/1`]: CUT_SHORT, ...BEFORE };
{
  const { sketch } = await page({ plot: TERRACE, site: SITES.terrace }, FIRST);
  assert.deepEqual(
    [sketch.KEY, JSON.stringify(sketch.doc), sketch.trouble],
    [TERRACE.key, drawn(), ''],
  );
  assert.deepEqual(
    [sketch.unread(), sketch.stored(), local.writes],
    [{ aside: [], waiting: null }, null, 0],
  );
  sketch.change(draw(10));
  assert.deepEqual([held(local), local.writes], [{ ...FIRST, [TERRACE.key]: drawn(10) }, 1]);
  const again = await page({ plot: TERRACE, site: SITES.terrace }, held(local));
  assert.equal(JSON.stringify(again.sketch.doc), drawn(10));
  // What the plot's key holds and the pad cannot read is set aside under that key, and there
  // alone; and what is set aside for the first key is none of this plot's.
  const unread = await page({ plot: TERRACE }, { ...FIRST, [TERRACE.key]: CUT_SHORT });
  assert.deepEqual(unread.sketch.unread(), { aside: [], waiting: CUT_SHORT });
  unread.sketch.change(draw(30));
  const aside = { [`${TERRACE.key}/unread/1`]: CUT_SHORT, [TERRACE.key]: drawn(30) };
  assert.deepEqual([held(local), local.writes], [{ ...FIRST, ...aside }, 2]);
  assert.deepEqual(unread.sketch.unread(), { aside: [CUT_SHORT], waiting: null });
}

// The sketches of before are the first key's alone: brought over where the page keeps under
// that key and it holds nothing, and on no other key. They stay in the browser as they were.
for (const [plot, things] of [
  [null, 1],
  [HOME, 1],
  [TERRACE, 0],
  [SECOND, 0],
]) {
  const { sketch } = await page({ plot }, BEFORE);
  assert.deepEqual([sketch.doc.things.length, held(local)], [things, BEFORE], plot?.id);
}

// The tab's steps: one slot, under the first key. As the page goes, a plot's steps say whose
// they are - but the first key's, which say nothing: that text is, byte for byte, what the pad
// wrote before there were plots. What the tab showed is kept the same way.
const SHOWN = { tool: 'block', px: 10 };
const [STEP, SAW] = [
  `{"past":[${JSON.stringify(drawn(40))}],"future":[]`,
  '{"tool":"block","px":10',
];
const written = {};
for (const plot of [null, HOME, TERRACE, SECOND]) {
  const { sketch, views, leave } = await page({ plot }, { [plot?.key ?? SPACE]: drawn(40) });
  sketch.change(draw(10));
  views.keep(() => SHOWN);
  assert.deepEqual([sketch.past, held(session)], [[drawn(40)], {}], 'kept before the page goes');
  leave();
  const whose = plot === null || plot === HOME ? '}' : `,"of":"${plot.key}"}`;
  assert.deepEqual(
    held(session),
    { [STEPS]: `${STEP}${whose}`, [SEEN]: `${SAW}${whose}` },
    plot?.id,
  );
  written[plot?.id ?? 'none'] = held(session);
}
assert.equal(written.terrace[STEPS], `${STEP},"of":"blockplot/sketch/plot/terrace/space"}`);
// A page takes up what the tab kept of its own plot, and of no other: steps and what was shown
// that say nothing are the first key's, and are nothing to a page of another plot; a plot's are
// nothing to the first key's page, and to another plot's. Taking up writes nothing.
const TAKEN = [
  ['none', null, true],
  ['none', HOME, true],
  ['home', null, true],
  ['none', TERRACE, false],
  ['terrace', TERRACE, true],
  ['terrace', SECOND, false],
  ['terrace', null, false],
  ['terrace', HOME, false],
  ['second', TERRACE, false],
];
for (const [kept, plot, taken] of TAKEN) {
  const { sketch, views } = await page({ plot }, {}, written[kept]);
  const [past, seen] = taken ? [[drawn(40)], SHOWN] : [[], {}];
  assert.deepEqual(
    [sketch.past, sketch.future, views.seen],
    [past, [], seen],
    `${kept} on ${plot?.id}`,
  );
  assert.deepEqual([held(session), session.writes], [written[kept], 0]);
}
// And they are gone on the way back: a page of another plot has no step of the first one's, and
// writes its own into the slot as it goes - what it showed too, with what the tab showed before
// left out. Through a reload and another view of one plot, the steps and what it showed stay.
{
  const other = await page({ plot: SECOND }, {}, written.terrace);
  other.views.keep(() => ({ tool: 'line' }));
  other.leave();
  const whose = `"of":"${SECOND.key}"}`;
  assert.deepEqual(held(session), {
    [STEPS]: `{"past":[],"future":[],${whose}`,
    [SEEN]: `{"tool":"line",${whose}`,
  });
  const back = await page({ plot: TERRACE }, {}, held(session));
  assert.deepEqual([back.sketch.past, back.views.seen], [[], {}]);
  const same = await page(
    { plot: TERRACE, hash: '#side' },
    { [TERRACE.key]: drawn(40, 10) },
    written.terrace,
  );
  same.views.keep(() => ({ px: 12 }));
  same.leave();
  const seen = `{"tool":"block","px":12,"of":"${TERRACE.key}"}`;
  assert.deepEqual(held(session), { [STEPS]: written.terrace[STEPS], [SEEN]: seen });
  // Two parts of one page that each have the tab keep what they show: both are kept.
  const both = await page({ plot: SECOND }, {}, written.terrace);
  for (const shows of [{ tool: 'line' }, { distancesShown: false }]) both.views.keep(() => shows);
  both.leave();
  assert.equal(held(session)[SEEN], `{"tool":"line","distancesShown":false,${whose}`);
}
// Another window is heard by the key of the page's own sketch: the two that listen ask it.
const text = (file) => readFileSync(path.join(HERE, file), 'utf8');
assert.ok(text('page.js').includes('if (event.key === sketch.KEY) sketch.doc = sketch.stored()'));
assert.match(text('view3d/read.js'), /^const \{ KEY \} = sketch;$[\s\S]+event\.key === KEY \|\|/m);

// What a plot does not say, the pad does not check, and does not show. A plot that states an
// area has it after its name, from above and in 3D, and the page holds its outline against it,
// to a square metre; one that states none shows its name alone, and has no alarm for it.
const says = async (how) => {
  const { title, paper } = await page(how);
  return [title, paper.siteFaults()];
};
assert.deepEqual(await says({}), ['Made-up hillside plot, 644 m²', []]);
assert.deepEqual(await says({ plot: HOME, site: SITES.home }), [
  'Made-up orchard plot, 300 m²',
  [],
]);
const NAMED = 'Made-up terrace, by the lake / north';
for (const view of [undefined, '3d']) {
  assert.deepEqual(await says({ plot: TERRACE, site: SITES.terrace, view }), [NAMED, []]);
}
const SLICE = 'A slice along the plot, seen from the north-east';
assert.deepEqual(await says({ plot: TERRACE, site: SITES.terrace, hash: '#side' }), [SLICE, []]);
const FAULT = 'the outline encloses 300.0 m², and the land register states 302 m²';
const stating = (officialAreaM2) => says({ plot: HOME, site: { ...SITES.home, officialAreaM2 } });
assert.deepEqual(await stating(302), ['Made-up orchard plot, 302 m²', [FAULT]]);
assert.deepEqual(await stating(301), ['Made-up orchard plot, 301 m²', []]);
const { officialAreaM2: stated, ...unstated } = SITES.home;
assert.deepEqual([stated, await says({ site: unstated })], [300, ['Made-up orchard plot', []]]);

// And a page whose first script did not come says so in its alarm: boot.js, the page's last
// (T-040.2), on a made-up page. The plot's place, site.js, first in the template, says nothing:
// boot.js puts demo-site.js there, or nothing (T-040.4).
const tags = [...text('index.html').matchAll(/<script\b[^>]*>/g)].map(([tag]) => tag);
const [alarm, TAG] = [{}, /^<script\s+src="([^"]+)"\s+onerror="([^"]+)"\s*>$/];
const failing = { document: { getElementById: (id) => (id === 'alarm' ? alarm : null) } };
const ran = ([, src, failed]) => [src, (runInNewContext(failed, failing), alarm.textContent)];
const NO_BOOT = 'The pad did not start: its first script did not load. Reload the page.';
assert.deepEqual(
  [tags[0], ran(TAG.exec(tags.at(-1)))],
  ['<script src="site.js">', ['boot.js', NO_BOOT]],
);
assert.equal(tags.filter((tag) => tag.includes('onerror')).length, 1);
assert.match(text('3d.html'), /<p id="said" role="status">\s+The 3D view did not load\. It comes/);
process.stdout.write(
  "tools/sketch: a plot's sketch, its steps and what its tab showed are kept and taken up by the plot's own key, the first key is as it was, and a plot that states no area shows its name alone\n",
);
