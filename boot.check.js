// The check of a page's first script (ST-040, T-040.2, T-040.4): boot.js on made-up pages, loaded
// anew for each case - what the tab and the browser note, what the browser's store holds - with
// each page's own template of scripts, read off the page, and a made-up store/held.js handed in
// the place of the store: boot.js imports from where it lies, and here it lies in a folder of the
// system's temporary files, beside that store and a plot-file.js that is the pad's own. By hand:
// which plot each pair of notes shows - the example, under its own key, where none is noted -
// and what is noted after; the scripts put in, in their order, without site.js or with
// demo-site.js in its place, each with `async` false; the mark, on the last one's load and not
// before; GONE, both notes taken out and the example, where the plot is not held, does not read
// or the store fails; a store that will not be read or written changes nothing and throws
// nothing. And of the text: the two keys and the example's key are those of store/rules.js, and
// boot.js names no machine. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { read } from './plot-file.js';
import { keyOf, LAST, shownOf, TAB } from './store/rules.js';

const HERE = import.meta.dirname;
const text = (file) => fs.readFileSync(path.join(HERE, file), 'utf8');
const PLOTS = path.join(HERE, '..', '..', 'tests', '__fixtures__', 'plots');
const fixture = (id) => fs.readFileSync(path.join(PLOTS, id, 'plot.json'), 'utf8');

// Where boot.js is said to lie: a folder of its own, with the made-up store, which answers what
// the case holds, and the pad's own reader.
const made = fs.mkdtempSync(path.join(tmpdir(), 'blockplot-boot-'));
fs.mkdirSync(path.join(made, 'store'));
fs.writeFileSync(path.join(made, 'store', 'held.js'), 'export const plot = (id) => HELD(id);\n');
const reader = pathToFileURL(path.join(HERE, 'plot-file.js')).href;
fs.writeFileSync(path.join(made, 'plot-file.js'), `export * from ${JSON.stringify(reader)};\n`);
const SRC = pathToFileURL(path.join(made, 'boot.js')).href;

// The three pages' templates, read off the pages: of each tag its attributes, in their order.
const templateOf = (page) => {
  const [, inside] = /<template id="scripts">([\s\S]*?)<\/template>/.exec(text(page));
  return [...inside.matchAll(/<script\b([^>]*)>/g)].map(([, said]) =>
    [...said.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => ({ name, value })),
  );
};
const PAGES = Object.fromEntries(
  ['index.html', '3d.html', 'info.html'].map((p) => [p, templateOf(p)]),
);
const srcOf = (attributes) => attributes.find(({ name }) => name === 'src')?.value;

// The made-up store: a plot by its id - the two fixtures that read, one that does not, and one
// whose text is no plot - or a store that fails.
const RECORDS = {
  terrace: { id: 'terrace', text: fixture('terrace'), way: 'file' },
  home: { id: 'home', text: fixture('home'), way: 'folder' },
  broken: { id: 'broken', text: '{"format":"blockplot/plot"}', way: 'file' },
};
let loads = 0;
/**
 * boot.js, loaded anew on a made-up page of `page`, with the tab's note `tab` and
 * the browser's `last` - absent where undefined. `broken` is what of the browser does not work:
 * its stores' reading, their writing, the stores themselves, or the store of plots. It gives what
 * was put in - each as `[src, attributes, async]` - the notes after, how often they were written,
 * the globals that the script set, the mark, and a way to have the last script loaded.
 */
