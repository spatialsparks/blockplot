// The check of the switch of swisstopo's map under the top view (ST-046, T-046.3): the decisions
// of under/switch.js that need no page, by hand - what the tab keeps of the control and what it
// reads back, of this tree and of one without the cadastral map, Blockplot's; a figure of the
// slider out of range; the names of the choices; and where index.html has the control and its
// script. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/under/switch.check.js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import process from 'node:process';
import { URL } from 'node:url';
import { LAYERS, layersOf } from '../swisstopo/hosts.js';
import { FIRST } from './lay.js';
import { KEY, NAMES, TITLE, choicesOf, keptOf, percentOf, readOf } from './switch.js';
import { strengthOfPercent } from './switch.js';

// The page's script, loaded in Node, sets nothing: it has no page.
assert.equal(globalThis.under, undefined);
assert.equal(KEY, 'blockplot/sketch/under');
assert.ok(TITLE.length > 0);

// Two trees: one with a cadastral map, made up here, and Blockplot's, with none (ADR-0190).
const WITH = layersOf({ layer: 'made.up.cadastre', ending: 'png', to: 28, credit: '© made up' });
const WITHOUT = layersOf(null);
assert.deepEqual(Object.keys(WITH), ['national', 'cadastral', 'photo']);
assert.deepEqual(Object.keys(WITHOUT), ['national', 'photo']);

// THE CHOICES: every layer of the tree, in its order, by its words - the photo among them, which
// is the first chosen, in each tree.
assert.deepEqual(choicesOf(WITH), [
  { id: 'national', name: 'National map' },
  { id: 'cadastral', name: 'Cadastral map' },
  { id: 'photo', name: 'Aerial photo' },
]);
assert.deepEqual(choicesOf(WITHOUT), [
  { id: 'national', name: 'National map' },
  { id: 'photo', name: 'Aerial photo' },
]);
assert.deepEqual(choicesOf({ other: {} }), [{ id: 'other', name: 'other' }], 'no name: its own');
assert.ok(Object.hasOwn(LAYERS, FIRST.layer) && Object.hasOwn(WITHOUT, FIRST.layer));
assert.deepEqual(Object.keys(NAMES), ['national', 'cadastral', 'photo']);

// WHAT THE TAB KEEPS: the three settings as a text, and nothing else of the flag.
const FIRST_KEPT = '{"on":false,"layer":"photo","strength":0.5}';
assert.equal(keptOf(FIRST), FIRST_KEPT);
const flag = { on: true, layer: 'national', strength: 0.3, shows: () => true, offered: null };
assert.equal(keptOf(flag), '{"on":true,"layer":"national","strength":0.3}');
assert.equal(
  keptOf({ on: 'yes', layer: 'photo', strength: 7 }),
  '{"on":false,"layer":"photo","strength":1}',
);

// AND READ BACK: what was kept, as it was, in either tree where the tree has its layer.
for (const tree of [WITH, WITHOUT]) {
  assert.deepEqual(readOf(FIRST_KEPT, tree), FIRST);
  assert.deepEqual(readOf(keptOf(flag), tree), { on: true, layer: 'national', strength: 0.3 });
  assert.deepEqual(readOf(keptOf({ on: true, layer: 'photo', strength: 0 }), tree), {
    on: true,
    layer: 'photo',
    strength: 0,
  });
}
const cadastral = keptOf({ on: true, layer: 'cadastral', strength: 0.2 });
assert.deepEqual(readOf(cadastral, WITH), { on: true, layer: 'cadastral', strength: 0.2 });
// A layer that the tree does not have - the cadastral map in Blockplot's - is the photo, the rest kept.
assert.deepEqual(readOf(cadastral, WITHOUT), { on: true, layer: 'photo', strength: 0.2 });
for (const layer of ['toString', '__proto__', 'constructor', '', 'photo ', 3, null])
  assert.equal(readOf(JSON.stringify({ on: true, layer, strength: 0.2 }), WITH).layer, 'photo');
// Nothing kept - a new tab - or what is no such text: the control as a pad opens it.
for (const text of [null, '', 'nonsense', '[1]', '"on"', '17', 'null', '{"on":tru'])
  assert.deepEqual(readOf(text, WITH), FIRST, String(text));
