// The check of the gallery's named starting sizes (story ST-035, object-groups.js): the four
// starts, each `{ name, kind, sizes, place }` - no kind, of a kind that takes its sizes, in the
// place of a kind of that kind's group; what a pick of one sets down through strokes.js - its kind
// with its sizes, turned as asked, one step that Undo takes back to the byte - and a kind's key
// the kind as before, as it is where no start is loaded; and the picked key page.js keeps from the
// browser, a tile's alone. Cut out of gallery.check.js, which holds the tiles and their pictures.
// A made-up paper and store, as stretch.check.js makes them. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/gallery-starts.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
// The paper of stretch.check.js, from above: 146 columns down the plot and 71 rows across it.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const made = { CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, SPANS, INK: 'ink' };
Object.assign(made, { PLANE: 'top', FLIP: false, WIDE: 146, ROWS: 71, groundRow: () => 70 });
made.onSlice = (place, cut) => [place, cut];
globalThis.paper = made;
const LOADED = 'figures shapes object-groups categories blocks legacy sketch strokes';
for (const one of LOADED.split(' ')) await import(`./${one}.js`);
const { shapes, sketch } = globalThis;
const { KINDS, GROUPS, STARTS } = shapes;

// THE FOUR STARTS, by the story's table: their keys in order, none a key of `KINDS`; each of a
// kind that takes its sizes (`TAKES`, read by `shapes.known`) and in the place of a kind of the
// group its own kind stands in. A bed 1, 1.5 and 2 m wide, and a staircase 1.5 m wide.
const TABLE = {
  singlebed: ['Single bed', 'bed', { deep: 1 }, 'bed'],
  doublebed: ['Double bed', 'bed', { deep: 1.5 }, 'bed'],
  kingbed: ['King-size bed', 'bed', {}, 'bed'],
  widestaircase: ['Wide staircase, one storey', 'stairs', { deep: 1.5 }, 'widestairs'],
};
const as = ([name, kind, sizes, place]) => ({ name, kind, sizes, place });
assert.deepEqual(STARTS, Object.fromEntries(Object.entries(TABLE).map(([k, row]) => [k, as(row)])));
for (const [key, { kind, sizes, place }] of Object.entries(STARTS)) {
  assert.ok(!Object.hasOwn(KINDS, key) && shapes.known({ kind, ...sizes }), key);
  assert.ok(
    GROUPS.some(({ kinds }) => kinds.includes(kind) && kinds.includes(place)),
    key,
  );
}
// The bed's own name is "Bed": a bed dragged narrow is no king-size bed (ST-035).
assert.equal(KINDS.bed.name, 'Bed');

// A PICK SET DOWN, from above at cell (4, 4) of an empty sketch - on the ground - and turned a
// quarter: one step, the kind with the start's sizes, its middle where it was set down; Undo
// takes it back to the byte. A kind's key is the kind, as ever - and so a start's, where
// object-groups.js was not loaded.
sketch.doc = sketch.adopt(sketch.blank());
const text = JSON.stringify(sketch.doc);
/** What a click of the Object tool with `key` sets down, and how many steps it took. */
function setDown(key) {
  const steps = sketch.past.length;
  sketch.apply({ tool: 'object', from: [4, 4], to: [4, 4], kind: key, turned: 1 });
  const out = [sketch.doc.things.at(-1), sketch.past.length - steps];
  sketch.step(sketch.past, sketch.future);
  assert.equal(JSON.stringify(sketch.doc), text, `${key}: undone`);
  return out;
}
const at = { x: 4, y: 4, turn: 1, floor: 'ground' };
const SET_DOWN = {
  singlebed: { kind: 'bed', ...at, deep: 1 },
  doublebed: { kind: 'bed', ...at, deep: 1.5 },
  kingbed: { kind: 'bed', ...at },
  widestaircase: { kind: 'stairs', ...at, deep: 1.5 },
  bed: { kind: 'bed', ...at },
  widestairs: { kind: 'widestairs', ...at },
};
for (const [key, thing] of Object.entries(SET_DOWN))
  assert.deepEqual(setDown(key), [thing, 1], key);
delete shapes.STARTS;
assert.deepEqual(sketch.placed('singlebed', [4, 4], 0).kind, 'singlebed');
shapes.STARTS = STARTS;

// THE PICKED KEY page.js keeps from the browser (its line of `kind`): a tile's, a kind's or a
// start's; any other - the bed and the wide staircase that have no tile now, or nothing - is the
// person. The line is read from page.js, which wants a whole page to load, and asked alone.
const line = readFileSync(`${import.meta.dirname}/page.js`, 'utf8')
  .split('\n')
  .map((one) => one.trim())
  .find((one) => one.startsWith('let kind = '));
const kept = (picked) =>
  new Function('shapes', 'seen', `${line} return kind;`)(shapes, { kind: picked });
const PICKED = {
  singlebed: 'singlebed',
  widestaircase: 'widestaircase',
  sofa: 'sofa',
  stairs: 'stairs',
};
Object.assign(PICKED, {
  bed: 'person',
  widestairs: 'person',
  kingsize: 'person',
  undefined: 'person',
});
for (const [picked, kind] of Object.entries(PICKED))
  assert.equal(kept(picked === 'undefined' ? undefined : picked), kind, picked);

process.stdout.write(
  'tools/sketch: the gallery has four named starting sizes, each no kind but of a kind that takes its sizes; a pick of one sets down its kind with those sizes, in one step; and page.js keeps a picked tile alone, else the person\n',
);