async function boot({ page = 'index.html', tab, last, broken = '' }) {
  const [put, asked, writes] = [[], [], { count: 0 }];
  const refuse = (what) => {
    if (broken === what) throw new Error(`the store refuses ${what}`);
  };
  const storeOf = (key, note) => {
    const kept = new Map(note === undefined ? [] : [[key, note]]);
    return {
      kept,
      getItem: (at) => (refuse('reading'), kept.get(at) ?? null),
      setItem: (at, value) => (refuse('writing'), (writes.count += 1), kept.set(at, value)),
      removeItem: (at) => (refuse('writing'), (writes.count += 1), kept.delete(at)),
    };
  };
  const [session, local] = [storeOf(TAB, tab), storeOf(LAST, last)];
  const tags = PAGES[page].map((attributes) => ({
    attributes,
    text: '',
    getAttribute: (name) => attributes.find((one) => one.name === name)?.value ?? null,
  }));
  // A new <script>: an attribute set again keeps its place, as a browser keeps it.
  const element = () => {
    const one = { attributes: [], async: true, text: null, heard: {} };
    one.setAttribute = (name, value) => {
      const at = one.attributes.findIndex((given) => given.name === name);
      const set = { name, value };
      one.attributes = at < 0 ? [...one.attributes, set] : one.attributes.with(at, set);
    };
    one.addEventListener = (type, hear) => (one.heard[type] = hear);
    return one;
  };
  const template = { content: { querySelectorAll: (what) => (what === 'script' ? tags : []) } };
  const document = {
    currentScript: { src: SRC },
    documentElement: { dataset: {} },
    getElementById: (id) => (id === 'scripts' ? template : null),
    createElement: (name) => (name === 'script' ? element() : null),
    // What the page holds as a script goes in: its plot and its site, set before it or not.
    body: {
      append: (one) =>
        put.push(Object.assign(one, { then: [globalThis.PLOT?.id, !!globalThis.SITE] })),
    },
  };
  const stores = { sessionStorage: session, localStorage: local };
  for (const [name, store] of Object.entries(stores)) {
    const get = () => (refuse('to be asked'), store);
    Object.defineProperty(globalThis, name, { get, configurable: true });
  }
  Object.assign(globalThis, { document });
  globalThis.HELD = async (id) => {
    asked.push(id);
    refuse('to hold');
    return RECORDS[id] ?? null;
  };
  for (const name of ['PLOT', 'SITE', 'GONE']) delete globalThis[name];
  await import(`./boot.js?${(loads += 1)}`);
  for (let wait = 0; put.length === 0 && wait < 400; wait += 1) {
    await new Promise((done) => globalThis.setTimeout(done, 5));
  }
  const noted = [...session.kept, ...local.kept].map(([key, value]) => `${key}=${value}`);
  return {
    put: put.map((one) => [srcOf(one.attributes), one.attributes, one.async]),
    notes: noted,
    writes: writes.count,
    asked,
    plot: globalThis.PLOT,
    site: globalThis.SITE,
    gone: globalThis.GONE,
    mark: () => document.documentElement.dataset.shown,
    then: put[0]?.then,
    loaded: () => put.at(-1).heard.load(),
  };
}

// The example, as the page shows it: demo-site.js in the place of site.js, which is first in each
// template and the one-line tag of a src alone; its PLOT under its own key.
const EXAMPLE = { id: 'example', key: 'blockplot/sketch/plot/example/space', way: 'example' };
const exampleOf = (page) =>
  PAGES[page].map((attributes, at) => {
    const src = at === 0 ? 'demo-site.js' : srcOf(attributes);
    return [src, at === 0 ? [{ name: 'src', value: src }] : attributes, false];
  });
for (const template of Object.values(PAGES)) {
  assert.deepEqual(template[0], [{ name: 'src', value: 'site.js' }]);
}

// Of each page, with nothing noted: the example, at once - every script of its template, in its
// order and with its attributes, demo-site.js in site.js's place, each `async` false; its PLOT
// set before them; nothing noted, the store of plots not asked. The mark comes with the last
// script's load, and not before: the id of the page's PLOT.
for (const page of Object.keys(PAGES)) {
  const one = await boot({ page });
  assert.deepEqual(one.put, exampleOf(page), page);
  assert.deepEqual(
    [one.plot, one.site, one.gone, one.notes, one.writes, one.asked, one.then],
    [EXAMPLE, undefined, undefined, [], 0, [], ['example', false]],
  );
  assert.equal(one.mark(), undefined);
  one.loaded();
  assert.equal(one.mark(), 'example');
  globalThis.PLOT = { id: 'home', key: 'blockplot/sketch/space' };
  one.loaded();
  assert.equal(one.mark(), 'home', page);
}
// The 3D page's module keeps its type and what it does where it does not load.
const solid = (await boot({ page: '3d.html' })).put.at(-1);
assert.deepEqual(solid.slice(0, 2), ['view3d/main.js', PAGES['3d.html'].at(-1)]);
assert.deepEqual(
  solid[1].map(({ name }) => name),
  ['type', 'src', 'onerror'],
);