// On only where it says so, to the letter.
for (const on of ['true', 1, {}, null])
  assert.equal(readOf(JSON.stringify({ on }), WITH).on, false);
// A strength kept out of range is held to it; one that is no figure is half.
const strengthIn = (strength) => readOf(JSON.stringify({ on: true, strength }), WITH).strength;
assert.deepEqual([1.7, -0.2, 0.25, 1, 0].map(strengthIn), [1, 0, 0.25, 1, 0]);
assert.deepEqual(['0.3', null, true, [0.3]].map(strengthIn), [0.5, 0.5, 0.5, 0.5]);
assert.equal(readOf('{"on":true}', WITH).strength, 0.5);

// THE SLIDER: a whole per cent, from 0 to 100, as the <input> gives it, and back.
assert.deepEqual(['20', '0', '100', '50', '33'].map(strengthOfPercent), [0.2, 0, 1, 0.5, 0.33]);
assert.deepEqual(['150', '-5', '1e9'].map(strengthOfPercent), [1, 0, 1], 'out of range: held');
assert.deepEqual(['', ' ', 'abc', undefined, 20].map(strengthOfPercent), [0.5, 0.5, 0.5, 0.5, 0.5]);
assert.deepEqual(
  [0.2, 0.5, 0, 1, 0.333, 0.005, 2, -1].map(percentOf),
  [20, 50, 0, 100, 33, 1, 100, 0],
);
assert.equal(percentOf(Number.NaN), 50);
for (let percent = 0; percent <= 100; percent += 1)
  assert.equal(percentOf(strengthOfPercent(String(percent))), percent, String(percent));

// IT IMPORTS lay.js and hosts.js alone as it loads: place.js, which asks for map/ - which the
// made-up pad does not serve - only where the map is offered.
const script = fs.readFileSync(new URL('switch.js', import.meta.url), 'utf8');
assert.deepEqual(
  [...script.matchAll(/^import .* from '([^']+)';$/gm)].map(([, from]) => from),
  ['../swisstopo/hosts.js', './lay.js'],
);
assert.ok(script.includes("await import('./place.js')"));
// It keeps nothing but in the tab's sessionStorage, under its key: no localStorage, no store.
assert.ok(!/localStorage|indexedDB|sketch\.|PLOT/.test(script.replace(/^\/\/.*$/gm, '')));

// OF index.html: the control in the View group, after Zoom to fit, hidden until the script shows
// it; and the script, a module, once, after page.js, which wires the zoom that it redraws.
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const trimmed = html.split('\n').map((line) => line.trim());
const group = html.slice(html.indexOf('id="view-group"'), html.indexOf('id="edit-group"'));
for (const part of ['id="under-control" hidden', 'id="under-on"', 'id="under-strength"'])
  assert.equal(group.split(part).length, 2, part);
assert.ok(group.indexOf('id="fit"') < group.indexOf('id="under-control"'));
const range = /<input type="range" id="under-strength" min="0" max="100"/;
assert.ok(range.test(group), 'the slider, 0 to 100');
assert.ok(/<input type="checkbox" id="under-on" \/>/.test(group), 'the switch, off');
// The choice of map is a menu, as File is: a button that opens its part, which the script fills
// with an entry a layer and hands views.menu - and no list, in the page or made by the script.
const button =
  /<button\s+type="button"\s+id="under-layer"\s+aria-expanded="false"\s+aria-controls="under-layers"\s*><\/button>/;
assert.ok(button.test(group), 'the button of the choice, empty, shut');
assert.equal(group.split('<span class="menu" id="under-layers" hidden></span>').length, 2);
assert.ok(group.indexOf('id="under-on"') < group.indexOf('id="under-layer"'));
assert.ok(group.indexOf('id="under-layers"') < group.indexOf('id="under-strength"'));
assert.ok(!/select|option/i.test(script.replace(/^\s*\/\/.*$/gm, '')), 'no list made');
assert.ok(script.includes('globalThis.views.menu(layer, entries)'), 'a menu, as File is');
const SCRIPT = '<script type="module" src="under/switch.js"></script>';
assert.equal(html.split(SCRIPT).length, 2, SCRIPT);
assert.equal(trimmed[trimmed.indexOf(SCRIPT) - 1], '<script src="page.js"></script>');

process.stdout.write(
  'under/switch.js holds: what the tab keeps of the map under the top view, and reads back\n',
);