// Which plot, of each pair of notes: none, an empty one, the example and a held plot, in the tab
// and as the last - as shownOf of store/rules.js says, and the example where it says none. What
// is shown is noted in both, and the example of nothing noted notes nothing.
const NOTES = [undefined, '', 'example', 'terrace'];
for (const tab of NOTES) {
  for (const last of NOTES) {
    const one = await boot({ tab, last });
    const id = shownOf(tab, last);
    const said = `${tab} and ${last}`;
    assert.equal(one.plot.id, id ?? 'example', said);
    const as = (key, note) => (note === undefined ? [] : [`${key}=${note}`]);
    const left =
      id === null ? [...as(TAB, tab), ...as(LAST, last)] : [...as(TAB, id), ...as(LAST, id)];
    assert.deepEqual(one.notes, left, said);
    assert.equal(
      one.writes,
      id === null ? 0 : [tab, last].filter((note) => note !== id).length,
      said,
    );
  }
}

// The example noted: as with nothing noted - its PLOT, under its own key, set before demo-site.js
// in site.js's place; the store of plots not asked - and noted in both.
const example = await boot({ tab: 'example' });
assert.deepEqual(example.put, exampleOf('index.html'));
assert.deepEqual(example.plot, EXAMPLE);
assert.deepEqual([example.site, example.asked], [undefined, []]);
assert.deepEqual(example.notes, [`${TAB}=example`, `${LAST}=example`]);
example.loaded();
assert.deepEqual([example.mark(), example.then], ['example', ['example', false]]);

// A held plot noted: its text read by the one reader, its PLOT under its own key and its way, and
// the scripts with no site.js. `home` keeps the first key. The mark is its id.
for (const [id, key] of [
  ['terrace', 'blockplot/sketch/plot/terrace/space'],
  ['home', 'blockplot/sketch/space'],
]) {
  const one = await boot({ page: '3d.html', last: id });
  assert.deepEqual(
    [one.asked, one.site, one.then],
    [[id], read(RECORDS[id].text).site, [id, true]],
  );
  assert.deepEqual(one.plot, { id, key, way: RECORDS[id].way });
  assert.deepEqual(
    one.put.map(([src]) => src),
    PAGES['3d.html'].slice(1).map(srcOf),
  );
  assert.deepEqual([one.notes, one.gone], [[`${TAB}=${id}`, `${LAST}=${id}`], undefined]);
  one.loaded();
  assert.equal(one.mark(), id);
}

// Not held, held and no plot, or a store that fails: GONE that id, both notes taken out, and
// the example - demo-site.js and every script after it, its PLOT set before them.
for (const [id, broken] of [
  ['nowhere', ''],
  ['broken', ''],
  ['terrace', 'to hold'],
]) {
  const one = await boot({ tab: id, last: 'home', broken });
  assert.deepEqual([one.gone, one.plot, one.site, one.notes], [id, EXAMPLE, undefined, []], id);
  assert.deepEqual([one.put, one.then], [exampleOf('index.html'), ['example', false]], id);
}

// A store that will not be read, or so much as asked, is no note: the example, noted nowhere.
// One that will not be written shows the plot noted all the same. None of them throws.
for (const broken of ['reading', 'to be asked']) {
  const one = await boot({ tab: 'example', last: 'terrace', broken });
  assert.deepEqual([one.plot, one.put[0][0], one.writes], [EXAMPLE, 'demo-site.js', 0], broken);
}
const unwritten = await boot({ last: 'terrace', broken: 'writing' });
assert.deepEqual([unwritten.plot?.id, unwritten.notes], ['terrace', [`${LAST}=terrace`]]);
const unremoved = await boot({ tab: 'nowhere', broken: 'writing' });
assert.deepEqual([unremoved.gone, unremoved.notes], ['nowhere', [`${TAB}=nowhere`]]);

// Of the text: the two keys and the example's key, stated a second time, are store/rules.js's;
// and boot.js names no machine and does not say fetch - the four other words of a request no
// file of the pad says, which swisstopo/named.check.js holds over this one too.
const code = text('boot.js');
const stated = (name) => new RegExp(`const ${name} = '([^']+)';`).exec(code)?.[1];
assert.deepEqual([stated('TAB'), stated('LAST')], [TAB, LAST]);
assert.equal(keyOf('example'), example.plot.key);
assert.equal(/fetch|https?:/.test(code), false);

fs.rmSync(made, { recursive: true, force: true });
process.stdout.write(
  'tools/sketch: a page shows the plot its tab notes, else the one shown last - the example under its own key, a held plot from the store with no site.js - puts its scripts in in their order, marks itself once the last has loaded, and a plot not held is GONE, its notes out\n',
);
